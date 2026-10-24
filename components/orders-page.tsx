"use client";

import { Fragment, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleEllipsis, Clock3, Copy, MoreHorizontal, PackageCheck, ReceiptText, RotateCcw, Search, ShoppingBag, WalletCards } from "lucide-react";
import { toast } from "sonner";

import "./bill-page.css";

import { EditableText } from "@/components/editable-text";
import { ManagedStatusTag, OrderDetailDrawer, type OrderDrawerFocus } from "@/components/order-detail-drawer";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeading, formatMoney, type CopyUpdater } from "@/components/user-center-shared";
import { money } from "@/data/card-business";
import {
  accountStatusOptions, getOrderActions, getUnifiedStatus, orderManagementMock, rechargeStatusOptions, unifiedStatusOptions,
  type ManagedOrder, type ManagedOrderKind, type ManagedOrderStatus, type OrderActionId, type UnifiedOrderStatus,
} from "@/data/order-management";
import {
  billFlowTypeLabel, defaultBillFlows, platformFlowTypeLabel, type BillFlowItem, type BillFlowType, type PlatformFlow,
} from "@/data/bill-flows";
import { type DemoContent } from "@/data/content";

type OrderTab = "all" | ManagedOrderKind;
type QuickFilter = OrderTab | "pending";
type StatusFilter = "all" | ManagedOrderStatus | UnifiedOrderStatus;
type TimeFilter = "all" | "7" | "30" | "90" | "custom";
/** 订单页 / 资金流水页共用一套表格：mode 决定渲染哪一半，菜单里一分为二。 */
type BillMode = "orders" | "flows";
/** 资金流水分类：平台余额的进和出。卡内消费属于「卡流水」，不在这里。 */
type FlowCategory = "topup" | "recharge_service" | "account_service" | "commission" | "card";
type FlowFilter = "all" | "topup" | "recharge_service" | "account_service" | "refund" | "card";
type FlowStatusFilter = "all" | "success" | "processing" | "failed";
/** 账单周期：按自然月对账，本月 / 上月 / 近 3 个自然月 / 全部。 */
type BillPeriod = "month" | "lastMonth" | "quarter" | "all";

const PAGE_SIZE = 10;
const DEMO_NOW = new Date("2026-09-15T23:59:59");

const PERIOD_LABEL: Record<BillPeriod, string> = {
  month: "本月",
  lastMonth: "上月",
  quarter: "近 3 个月",
  all: "全部",
};

