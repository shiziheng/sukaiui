"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CircleEllipsis, Clock3, Copy, MoreHorizontal, PackageCheck, ReceiptText, RotateCcw, Search, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { EditableText } from "@/components/editable-text";
import { ManagedStatusTag, OrderDetailDrawer, type OrderDrawerFocus } from "@/components/order-detail-drawer";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeading, formatMoney, type CopyUpdater } from "@/components/user-center-shared";
import { accountStatusOptions, getOrderActions, getUnifiedStatus, orderManagementMock, rechargeStatusOptions, unifiedStatusOptions, type ManagedOrder, type ManagedOrderKind, type ManagedOrderStatus, type OrderActionId, type UnifiedOrderStatus } from "@/data/order-management";
import { type DemoContent } from "@/data/content";

type OrderTab = "all" | ManagedOrderKind;
type QuickFilter = OrderTab | "pending";
type StatusFilter = "all" | ManagedOrderStatus | UnifiedOrderStatus;
type TimeFilter = "all" | "7" | "30" | "90" | "custom";

const PAGE_SIZE = 10;
const DEMO_NOW = new Date("2026-09-15T23:59:59");

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

export function OrdersPage({ content, editMode, updateContent, extraOrders = [] }: { content: DemoContent; editMode: boolean; updateContent: CopyUpdater; extraOrders?: ManagedOrder[] }) {
  const [orders, setOrders] = useState(() => [...extraOrders.map((order) => ({ ...order })), ...orderManagementMock.map((order) => ({ ...order }))]);
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

  return (
    <section className="user-center-page orders-page">
      <PageHeading titleKey="ordersPageTitle" subtitleKey="ordersPageSubtitle" content={content} editMode={editMode} updateContent={updateContent} icon={<ReceiptText />} aside={<span className="orders-period-summary">近30天 · {recentCount}个订单</span>} />

      <div className="uc-light-stats order-stat-filters" aria-label="订单统计快捷筛选">
        {statCards.map((card) => { const Icon = card.icon; return <button type="button" data-active={quickFilter === card.id} onClick={() => selectQuickFilter(card.id)} key={card.id}><Icon aria-hidden="true" /><span><EditableText active={editMode} value={content[card.labelKey]} onChange={(value) => updateContent(card.labelKey, value)} /></span><strong>{card.count}</strong></button>; })}
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

      <OrderDetailDrawer order={drawerOrder} open={Boolean(drawerOrder)} focus={drawerFocus} content={content} editMode={editMode} updateContent={updateContent} onOpenChange={(open) => !open && setDrawerOrder(null)} onAction={handleAction} />
      <AlertDialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}><AlertDialogContent className="order-cancel-dialog"><AlertDialogHeader><AlertDialogTitle><EditableText active={editMode} value={content.cancelOrderConfirmTitle} onChange={(value) => updateContent("cancelOrderConfirmTitle", value)} /></AlertDialogTitle><AlertDialogDescription><EditableText active={editMode} value={content.cancelOrderConfirmDescription} onChange={(value) => updateContent("cancelOrderConfirmDescription", value)} /></AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{content.cancel}</AlertDialogCancel><AlertDialogAction className="order-cancel-confirm" onClick={confirmCancel}><EditableText active={editMode} value={content.cancelOrderConfirmAction} onChange={(value) => updateContent("cancelOrderConfirmAction", value)} /></AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </section>
  );
}
