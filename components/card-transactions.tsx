"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronDown, ChevronRight,
  PlusCircle, ReceiptText, RotateCcw, Search, WalletCards,
} from "lucide-react";

import "./bill-page.css";
import "./card-transactions.css";

import { EditableText } from "@/components/editable-text";
import {
  cardFlowTypeLabel, cardTail, money,
  type CardFlowItem, type CardFlowStatus, type CardFlowType, type VirtualCard,
} from "@/data/card-business";
import { type DemoContent } from "@/data/content";

type Editable = (key: keyof DemoContent, value: string) => void;
/** 与账单页同一套周期口径：自然月对账。 */
type TxPeriod = "month" | "lastMonth" | "quarter" | "all";
type TxStatus = "all" | CardFlowStatus;

const PERIOD_LABEL: Record<TxPeriod, string> = {
  month: "本月",
  lastMonth: "上月",
  quarter: "近 3 个月",
  all: "全部",
};

const STATUS_TEXT: Record<CardFlowStatus, string> = {
  success: "成功",
  processing: "处理中",
  failed: "失败",
};

const FLOW_TYPES: CardFlowType[] = ["consume", "recharge", "refund", "cashout", "fee"];

function parseTime(time: string) {
  return new Date(time.replace(" ", "T"));
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function periodRange(period: TxPeriod): { start: Date | null; end: Date | null } {
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

/**
 * 单张卡的期初 / 期末余额。
 * 期末取周期内最后一笔的「变动后余额」，比累加更抗失败单；
 * 周期内没有记录时退回周期前最后一笔，仍没有则按 0 处理（卡未开）。
 */
function cardBookends(rows: CardFlowItem[], start: Date | null, end: Date | null) {
  const sorted = [...rows].sort((a, b) => (a.time < b.time ? -1 : 1));
  const inside = sorted.filter((row) => {
    const at = parseTime(row.time);
    return (!start || at >= start) && (!end || at <= end);
  });
  const before = start ? sorted.filter((row) => parseTime(row.time) < start) : [];
  const fallback = before.length ? before[before.length - 1].balanceAfter : 0;
  if (!inside.length) return { opening: fallback, closing: fallback };
  const first = inside[0];
  const last = inside[inside.length - 1];
  return {
    opening: Number((first.balanceAfter - first.amount).toFixed(2)),
    closing: last.balanceAfter,
  };
}

export function CardTransactions({
  cards, closedCards = [], flows, content, editMode, updateContent, embedded = false,
  onOpenMarket,
}: {
  cards: VirtualCard[];
  /** 已销卡的卡片快照：流水保留，卡列显示「已销卡」。 */
  closedCards?: VirtualCard[];
  flows: CardFlowItem[];
  content: DemoContent;
  editMode: boolean;
  updateContent: Editable;
  /** 作为一级页面（侧栏「卡流水」）时，标题交给页头，只留条数和筛选。 */
  embedded?: boolean;
  /** 点击「开通虚拟卡」时拉起开卡中心（由 CardModule 注入 setMarketOpen(true)）。 */
  onOpenMarket?: () => void;
}) {
  const [cardId, setCardId] = useState<string>("all");
  const [type, setType] = useState<"all" | CardFlowType>("all");
  const [status, setStatus] = useState<TxStatus>("all");
  const [keyword, setKeyword] = useState("");
  const [period, setPeriod] = useState<TxPeriod>("month");
  const [collapsedDays, setCollapsedDays] = useState<string[]>([]);

  const editable = (key: keyof DemoContent) => (
    <EditableText active={editMode} value={content[key]} onChange={(value) => updateContent(key, value)} />
  );

  const allCards = useMemo(() => [...cards, ...closedCards], [cards, closedCards]);

  const cardMap = useMemo(() => {
    const map: Record<string, VirtualCard> = {};
    for (const card of allCards) map[card.id] = card;
    return map;
  }, [allCards]);

  const closedIds = useMemo(() => new Set(closedCards.map((card) => card.id)), [closedCards]);

  const range = useMemo(() => periodRange(period), [period]);

  /** 先按卡片和周期取账，摘要永远基于这一层，不跟着下面的类型/状态筛选变。 */
  const bookRows = useMemo(() => flows.filter((flow) => {
    if (cardId !== "all" && flow.cardId !== cardId) return false;
    const at = parseTime(flow.time);
    return (!range.start || at >= range.start) && (!range.end || at <= range.end);
  }), [flows, cardId, range]);

  const visible = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return bookRows
      .filter((flow) => type === "all" || flow.type === type)
      .filter((flow) => status === "all" || flow.status === status)
      .filter((flow) => !query || flow.merchant.toLowerCase().includes(query) || flow.txNo.toLowerCase().includes(query))
      .slice()
      .sort((a, b) => (a.time < b.time ? 1 : -1));
  }, [bookRows, type, status, keyword]);

  /** 期初/期末按卡分别算再汇总：多卡时不能拿单卡余额直接相加。 */
  const summary = useMemo(() => {
    const ids = new Set<string>(Object.keys(cardMap));
    if (cardId !== "all") {
      ids.clear();
      ids.add(cardId);
    }
    let opening = 0;
    let closing = 0;
    ids.forEach((id) => {
      const rows = flows.filter((flow) => flow.cardId === id);
      if (!rows.length) return;
      const book = cardBookends(rows, range.start, range.end);
      opening += book.opening;
      closing += book.closing;
    });
    const income = bookRows.reduce((sum, row) => sum + (row.amount > 0 ? row.amount : 0), 0);
    const expense = bookRows.reduce((sum, row) => sum + (row.amount < 0 ? Math.abs(row.amount) : 0), 0);
    return {
      opening: Number(opening.toFixed(2)),
      closing: Number(closing.toFixed(2)),
      income: Number(income.toFixed(2)),
      expense: Number(expense.toFixed(2)),
      net: Number((income - expense).toFixed(2)),
      incomeCount: bookRows.filter((row) => row.amount > 0).length,
      expenseCount: bookRows.filter((row) => row.amount < 0).length,
      count: bookRows.length,
    };
  }, [flows, cardMap, cardId, bookRows, range]);

  /** 明细按天分组：一天一段，日期条可收起。 */
  const groups = useMemo(() => {
    const list: { day: string; rows: CardFlowItem[]; net: number }[] = [];
    visible.forEach((row) => {
      const day = row.time.slice(0, 10);
      const last = list[list.length - 1];
      if (last && last.day === day) {
        last.rows.push(row);
        last.net += row.amount;
      } else {
        list.push({ day, rows: [row], net: row.amount });
      }
    });
    return list;
  }, [visible]);

  const hasFilters = type !== "all" || status !== "all" || keyword.trim() !== "" || cardId !== "all";
  const resetFilters = () => {
    setCardId("all");
    setType("all");
    setStatus("all");
    setKeyword("");
    setCollapsedDays([]);
  };
  const toggleDay = (day: string) => setCollapsedDays((current) => (
    current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
  ));

  const rangeText = range.start && range.end ? `${formatDate(range.start)} – ${formatDate(range.end)}` : "全部时间";

  return (
    <section className="ctxn-page">
      {embedded ? null : (
        <header className="vtxn-panel-head">
          <div className="vtxn-panel-copy">
            <span className="section-title-icon"><ReceiptText aria-hidden="true" /></span>
            <div>
              <h2>{editable("cardTxnTitle")}</h2>
              <p>{editable("cardTxnSubtitle")}</p>
            </div>
          </div>
          <span className="vtxn-count">共 {visible.length} 条</span>
        </header>
      )}

      <div className="bill-period-bar">
        <div className="bill-period-tabs" role="group" aria-label="卡流水周期">
          {(["month", "lastMonth", "quarter", "all"] as const).map((value) => (
            <button key={value} type="button" className="bill-period-tab" data-active={period === value} onClick={() => setPeriod(value)}>{PERIOD_LABEL[value]}</button>
          ))}
        </div>
        <div className="ctxn-period-actions">
          <span className="bill-period-range">{rangeText}</span>
          {onOpenMarket ? (
            <button type="button" className="ctxn-open-market" onClick={onOpenMarket}>
              <PlusCircle aria-hidden="true" />
              {editable("cardOpenAction")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="bill-summary ctxn-summary" aria-label="卡内余额对账">
        <div className="bill-summary-cell">
          <span><WalletCards aria-hidden="true" />期初卡内余额</span>
          <strong>{money(summary.opening)}</strong>
          <small>{range.start ? `${formatDate(range.start)} 之前` : "最早一笔之前"}</small>
        </div>
        <div className="bill-summary-cell is-income">
          <span><ArrowDownLeft aria-hidden="true" />本期入账</span>
          <strong>+{money(summary.income)}</strong>
          <small>充值 · 退款 {summary.incomeCount} 笔</small>
        </div>
        <div className="bill-summary-cell is-expense">
          <span><ArrowUpRight aria-hidden="true" />本期支出</span>
          <strong>−{money(summary.expense)}</strong>
          <small>消费 · 转出 · 手续费 {summary.expenseCount} 笔</small>
        </div>
        <div className="bill-summary-cell is-closing">
          <span><ReceiptText aria-hidden="true" />期末卡内余额</span>
          <strong>{money(summary.closing)}</strong>
          <small>净变动 {summary.net >= 0 ? "+" : "−"}{money(Math.abs(summary.net))}</small>
        </div>
      </div>

      <section className="uc-card order-management-panel ctxn-panel">
        <div className="bill-filter-bar">
          <label className="bill-filter-field">
            <span>卡片</span>
            <select value={cardId} onChange={(event) => setCardId(event.target.value)} aria-label="筛选卡片">
              <option value="all">{content.cardAllCards}</option>
              {allCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {closedIds.has(card.id) ? "已销卡 · " : ""}尾号 {cardTail(card.cardNo)}
                </option>
              ))}
            </select>
          </label>
          <label className="bill-filter-field">
            <span>类型</span>
            <select value={type} onChange={(event) => setType(event.target.value as "all" | CardFlowType)} aria-label="筛选类型">
              <option value="all">{content.cardAllTypes}</option>
              {FLOW_TYPES.map((value) => <option key={value} value={value}>{cardFlowTypeLabel[value]}</option>)}
            </select>
          </label>
          <label className="bill-filter-field">
            <span>状态</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as TxStatus)} aria-label="筛选状态">
              <option value="all">全部状态</option>
              <option value="success">成功</option>
              <option value="processing">处理中</option>
              <option value="failed">失败</option>
            </select>
          </label>
          <label className="bill-filter-search">
            <Search aria-hidden="true" />
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={content.cardSearchMerchant} aria-label={content.cardSearchMerchant} />
          </label>
          <button type="button" className={`bill-filter-reset ${hasFilters ? "is-active" : ""}`} onClick={resetFilters}>
            <RotateCcw aria-hidden="true" />重置
          </button>
          <span className="bill-filter-count">共 <strong>{visible.length}</strong> 条</span>
        </div>

        {visible.length ? (
          <div className="uc-table-wrap order-table-wrap">
            <table className="uc-table ctxn-table">
              <thead>
                <tr>
                  <th className="ctxn-col-time">时间</th>
                  <th>卡片</th>
                  <th>类型</th>
                  <th>商户 / 说明</th>
                  <th className="is-amount">金额</th>
                  <th>卡内余额</th>
                  <th>状态</th>
                  <th className="ctxn-col-txno">交易号</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const collapsed = collapsedDays.includes(group.day);
                  return (
                    <Fragment key={group.day}>
                      <tr className="ctxn-day-row">
                        <td colSpan={8}>
                          <button type="button" className="ctxn-day-toggle" aria-expanded={!collapsed} onClick={() => toggleDay(group.day)}>
                            <span className="ctxn-day-label">
                              {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                              {formatDayLabel(group.day)}
                            </span>
                            <small>{group.rows.length} 笔 · 净 {group.net >= 0 ? "+" : "−"}{money(Math.abs(group.net))}</small>
                          </button>
                        </td>
                      </tr>
                      {!collapsed && group.rows.map((flow) => {
                        const card = cardMap[flow.cardId];
                        const fee = flow.settleAmount && flow.tradeAmount ? flow.settleAmount - flow.tradeAmount : 0;
                        return (
                          <tr key={flow.id}>
                            <td><time className="ctxn-time" title={flow.time}>{flow.time.slice(11)}</time></td>
                            <td className="ctxn-card">
                              {card ? `${closedIds.has(card.id) ? "已销卡 " : ""}•••• ${cardTail(card.cardNo)}` : "—"}
                            </td>
                            <td><span className={`vcard-flow-type is-${flow.type}`}>{cardFlowTypeLabel[flow.type]}</span></td>
                            <td>
                              <span className="ctxn-desc">{flow.merchant}</span>
                              {fee > 0 ? <small className="ctxn-fee">含手续费 {money(fee, 2)}</small> : null}
                            </td>
                            <td className={`is-amount vcard-flow-amount ${flow.amount > 0 ? "is-income" : "is-expense"}`}>
                              {flow.amount > 0 ? "+" : "−"}{money(Math.abs(flow.amount))}
                            </td>
                            <td className="vcard-flow-balance">{money(flow.balanceAfter)}</td>
                            <td><span className={`vcard-flow-status is-${flow.status}`}>{STATUS_TEXT[flow.status]}</span></td>
                            <td className="ctxn-col-txno"><code>{flow.txNo}</code></td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="uc-empty order-filter-empty">
            <CalendarDays aria-hidden="true" />
            <strong>{summary.count ? "当前条件下没有卡流水" : "这个周期卡内没有收支"}</strong>
            <p>{summary.count ? "换一个类型或状态看看，也可以重置筛选。" : "卡片开卡、充值、消费后，流水会记在这里。"}</p>
          </div>
        )}
      </section>
    </section>
  );
}