function parseFlowTime(time: string) {
  return new Date(time.replace(" ", "T"));
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** 周期边界：自然月，含首尾两天。全部周期返回 null。 */
function billPeriodRange(period: BillPeriod): { start: Date | null; end: Date | null } {
  if (period === "all") return { start: null, end: null };
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (period === "month") return { start: new Date(year, month, 1), end: new Date(year, month + 1, 0, 23, 59, 59) };
  if (period === "lastMonth") return { start: new Date(year, month - 1, 1), end: new Date(year, month, 0, 23, 59, 59) };
  return { start: new Date(year, month - 2, 1), end: new Date(year, month + 1, 0, 23, 59, 59) };
}

function formatDayLabel(day: string) {
  const date = new Date(`${day}T00:00:00`);
  const week = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${week}`;
}

function actionLabel(id: OrderActionId, content: DemoContent) {
  if (id === "cancel") return content.cancelOrder;
  if (id === "progress") return content.queryProgress;
  if (id === "credentials") return content.viewCredentials;
  if (id === "download") return content.downloadAction;
  return content.viewDetails;
}

function withinTimeRange(order: ManagedOrder, range: TimeFilter, customFrom: string, customTo: string) {
  if (range === "all") return true;
  const created = new Date(order.createdAt.replace(" ", "T"));
  if (range === "custom") {
    const from = customFrom ? new Date(`${customFrom}T00:00:00`) : null;
    const to = customTo ? new Date(`${customTo}T23:59:59`) : null;
    return (!from || created >= from) && (!to || created <= to);
  }
  const cutoff = new Date(DEMO_NOW);
  cutoff.setDate(cutoff.getDate() - Number(range));
  return created >= cutoff && created <= DEMO_NOW;
}

export function OrdersPage({
  content, editMode, updateContent, mode = "orders", extraOrders = [], platformFlows = [],
}: {
  content: DemoContent;
  editMode: boolean;
  updateContent: CopyUpdater;
  /** orders = 商品订单（挂在「商品」下）；flows = 平台余额流水（独立菜单） */
  mode?: BillMode;
  extraOrders?: ManagedOrder[];
  /** 平台余额流水（充值、开卡扣费、卡充值、卡退款、销卡退款），由页面状态传入，能反映本次操作 */
  platformFlows?: PlatformFlow[];
}) {
  const [orders, setOrders] = useState(() => [...extraOrders.map((order) => ({ ...order })), ...orderManagementMock.map((order) => ({ ...order }))]);
  const [billFlows] = useState<BillFlowItem[]>(() => defaultBillFlows.map((flow) => ({ ...flow })));
  const [flowFilter, setFlowFilter] = useState<FlowFilter>("all");
  const [flowStatus, setFlowStatus] = useState<FlowStatusFilter>("all");
  const [flowSearch, setFlowSearch] = useState("");
  const [collapsedDays, setCollapsedDays] = useState<string[]>([]);
  const [period, setPeriod] = useState<BillPeriod>("month");
  const [tab, setTab] = useState<OrderTab>("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState<TimeFilter>("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOrder, setDrawerOrder] = useState<ManagedOrder | null>(null);
  const [drawerFocus, setDrawerFocus] = useState<OrderDrawerFocus>("summary");
  const [cancelTarget, setCancelTarget] = useState<ManagedOrder | null>(null);

  const statusOptions = tab === "account" ? accountStatusOptions : tab === "recharge" ? rechargeStatusOptions : unifiedStatusOptions;
  const counts = useMemo(() => ({
    all: orders.length,
    account: orders.filter((order) => order.kind === "account").length,
    recharge: orders.filter((order) => order.kind === "recharge").length,
    pending: orders.filter((order) => getUnifiedStatus(order) === "processing").length,
  }), [orders]);
  const recentCount = useMemo(() => orders.filter((order) => withinTimeRange(order, "30", "", "")).length, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      if (tab !== "all" && order.kind !== tab) return false;
      if (quickFilter === "pending" && getUnifiedStatus(order) !== "processing") return false;
      if (status !== "all") {
        if (tab === "all" && getUnifiedStatus(order) !== status) return false;
        if (tab !== "all" && order.status !== status) return false;
      }
      if (query && !order.id.toLowerCase().includes(query) && !order.productName.toLowerCase().includes(query)) return false;
      return withinTimeRange(order, timeRange, customFrom, customTo);
    });
  }, [customFrom, customTo, orders, quickFilter, searchTerm, status, tab, timeRange]);

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const visibleOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilters = Boolean(searchTerm) || status !== "all" || timeRange !== "30" || quickFilter === "pending";

  const selectTab = (next: OrderTab) => { setTab(next); setQuickFilter(next); setStatus("all"); setPage(1); };
  const selectQuickFilter = (next: QuickFilter) => {
    if (next !== "pending") { setTab(next); setStatus("all"); } else setStatus("all");
    setQuickFilter(next); setPage(1);
  };
  const resetFilters = () => {
    setSearchTerm(""); setStatus("all"); setTimeRange("30"); setCustomFrom(""); setCustomTo(""); setQuickFilter(tab); setPage(1);
  };
  const openDrawer = (order: ManagedOrder, focus: OrderDrawerFocus = "summary") => { setDrawerOrder(order); setDrawerFocus(focus); };
  const handleAction = (id: OrderActionId, order: ManagedOrder) => {
    if (id === "cancel") return setCancelTarget(order);
    if (id === "download") return toast.success("Demo：凭据下载成功");
    if (id === "progress") return openDrawer(order, "progress");
    if (id === "credentials") return openDrawer(order, "credentials");
    openDrawer(order, "summary");
  };
  const confirmCancel = () => {
    if (!cancelTarget) return;
    setOrders((current) => current.map((order) => order.id === cancelTarget.id ? { ...order, status: "account_cancelled" } : order));
    if (drawerOrder?.id === cancelTarget.id) setDrawerOrder({ ...drawerOrder, status: "account_cancelled" });
    setCancelTarget(null); toast.success("订单已取消 · Mock 状态已更新");
  };
  const copyOrderId = async (id: string) => {
    try { await navigator.clipboard.writeText(id); toast.success("订单号已复制"); } catch { toast.info("复制订单号为 Demo 交互"); }
  };

  const statCards = [
    { id: "all" as const, icon: ReceiptText, labelKey: "allOrdersTab" as const, count: counts.all },
    { id: "account" as const, icon: ShoppingBag, labelKey: "orderAccountStat" as const, count: counts.account },
    { id: "recharge" as const, icon: PackageCheck, labelKey: "orderRechargeStat" as const, count: counts.recharge },
    { id: "pending" as const, icon: Clock3, labelKey: "orderPendingStat" as const, count: counts.pending },
  ];

  type FlowRow = {
    key: string; time: string; typeLabel: string; typeClass: string;
    title: string; amount: number; balanceAfter: number; orderNo: string;
    status: "success" | "processing" | "failed"; category: FlowCategory;
  };

  // 平台余额流水：充值、开卡扣费、卡充值、卡退款、销卡退款
  const platformRows: FlowRow[] = useMemo(() => platformFlows.map((flow) => ({
    key: flow.id,
    time: flow.time,
    typeLabel: platformFlowTypeLabel[flow.type],
    typeClass: flow.type === "card_open" ? "fee" : flow.amount > 0 ? "refund" : "consume",
    title: flow.note,
    amount: flow.amount,
    balanceAfter: flow.balanceAfter,
    orderNo: flow.id,
    status: flow.status,
    category: flow.type === "topup" ? "topup" : "card",
  })), [platformFlows]);

  // 平台余额流水：代充 / 成品号 / 退单返佣
  const billRows: FlowRow[] = useMemo(() => billFlows.map((flow) => ({
    key: flow.id,
    time: flow.time,
    typeLabel: billFlowTypeLabel[flow.type],
    typeClass: flow.type === "commission" ? "refund" : flow.type === "account_service" ? "consume" : "recharge",
    title: flow.title,
    amount: flow.amount,
    balanceAfter: flow.balanceAfter,
    orderNo: flow.orderNo,
    status: flow.status,
    category: flow.type,
  })), [billFlows]);

  const allFlowRows = useMemo(() => (
    [...platformRows, ...billRows].sort((a, b) => (a.time < b.time ? 1 : -1))
  ), [platformRows, billRows]);

  // 账单周期：先按自然月切，再按类型筛。周期内的汇总永远按全量算，不跟着类型筛选变，否则对不上账。
  const periodRange = useMemo(() => billPeriodRange(period), [period]);

  const periodRows = useMemo(() => allFlowRows.filter((row) => {
    if (!periodRange.start || !periodRange.end) return true;
    const time = parseFlowTime(row.time);
    return time >= periodRange.start && time <= periodRange.end;
  }), [allFlowRows, periodRange]);

  const filteredFlowRows = useMemo(() => {
    const query = flowSearch.trim().toLowerCase();
    return periodRows.filter((row) => {
      if (flowStatus !== "all" && row.status !== flowStatus) return false;
      if (query && !row.orderNo.toLowerCase().includes(query) && !row.title.toLowerCase().includes(query)) return false;
      if (flowFilter === "all") return true;
      if (flowFilter === "refund") return row.category === "commission" || (row.category === "card" && row.amount > 0);
      return row.category === flowFilter;
    });
  }, [flowFilter, flowSearch, flowStatus, periodRows]);

  const hasFlowFilters = period !== "month" || flowFilter !== "all" || flowStatus !== "all" || Boolean(flowSearch);
  const resetFlowFilters = () => {
    setPeriod("month");
    setFlowFilter("all");
    setFlowStatus("all");
    setFlowSearch("");
    setCollapsedDays([]);
  };
  const toggleDay = (day: string) => setCollapsedDays((current) => (
    current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
  ));

  /** 期初 = 周期开始前最后一笔的变动后余额；期末 = 周期内最后一笔的变动后余额。 */
  const flowSummary = useMemo(() => {
    const ascending = [...allFlowRows].sort((a, b) => (a.time < b.time ? -1 : 1));
    const income = periodRows.reduce((sum, row) => sum + (row.amount > 0 ? row.amount : 0), 0);
    const expense = periodRows.reduce((sum, row) => sum + (row.amount < 0 ? Math.abs(row.amount) : 0), 0);
    const first = ascending[0];
    const openingRow = periodRange.start
      ? [...ascending].reverse().find((row) => parseFlowTime(row.time) < periodRange.start!)
      : undefined;
    const closingRow = periodRange.end
      ? [...ascending].reverse().find((row) => parseFlowTime(row.time) <= periodRange.end!)
      : ascending[ascending.length - 1];
    const opening = openingRow?.balanceAfter ?? (first ? Number((first.balanceAfter - first.amount).toFixed(2)) : 0);
    const closing = closingRow?.balanceAfter ?? opening;
    const incomeCount = periodRows.filter((row) => row.amount > 0).length;
    return {
      income, expense, incomeCount, expenseCount: periodRows.length - incomeCount,
      net: income - expense, opening, closing, count: periodRows.length,
    };
  }, [allFlowRows, periodRange, periodRows]);

  /** 明细按天分组：账单是一天一段，不是一条一整页。 */
  const flowGroups = useMemo(() => {
    const groups: { day: string; rows: typeof filteredFlowRows; net: number }[] = [];
    filteredFlowRows.forEach((row) => {
      const day = row.time.slice(0, 10);
      const last = groups[groups.length - 1];
      if (last && last.day === day) {
        last.rows.push(row);
        last.net += row.amount;
      } else {
        groups.push({ day, rows: [row], net: row.amount });
      }
    });
    return groups;
  }, [filteredFlowRows]);

  const periodRangeText = periodRange.start && periodRange.end
    ? `${formatDate(periodRange.start)} – ${formatDate(periodRange.end)}`
    : "全部时间";

  // 数量与周期口径属于「信息」，不再挂在标题行冒充操作：账单并入周期条，订单并入列表计数。
  const heading = mode === "flows"
    ? { titleKey: "walletFlowTitle" as const, subtitleKey: "walletFlowSubtitle" as const, icon: <WalletCards /> }
    : { titleKey: "ordersPageTitle" as const, subtitleKey: "ordersPageSubtitle" as const, icon: <ReceiptText /> };

  return (
    <section className="user-center-page orders-page">
      <PageHeading
        titleKey={heading.titleKey}
        subtitleKey={heading.subtitleKey}
        content={content}
        editMode={editMode}
        updateContent={updateContent}
        icon={heading.icon}
      />

      {mode === "flows" ? (
        <>
        <div className="bill-period-bar">
          <div className="bill-period-tabs" role="group" aria-label="账单周期">
            {(["month", "lastMonth", "quarter", "all"] as const).map((value) => (
              <button key={value} type="button" className="bill-period-tab" data-active={period === value} onClick={() => setPeriod(value)}>{PERIOD_LABEL[value]}</button>
            ))}
          </div>
          <span className="bill-period-range">{periodRangeText} · 本期 {flowSummary.count} 笔</span>
        </div>

        <div className="bill-summary" aria-label="账单汇总">
          <div className="bill-summary-cell">
            <span><WalletCards aria-hidden="true" />期初余额</span>
            <strong>{money(flowSummary.opening)}</strong>
            <small>{periodRange.start ? `${formatDate(periodRange.start)} 之前` : "最早记录之前"}</small>
          </div>
          <div className="bill-summary-cell is-income">
            <span><ArrowDownLeft aria-hidden="true" />本期入账</span>
            <strong>+{money(flowSummary.income)}</strong>
            <small>{flowSummary.incomeCount} 笔</small>
          </div>
          <div className="bill-summary-cell is-expense">
            <span><ArrowUpRight aria-hidden="true" />本期支出</span>
            <strong>−{money(flowSummary.expense)}</strong>
            <small>{flowSummary.expenseCount} 笔</small>
          </div>
          <div className="bill-summary-cell is-closing">
            <span><ReceiptText aria-hidden="true" />期末余额</span>
            <strong>{money(flowSummary.closing)}</strong>
            <small>净变动 {flowSummary.net >= 0 ? "+" : "−"}{money(Math.abs(flowSummary.net))}</small>
          </div>
        </div>

        <section className="uc-card order-management-panel bill-flow-panel">
          <div className="bill-filter-bar">
            <label className="bill-filter-field">
              <span>类型</span>
              <select value={flowFilter} onChange={(event) => setFlowFilter(event.target.value as FlowFilter)}>
                <option value="all">{content.billAllTypes}</option>
                <option value="topup">{content.flowTypeTopup}</option>
                <option value="recharge_service">{content.billTypeRecharge}</option>
                <option value="account_service">{content.billTypeAccount}</option>
                <option value="refund">{content.billTypeCommission}</option>
                <option value="card">{content.billTypeCard}</option>
              </select>
            </label>
            <label className="bill-filter-field">
              <span>状态</span>
              <select value={flowStatus} onChange={(event) => setFlowStatus(event.target.value as FlowStatusFilter)}>
                <option value="all">全部状态</option>
                <option value="success">成功</option>
                <option value="processing">处理中</option>
                <option value="failed">失败</option>
              </select>
            </label>
            <label className="bill-filter-search">
              <Search aria-hidden="true" />
              <input value={flowSearch} onChange={(event) => setFlowSearch(event.target.value)} placeholder="搜单号或说明" aria-label="搜单号或说明" />
            </label>
            <button type="button" className={`bill-filter-reset ${hasFlowFilters ? "is-active" : ""}`} onClick={resetFlowFilters}>
              <RotateCcw aria-hidden="true" />重置
            </button>
            <span className="bill-filter-count">共 <strong>{filteredFlowRows.length}</strong> 条</span>
          </div>

          {filteredFlowRows.length ? (
            <div className="uc-table-wrap order-table-wrap">
              <table className="uc-table order-management-table bill-flow-table">
                <thead><tr><th className="bill-col-time">时间</th><th>类型</th><th>说明</th><th className="is-amount">金额</th><th>变动后余额</th><th>单号 / 交易号</th><th>状态</th></tr></thead>
                <tbody>
                  {flowGroups.map((group) => {
                    const collapsed = collapsedDays.includes(group.day);
                    return (
                    <Fragment key={group.day}>
                      <tr className="bill-day-row">
                        <td colSpan={7}>
                          <button type="button" className="bill-day-toggle" aria-expanded={!collapsed} onClick={() => toggleDay(group.day)}>
                            <span className="bill-day-label">
                              {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                              {formatDayLabel(group.day)}
                            </span>
                            <small>{group.rows.length} 笔 · 净 {group.net >= 0 ? "+" : "−"}{money(Math.abs(group.net))}</small>
                          </button>
                        </td>
                      </tr>
                      {!collapsed && group.rows.map((row) => (
                        <tr key={row.key}>
                          <td><time className="bill-time" title={row.time}>{row.time.slice(11)}</time></td>
                          <td><span className={`uc-kind-tag vcard-flow-type is-${row.typeClass}`}>{row.typeLabel}</span></td>
                          <td><span className="flow-desc">{row.title}</span></td>
                          <td className={`is-amount vcard-flow-amount ${row.amount > 0 ? "is-income" : "is-expense"}`}>{row.amount > 0 ? "+" : "−"}{money(Math.abs(row.amount))}</td>
                          <td>{money(row.balanceAfter)}</td>
                          <td><code>{row.orderNo}</code></td>
                          <td><span className={`vcard-flow-status is-${row.status}`}>{row.status === "success" ? "成功" : row.status === "processing" ? "处理中" : "失败"}</span></td>
                        </tr>
                      ))}
                    </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="uc-empty order-filter-empty">
              <CalendarDays aria-hidden="true" />
              <strong>{periodRows.length ? "这个类型本期没有记录" : "这个周期还没有资金变动"}</strong>
              <p>{periodRows.length ? "换一个类型看看，或把周期切到「全部」。" : "换一个周期看看，或去充值页完成一笔充值。"}</p>
            </div>
          )}
        </section>
        </>
      ) : (
        <>
          <div className="bill-summary order-stat-filters" aria-label="订单统计快捷筛选">
            {statCards.map((card) => {
              const Icon = card.icon;
              const active = quickFilter === card.id;
              return (
                <button type="button" className={`bill-summary-cell${active ? " is-active" : ""}`} data-active={active} onClick={() => selectQuickFilter(card.id)} key={card.id}>
                  <span><Icon aria-hidden="true" /><EditableText active={editMode} value={content[card.labelKey]} onChange={(value) => updateContent(card.labelKey, value)} /></span>
                  <strong>{card.count}</strong>
                  <small>个订单</small>
                </button>
              );
            })}
          </div>

      <section className="uc-card order-management-panel">
        <div className="order-tabs-row">
          <Tabs value={tab} onValueChange={(value) => selectTab(value as OrderTab)}><TabsList className="uc-tabs-list"><TabsTrigger value="all"><EditableText active={editMode} value={content.allOrdersTab} onChange={(value) => updateContent("allOrdersTab", value)} /></TabsTrigger><TabsTrigger value="account"><EditableText active={editMode} value={content.accountOrdersTab} onChange={(value) => updateContent("accountOrdersTab", value)} /></TabsTrigger><TabsTrigger value="recharge"><EditableText active={editMode} value={content.rechargeOrdersTab} onChange={(value) => updateContent("rechargeOrdersTab", value)} /></TabsTrigger></TabsList></Tabs>
          <span className="order-result-count">共 <strong>{filteredOrders.length}</strong> 个订单</span>
        </div>

        <div className="order-filter-toolbar">
          <label className="order-search-field"><span><Search aria-hidden="true" /></span><input value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} placeholder={content.orderSearchPlaceholder} aria-label={content.orderSearchPlaceholder} /></label>
          <label className="order-filter-field"><span><EditableText active={editMode} value={content.orderStatusLabel} onChange={(value) => updateContent("orderStatusLabel", value)} /></span><select value={status} onChange={(event) => { setStatus(event.target.value as StatusFilter); setQuickFilter(tab); setPage(1); }}>{statusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
          <label className="order-filter-field"><span><EditableText active={editMode} value={content.orderTimeRangeLabel} onChange={(value) => updateContent("orderTimeRangeLabel", value)} /></span><select value={timeRange} onChange={(event) => { setTimeRange(event.target.value as TimeFilter); setPage(1); }}><option value="all">{content.orderAllTime}</option><option value="7">{content.orderLast7Days}</option><option value="30">{content.orderLast30Days}</option><option value="90">{content.orderLast90Days}</option><option value="custom">{content.orderCustomTime}</option></select></label>
          <button className={`order-reset-button ${hasActiveFilters ? "is-active" : ""}`} type="button" onClick={resetFilters}><RotateCcw aria-hidden="true" /><EditableText active={editMode} value={content.orderReset} onChange={(value) => updateContent("orderReset", value)} /></button>
        </div>

        {timeRange === "custom" ? <div className="order-custom-range"><label>开始日期<input type="date" value={customFrom} onInput={(event) => { setCustomFrom(event.currentTarget.value); setPage(1); }} /></label><span>至</span><label>结束日期<input type="date" value={customTo} onInput={(event) => { setCustomTo(event.currentTarget.value); setPage(1); }} /></label></div> : null}

        {visibleOrders.length ? <div className="uc-table-wrap order-table-wrap"><table className="uc-table order-management-table"><thead><tr><th>订单号</th><th>商品名称</th><th><EditableText active={editMode} value={content.productCategory} onChange={(value) => updateContent("productCategory", value)} /></th><th className="is-amount"><EditableText active={editMode} value={content.orderAmount} onChange={(value) => updateContent("orderAmount", value)} /></th><th><EditableText active={editMode} value={content.orderStatusColumn} onChange={(value) => updateContent("orderStatusColumn", value)} /></th><th><EditableText active={editMode} value={content.transactionTime} onChange={(value) => updateContent("transactionTime", value)} /></th><th><EditableText active={editMode} value={content.orderActionsColumn} onChange={(value) => updateContent("orderActionsColumn", value)} /></th></tr></thead><tbody>{visibleOrders.map((order) => {
          const actions = getOrderActions(order); const primary = actions.find((action) => action.placement === "primary"); const overflow = actions.filter((action) => action.placement === "overflow");
          return <tr key={order.id}><td><span className="order-id-cell"><code>{order.id}</code><button type="button" onClick={() => copyOrderId(order.id)} aria-label={`${content.copyOrderNumber} ${order.id}`}><Copy aria-hidden="true" /></button></span></td><td><span className="order-product-cell"><strong>{order.productName}</strong><small>{order.productMeta}</small></span></td><td><span className={`uc-kind-tag is-${order.kind}`}>{order.kind === "account" ? "成品号" : "代充"}</span></td><td className="is-amount">{formatMoney(order.amount)}</td><td><ManagedStatusTag order={order} /></td><td><time>{order.createdAt}</time></td><td><span className="order-row-actions">{primary ? <button type="button" className={`order-primary-action ${primary.variant === "danger" ? "is-danger" : ""}`} onClick={() => handleAction(primary.id, order)}>{actionLabel(primary.id, content)}</button> : null}{overflow.length ? <DropdownMenu><DropdownMenuTrigger asChild><button className="order-more-action" type="button" aria-label={content.moreActions}><MoreHorizontal aria-hidden="true" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="order-more-menu">{overflow.map((action) => <DropdownMenuItem key={action.id} onSelect={() => handleAction(action.id, order)}>{action.id === "details" ? <CircleEllipsis /> : <PackageCheck />}{actionLabel(action.id, content)}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu> : null}</span></td></tr>;
        })}</tbody></table></div> : <div className="uc-empty order-filter-empty"><Search aria-hidden="true" /><strong><EditableText active={editMode} value={content.noMatchingOrders} onChange={(value) => updateContent("noMatchingOrders", value)} /></strong><p><EditableText active={editMode} value={content.noMatchingOrdersHint} onChange={(value) => updateContent("noMatchingOrdersHint", value)} /></p><Button variant="outline" onClick={resetFilters}><EditableText active={editMode} value={content.clearFilters} onChange={(value) => updateContent("clearFilters", value)} /></Button></div>}

        <footer className="order-pagination"><span>每页 {PAGE_SIZE} 条</span><div><button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} aria-label="上一页"><ChevronLeft /></button>{Array.from({ length: pageCount }, (_, index) => <button type="button" data-active={page === index + 1} onClick={() => setPage(index + 1)} key={index + 1}>{index + 1}</button>)}<button type="button" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} aria-label="下一页"><ChevronRight /></button></div></footer>
      </section>
        </>
      )}

      <OrderDetailDrawer order={drawerOrder} open={Boolean(drawerOrder)} focus={drawerFocus} content={content} editMode={editMode} updateContent={updateContent} onOpenChange={(open) => !open && setDrawerOrder(null)} onAction={handleAction} />
      <AlertDialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}><AlertDialogContent className="order-cancel-dialog"><AlertDialogHeader><AlertDialogTitle><EditableText active={editMode} value={content.cancelOrderConfirmTitle} onChange={(value) => updateContent("cancelOrderConfirmTitle", value)} /></AlertDialogTitle><AlertDialogDescription><EditableText active={editMode} value={content.cancelOrderConfirmDescription} onChange={(value) => updateContent("cancelOrderConfirmDescription", value)} /></AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{content.cancel}</AlertDialogCancel><AlertDialogAction className="order-cancel-confirm" onClick={confirmCancel}><EditableText active={editMode} value={content.cancelOrderConfirmAction} onChange={(value) => updateContent("cancelOrderConfirmAction", value)} /></AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </section>
  );
}
