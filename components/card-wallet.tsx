"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, Copy, CreditCard, Download, Eye, EyeOff, LayoutGrid, LockKeyhole, MoreHorizontal,
  NotebookPen, PlusCircle, ReceiptText, RotateCcw, Search, Snowflake, Sparkles, Table, Trash2, TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import type { ClosedCardRecord } from "@/components/card-module";
import {
  CardVisual, copyText,
} from "@/components/card-visual";
import { EditableText } from "@/components/editable-text";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  binTitle, buildCardFinance, cardFlowStatusLabel, cardFlowTypeLabel, cardStatusMeta, cardTail, downloadCsv, formatCardNumber, money,
  regionLabel, schemeLabel, type CardBin, type CardFlowItem, type CardFlowType, type CardScheme,
  type CardStatus, type VirtualCard,
} from "@/data/card-business";
import { type DemoContent } from "@/data/content";

type Editable = (key: keyof DemoContent, value: string) => void;
type StatusFilter = "all" | CardStatus | "closed";
type SchemeFilter = "all" | CardScheme;
type SortMode = "default" | "balance_desc" | "balance_asc";
type ViewMode = "cards" | "table";

/* ------------------------------------------------------------------ */
/* 我的卡片（列表）                                                     */
/* ------------------------------------------------------------------ */

export function CardList({
  cards,
  closedRecords,
  onOpenMarket,
  onDetail,
  onFund,
  onNote,
  onRequestFreeze,
  onRequestDelete,
  content,
  editMode,
  updateContent,
}: {
  cards: VirtualCard[];
  closedRecords: ClosedCardRecord[];
  onOpenMarket: () => void;
  onDetail: (card: VirtualCard) => void;
  onFund: (card: VirtualCard) => void;
  onNote: (card: VirtualCard) => void;
  onRequestFreeze: (card: VirtualCard) => void;
  onRequestDelete: (card: VirtualCard) => void;
  content: DemoContent;
  editMode: boolean;
  updateContent: Editable;
}) {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [schemeFilter, setSchemeFilter] = useState<SchemeFilter>("all");
  const [minBalance, setMinBalance] = useState("");
  const [maxBalance, setMaxBalance] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [view, setView] = useState<ViewMode>("cards");
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const editable = (key: keyof DemoContent) => (
    <EditableText active={editMode} value={content[key]} onChange={(value) => updateContent(key, value)} />
  );

  const showClosed = statusFilter === "closed";
  const minBalanceValue = Number(minBalance);
  const maxBalanceValue = Number(maxBalance);
  const hasMinBalance = minBalance.trim() !== "" && !Number.isNaN(minBalanceValue);
  const hasMaxBalance = maxBalance.trim() !== "" && !Number.isNaN(maxBalanceValue);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const kwDigits = kw.replace(/\D/g, "");
    const matchKw = (card: VirtualCard) => {
      if (!kw) return true;
      return (
        card.cardNo.toLowerCase().includes(kw) ||
        (kwDigits.length > 0 && card.cardNo.includes(kwDigits)) ||
        (card.remark ?? "").toLowerCase().includes(kw)
      );
    };
    const matchBalance = (card: VirtualCard) =>
      (!hasMinBalance || card.balance >= minBalanceValue) && (!hasMaxBalance || card.balance <= maxBalanceValue);
    if (showClosed) {
      return closedRecords
        .map((record) => record.card)
        .filter(matchKw)
        .filter((card) => schemeFilter === "all" || card.scheme === schemeFilter);
    }
    let list = cards.filter((card) => {
      if (statusFilter !== "all" && card.status !== statusFilter) return false;
      if (schemeFilter === "all" ? false : card.scheme !== schemeFilter) return false;
      return matchKw(card) && matchBalance(card);
    });
    if (sortMode === "balance_desc") list = [...list].sort((a, b) => b.balance - a.balance);
    if (sortMode === "balance_asc") list = [...list].sort((a, b) => a.balance - b.balance);
    return list;
  }, [cards, closedRecords, keyword, statusFilter, schemeFilter, minBalance, maxBalance, minBalanceValue, maxBalanceValue, hasMinBalance, hasMaxBalance, sortMode, showClosed]);

  const closedAtOf = (card: VirtualCard) =>
    closedRecords.find((record) => record.card.id === card.id)?.closedAt ?? "—";

  /**
   * 导出口径：当前筛选结果里能正常使用的卡。
   * 已注销卡（注销后敏感信息应失效）与开卡处理中的卡都不参与导出。
   */
  const exportable = useMemo(
    () => (showClosed ? [] : filtered.filter((card) => card.status !== "processing")),
    [filtered, showClosed],
  );

  /**
   * 导出当前筛选结果：只给支付要用的三个字段（卡号 / 有效期 / CVV）。
   * 卡号按 4 位分组输出，Excel 打开不会把 16 位数字压成科学计数法丢位。
   */
  const runExport = () => {
    if (exporting || !exportable.length) return;
    setExporting(true);
    // 模拟敏感字段解密 + 打包的耗时，避免一键就落盘
    window.setTimeout(() => {
      downloadCsv(
        `cards-${new Date().toISOString().slice(0, 10)}.csv`,
        ["卡号", "有效期（月/年）", "CVV"],
        exportable.map((card) => [
          formatCardNumber(card.cardNo),
          // 月/年要写全四位年份：两位年份的 10/28 会被表格软件当成「10 月 28 日」
          `${String(card.expMonth).padStart(2, "0")}/${card.expYear < 100 ? 2000 + card.expYear : card.expYear}`,
          card.cvv,
        ]),
      );
      setExporting(false);
      setExportOpen(false);
      toast.success(content.cardExportDone);
    }, 600);
  };

  const noFilterApplied =
    !keyword.trim() && statusFilter === "all" && schemeFilter === "all" && minBalance.trim() === "" && maxBalance.trim() === "";

  return (
    <section className="vcard-panel">
      <header className="vcard-panel-head">
        <div className="vcard-panel-copy">
          <span className="section-title-icon"><CreditCard aria-hidden="true" /></span>
          <div>
            <h2>{showClosed ? editable("cardClosedTitle") : editable("cardCardsTitle")}</h2>
            <p>{showClosed ? content.cardClosedEmptyHint : editable("cardCardsSubtitle")}</p>
          </div>
        </div>
        <div className="vcard-head-tools">
          <button className="uc-secondary-action" type="button" onClick={() => setExportOpen(true)} disabled={!exportable.length} title={showClosed ? "已注销卡片不支持导出" : undefined}>
            <Download aria-hidden="true" />{editable("cardExport")}
          </button>
          <div className="vcard-view-toggle" role="group" aria-label="展示方式">
            <button
              type="button"
              className={view === "cards" ? "is-active" : ""}
              onClick={() => setView("cards")}
              aria-pressed={view === "cards"}
            >
              <LayoutGrid aria-hidden="true" />{editable("cardViewCard")}
            </button>
            <button
              type="button"
              className={view === "table" ? "is-active" : ""}
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
            >
              <Table aria-hidden="true" />{editable("cardViewTable")}
            </button>
          </div>
          {!showClosed ? (
            <Button className="vcard-open-entry" onClick={onOpenMarket}>
              <PlusCircle aria-hidden="true" />
              {editable("cardOpenAction")}
            </Button>
          ) : null}
        </div>
      </header>

      <div className="vcard-filters">
        <div className="vbin-search vcard-search">
          <Search aria-hidden="true" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={content.cardFilterSearch}
            aria-label="搜索卡号或备注"
          />
        </div>
        <select
          className="vbin-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          aria-label="卡片状态"
        >
          <option value="all">{content.cardAllStatus}</option>
          <option value="active">{cardStatusMeta.active.label}</option>
          <option value="frozen">{cardStatusMeta.frozen.label}</option>
          <option value="system_frozen">{cardStatusMeta.system_frozen.label}</option>
          <option value="processing">{cardStatusMeta.processing.label}</option>
          <option value="closed">{content.cardClosedStatus}</option>
        </select>
        <select
          className="vbin-select"
          value={schemeFilter}
          onChange={(event) => setSchemeFilter(event.target.value as SchemeFilter)}
          aria-label="卡组织"
        >
          <option value="all">{content.cardAllScheme}</option>
          <option value="visa">{schemeLabel("visa")}</option>
          <option value="mastercard">{schemeLabel("mastercard")}</option>
          <option value="discover">{schemeLabel("discover")}</option>
        </select>
        <div className="vcard-balance-range" role="group" aria-label="余额区间">
          <input
            className="vcard-range-input"
            type="number"
            min="0"
            step="0.01"
            value={minBalance}
            onChange={(event) => setMinBalance(event.target.value)}
            placeholder="最低余额"
            aria-label="最低余额"
          />
          <span className="vcard-range-sep" aria-hidden="true">~</span>
          <input
            className="vcard-range-input"
            type="number"
            min="0"
            step="0.01"
            value={maxBalance}
            onChange={(event) => setMaxBalance(event.target.value)}
            placeholder="最高余额"
            aria-label="最高余额"
          />
        </div>
        <select
          className="vbin-select"
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value as SortMode)}
          aria-label="排序方式"
          disabled={showClosed}
        >
          <option value="default">{content.cardSortDefault}</option>
          <option value="balance_desc">{content.cardSortBalanceDesc}</option>
          <option value="balance_asc">{content.cardSortBalanceAsc}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        noFilterApplied && !showClosed ? (
          <div className="uc-empty vcard-empty">
            <CreditCard aria-hidden="true" />
            <strong>{editable("cardEmptyCards")}</strong>
            <p>{editable("cardEmptyCardsHint")}</p>
            <Button className="vcard-open-entry" onClick={onOpenMarket}><PlusCircle aria-hidden="true" />{editable("cardGoOpen")}</Button>
          </div>
        ) : (
          <div className="uc-empty vcard-empty">
            <Search aria-hidden="true" />
            <strong>{showClosed ? content.cardClosedEmpty : "没有符合条件的卡片"}</strong>
            <p>{showClosed ? content.cardClosedEmptyHint : "试试调整筛选条件或清空关键词。"}</p>
          </div>
        )
      ) : view === "table" ? (
        <div className="uc-table-wrap vcard-table-wrap">
          <table className="uc-table vcard-table-view">
            <thead>
              {showClosed ? (
                <tr>
                  <th>卡号</th><th>卡组织</th><th>发行地</th><th>余额</th><th>开卡时间</th><th>{content.cardClosedAt}</th>
                </tr>
              ) : (
                <tr>
                  <th>卡号</th><th>卡组织</th><th>发行地</th><th>状态</th><th>余额</th><th>开卡时间</th><th>操作</th>
                </tr>
              )}
            </thead>
            <tbody>
              {filtered.map((card) => {
                const frozen = card.status === "frozen" || card.status === "system_frozen";
                return showClosed ? (
                  <tr key={card.id}>
                    <td><code className="vcard-table-no">{maskNo(card.cardNo)}</code></td>
                    <td>{schemeLabel(card.scheme)}</td>
                    <td>{regionLabel(card.region)}</td>
                    <td className="vcard-flow-balance">{money(card.balance)}</td>
                    <td><time>{card.createdAt}</time></td>
                    <td><time>{closedAtOf(card)}</time></td>
                  </tr>
                ) : (
                  <tr key={card.id}>
                    <td><code className="vcard-table-no">{maskNo(card.cardNo)}</code></td>
                    <td>{schemeLabel(card.scheme)}</td>
                    <td>{regionLabel(card.region)}</td>
                    <td><span className={`vcard-status is-${cardStatusMeta[card.status].tone}`}>{cardStatusMeta[card.status].label}</span></td>
                    <td className="vcard-flow-balance">{money(card.balance)}</td>
                    <td><time>{card.createdAt}</time></td>
                    <td>
                      <span className="vcard-table-actions">
                        <button type="button" className="uc-secondary-action" onClick={() => onDetail(card)}>
                          {content.cardDetailLabel}<ArrowRight aria-hidden="true" />
                        </button>
                        <button type="button" className="uc-secondary-action" onClick={() => onFund(card)} disabled={frozen}>
                          <PlusCircle aria-hidden="true" />充值
                        </button>
                        <button type="button" className="uc-secondary-action" onClick={() => onNote(card)}>
                          <NotebookPen aria-hidden="true" />{content.cardRemarkLabel}
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : showClosed ? (
        <div className="vcard-grid">
          {filtered.map((card) => (
            <article className="vcard-list-card is-closed" key={card.id}>
              <div className="vlc-face">
                <CardVisual
                  card={card}
                  content={content}
                  editMode={editMode}
                  updateContent={updateContent}
                />
              </div>
              <div className="vlc-closed-meta">
                <span>{content.cardClosedAt}</span>
                <strong>{closedAtOf(card)}</strong>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="vcard-grid">
          {filtered.map((card) => {
            const frozen = card.status === "frozen" || card.status === "system_frozen";
            const processing = card.status === "processing";
            const systemFrozen = card.status === "system_frozen";
            return (
              <article
                className={`vcard-list-card${frozen ? " is-frozen" : ""}${processing ? " is-processing" : ""}`}
                key={card.id}
              >
                <div
                  className="vlc-face"
                  role="button"
                  tabIndex={0}
                  onClick={() => onDetail(card)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onDetail(card); } }}
                  aria-label={`查看 ${binTitle(card)} 卡详情`}
                >
                  <CardVisual
                    card={card}
                    content={content}
                    editMode={editMode}
                    updateContent={updateContent}
                  />
                </div>
                {frozen ? (
                  <p className="vlc-hint">
                    <Snowflake aria-hidden="true" />
                    {systemFrozen
                      ? "系统冻结 · 需联系客服处理，期间不支持充值、退款与删卡"
                      : "冻结中 · 期间不支持充值、退款与删卡，仅可解冻"}
                  </p>
                ) : null}
                <div className="vlc-actions">
                  <button className="vlc-action-main" type="button" onClick={() => onFund(card)} disabled={frozen}>
                    <PlusCircle aria-hidden="true" />充值
                  </button>
                  <button className="vlc-action" type="button" onClick={() => onDetail(card)}>
                    {content.cardDetailLabel}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="vlc-more" type="button" aria-label="更多操作">
                        <MoreHorizontal aria-hidden="true" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={6} className="vlc-more-menu">
                      <DropdownMenuItem
                        disabled={processing || systemFrozen}
                        onSelect={() => onRequestFreeze(card)}
                      >
                        <Snowflake aria-hidden="true" />
                        {systemFrozen ? "联系客服" : frozen ? content.cardUnfreeze : content.cardFreeze}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onNote(card)}>
                        <NotebookPen aria-hidden="true" />{content.cardRemarkLabel}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="is-danger"
                        disabled={frozen}
                        onSelect={() => onRequestDelete(card)}
                      >
                        <Trash2 aria-hidden="true" />{content.cardDeleteCard}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog
        open={exportOpen}
        onOpenChange={(open) => {
          if (exporting) return;
          setExportOpen(open);
        }}
      >
        <DialogContent className="purchase-dialog-account card-export-dialog">
          <DialogHeader>
            <DialogTitle>{content.cardExport}</DialogTitle>
            <DialogDescription>
              {`将导出当前筛选结果中的 ${exportable.length} 张卡片，文件包含完整卡号、有效期与 CVV。`}
              {filtered.length > exportable.length ? " 开卡处理中的卡片暂不参与导出。" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="purchase-dialog-body">
            <dl className="card-export-fields">
              <div><dt>卡号</dt><dd>16 位，按 4 位分组</dd></div>
              <div><dt>有效期</dt><dd>月/年，如 10/2028</dd></div>
              <div><dt>CVV</dt><dd>3–4 位安全码</dd></div>
            </dl>
            <div className="purchase-balance-warning">
              <div><TriangleAlert aria-hidden="true" /></div>
              <p>这三项可以直接完成线上扣款。文件为明文，请只存在自己的设备上，不要转发或上传到公共网盘。</p>
            </div>
          </div>
          <div className="purchase-dialog-actions">
            <button className="page-back-button" type="button" onClick={() => setExportOpen(false)} disabled={exporting}>
              {content.cancel}
            </button>
            <Button className="payment-primary-action" onClick={runExport} disabled={exporting || !exportable.length}>
              {exporting ? "正在生成文件…" : "确认导出"}<span>{exportable.length} 张</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/** 表格里的卡号统一脱敏：前 4 后 4 明文，中间密文。 */
function maskNo(cardNo: string) {
  return cardNo.replace(/^(.{4}).*(.{4})$/, "$1 •••• •••• $2");
}

/* ------------------------------------------------------------------ */
/* 卡详情                                                              */
/* ------------------------------------------------------------------ */

export function CardDetail({
  card,
  bin,
  flows,
  onBack,
  onFund,
  onRefund,
  onNote,
  onRequestFreeze,
  onRequestDelete,
  content,
  editMode,
  updateContent,
}: {
  card: VirtualCard;
  bin?: CardBin;
  flows: CardFlowItem[];
  onBack: () => void;
  onFund: (card: VirtualCard) => void;
  onRefund: (card: VirtualCard) => void;
  onNote: (card: VirtualCard) => void;
  onRequestFreeze: (card: VirtualCard) => void;
  onRequestDelete: (card: VirtualCard) => void;
  content: DemoContent;
  editMode: boolean;
  updateContent: Editable;
}) {
  const [revealed, setRevealed] = useState(false);
  const [cvvState, setCvvState] = useState<"hidden" | "querying" | "shown">("hidden");
  const [flowType, setFlowType] = useState<"all" | CardFlowType>("all");
  const [copiedAll, setCopiedAll] = useState(false);
  const editable = (key: keyof DemoContent) => (
    <EditableText active={editMode} value={content[key]} onChange={(value) => updateContent(key, value)} />
  );

  const ownFlows = useMemo(
    () => flows.filter((flow) => flow.cardId === card.id).sort((a, b) => (a.time < b.time ? 1 : -1)),
    [flows, card.id],
  );
  const visibleFlows = flowType === "all" ? ownFlows : ownFlows.filter((flow) => flow.type === flowType);
  const finance = buildCardFinance(card, flows);
  const frozen = card.status === "frozen" || card.status === "system_frozen";
  const statusMeta = cardStatusMeta[card.status];

  /** CVV 按需从上游实时获取（模拟约 0.9s 延迟，系统不存储），获取结果在本次会话内复用。 */
  const cvvPromiseRef = useRef<Promise<string> | null>(null);
  const ensureCvv = () => {
    if (cvvState === "shown") return Promise.resolve(card.cvv);
    if (!cvvPromiseRef.current) {
      setCvvState("querying");
      cvvPromiseRef.current = new Promise<string>((resolve) => {
        window.setTimeout(() => {
          setCvvState("shown");
          resolve(card.cvv);
        }, 900);
      });
    }
    return cvvPromiseRef.current;
  };

  /** 卡剩余天数：按有效期月末倒推（年份存两位数，补足 2000+）。 */
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(2000 + card.expYear, card.expMonth, 0, 23, 59, 59).getTime() - Date.now()) / 86400000),
  );

  const addressOneLine = [
    card.billingAddress.line1, card.billingAddress.line2, card.billingAddress.city,
    card.billingAddress.state, card.billingAddress.zip, card.billingAddress.country,
  ].filter(Boolean).join(", ");

  /** 一键复制：卡号（明文）+ 有效期 + CVV 三项。CVV 未获取时先向上游实时查询再复制。 */
  const copyAllCardInfo = async () => {
    const cvv = await ensureCvv();
    const text = [
      `卡号：${formatCardNumber(card.cardNo)}`,
      `有效期：${String(card.expMonth).padStart(2, "0")}/${card.expYear}`,
      `CVV：${cvv}`,
    ].join("\n");
    const ok = await copyText(text);
    if (!ok) {
      toast.error("复制失败，请手动选择");
      return;
    }
    setCopiedAll(true);
    setRevealed(true);
    toast.success("卡号、有效期与 CVV 已复制");
    window.setTimeout(() => setCopiedAll(false), 1600);
  };

  /** 全部显示：卡号揭开 + CVV 向上游实时获取；全部隐藏：两项同时收回。 */
  const handleRevealAll = () => {
    if (revealed) {
      setRevealed(false);
      setCvvState("hidden");
      return;
    }
    setRevealed(true);
    void ensureCvv();
  };

  const handleExportFlows = () => {
    downloadCsv(
      `card-flows-${cardTail(card.cardNo)}-${new Date().toISOString().slice(0, 10)}.csv`,
      ["时间", "类型", "金额(USD)", "变动后余额", "商户/说明", "状态", "交易号"],
      ownFlows.map((flow) => [
        flow.time, cardFlowTypeLabel[flow.type], flow.amount.toFixed(2), flow.balanceAfter.toFixed(2),
        flow.merchant, cardFlowStatusLabel[flow.status], flow.txNo,
      ]),
    );
    toast.success(content.cardExportDone);
  };

  const copy = async (value: string) => {
    const ok = await copyText(value);
    if (ok) toast.success(content.cardCopied);
    else toast.error("复制失败，请手动选择");
  };

  return (
    <section className="vcard-detail">
      <header className="vcard-detail-head">
        <div className="vcard-detail-title">
          <button className="page-back-button" type="button" onClick={onBack}>
            <ArrowLeft aria-hidden="true" />{editable("cardBackCards")}
          </button>
          <h2>{binTitle(card)}</h2>
          <span className={`vcard-status is-${statusMeta.tone}`}>
            {frozen ? <Snowflake aria-hidden="true" /> : null}
            {card.status === "processing" ? <i aria-hidden="true" /> : null}
            {statusMeta.label}
          </span>
        </div>
        <div className="vcard-detail-actions">
          <Button className="vcard-action-primary" onClick={() => onFund(card)} disabled={frozen}>
            <PlusCircle aria-hidden="true" />充值
          </Button>
          <button
            className="uc-secondary-action"
            type="button"
            onClick={() => onRefund(card)}
            disabled={frozen || card.balance <= 0}
            title={card.balance <= 0 ? content.cardRefundEmpty : undefined}
          >
            <RotateCcw aria-hidden="true" />{content.cardRefund}
          </button>
          <button
            className="uc-secondary-action"
            type="button"
            onClick={() => onRequestFreeze(card)}
            disabled={card.status === "processing" || card.status === "system_frozen"}
            title={card.status === "system_frozen" ? "系统冻结需联系客服处理" : card.status === "processing" ? "开卡处理中，暂不可冻结" : undefined}
          >
            <Snowflake aria-hidden="true" />{card.status === "system_frozen" ? "联系客服" : frozen ? content.cardUnfreeze : content.cardFreeze}
          </button>
          <button
            className="uc-secondary-action is-danger"
            type="button"
            onClick={() => onRequestDelete(card)}
            disabled={frozen}
            title={frozen ? "冻结期间不可删卡，请先解冻" : undefined}
          >
            <Trash2 aria-hidden="true" />{editable("cardDeleteCard")}
          </button>
          <button className="uc-secondary-action" type="button" onClick={() => onNote(card)}>
            <NotebookPen aria-hidden="true" />{content.cardRemarkLabel}
          </button>
        </div>
      </header>

      {frozen ? (
        <div className={`vcard-detail-alert ${card.status === "system_frozen" ? "is-system" : ""}`} role="status">
          <Snowflake aria-hidden="true" />
          <p>
            {card.status === "system_frozen"
              ? "该卡已被系统冻结（上游/风控触发），需联系客服处理；冻结期间不支持充值、退款与删卡。"
              : "该卡已冻结，冻结期间不支持充值、退款与删卡，仅可解冻；解冻经上游确认后恢复使用。"}
          </p>
        </div>
      ) : null}

      <div className="vcard-detail-top">
        <section className="vcard-info-panel">
          <header className="vcard-info-head">
            <h3>{editable("cardInfoTitle")}</h3>
            <div className="vcard-info-bulk">
              <button className="uc-secondary-action" type="button" onClick={handleRevealAll} disabled={cvvState === "querying"}>
                {cvvState === "querying" ? <Search aria-hidden="true" /> : revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                {cvvState === "querying" ? "获取中…" : revealed ? "全部隐藏" : "全部显示"}
              </button>
              <button className="uc-secondary-action" type="button" onClick={copyAllCardInfo}>
                {copiedAll ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}一键复制
              </button>
            </div>
          </header>
          <dl className="vcard-field-grid">
            <div className="vcard-field is-wide">
              <dt>{content.cardNoLabel}</dt>
              <dd>
                <span className="vcard-field-value is-mono">{revealed ? formatCardNumber(card.cardNo) : card.cardNo.replace(/^(.{4}).*(.{4})$/, "$1 •••• •••• $2")}</span>
                <span className="vcard-info-tools">
                  <button type="button" onClick={() => setRevealed((current) => !current)} aria-label={revealed ? "隐藏卡号" : "显示卡号"}>
                    {revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                  <button type="button" onClick={() => copy(card.cardNo)} aria-label="复制卡号"><Copy aria-hidden="true" /></button>
                </span>
              </dd>
            </div>
            <div className="vcard-field">
              <dt>{editable("cardExpLabel")}</dt>
              <dd>
                <span className="vcard-field-value is-mono">{String(card.expMonth).padStart(2, "0")} / {card.expYear}</span>
                <span className="vcard-info-tools">
                  <button type="button" onClick={() => copy(`${String(card.expMonth).padStart(2, "0")}/${card.expYear}`)} aria-label="复制有效期"><Copy aria-hidden="true" /></button>
                </span>
              </dd>
            </div>
            <div className="vcard-field">
              <dt>{editable("cardCvvLabel")}</dt>
              <dd>
                <span className="vcard-field-value is-mono">{cvvState === "shown" ? card.cvv : cvvState === "querying" ? content.cardCvvQuerying : "•••"}</span>
                <span className="vcard-info-tools">
                  <button
                    type="button"
                    title="CVV 默认脱敏，点击后从上游实时获取"
                    onClick={() => (cvvState === "shown" ? setCvvState("hidden") : void ensureCvv())}
                    disabled={cvvState === "querying"}
                    aria-label={cvvState === "hidden" ? content.cardCvvQuery : "隐藏 CVV"}
                  >
                    {cvvState === "shown" ? <EyeOff aria-hidden="true" /> : <Search aria-hidden="true" />}
                  </button>
                  {cvvState === "shown" ? (
                    <button type="button" onClick={() => copy(card.cvv)} aria-label="复制 CVV"><Copy aria-hidden="true" /></button>
                  ) : null}
                </span>
              </dd>
            </div>
            <div className="vcard-field">
              <dt>{editable("cardHolderLabel")}</dt>
              <dd>
                <span className="vcard-field-value">{card.holder}</span>
                <span className="vcard-info-tools">
                  <button type="button" onClick={() => copy(card.holder)} aria-label="复制持卡人"><Copy aria-hidden="true" /></button>
                </span>
              </dd>
            </div>
            <div className="vcard-field is-wide">
              <dt>{editable("cardBillingLabel")}</dt>
              <dd>
                <span className="vcard-field-value">{addressOneLine}</span>
                <span className="vcard-info-tools">
                  <button type="button" onClick={() => copy(addressOneLine)} aria-label="复制账单地址"><Copy aria-hidden="true" /></button>
                </span>
              </dd>
            </div>
          </dl>
          <p className="vcard-cvv-note"><LockKeyhole aria-hidden="true" />{content.cardCvvNote}</p>
        </section>

        <aside className="vcard-detail-side">
          <section className="vcard-side-panel is-meta">
            <div className="vcard-days-meter">
              <div className="vcard-days-copy">
                <span>距有效期还有</span>
                <strong>{daysLeft} <small>天</small></strong>
              </div>
              <div className="vcard-days-track" role="img" aria-label={`剩余有效期 ${daysLeft} 天`}>
                <i style={{ width: `${Math.min(100, Math.round((daysLeft / 730) * 100))}%` }} />
              </div>
              <small>{String(card.expMonth).padStart(2, "0")}/{card.expYear} 到期</small>
            </div>
            <dl className="vcard-meta-grid">
              <div>
                <dt>当前状态</dt>
                <dd>
                  <span className={`vcard-meta-status is-${statusMeta.tone}`}>
                    {frozen ? <Snowflake aria-hidden="true" /> : null}
                    {statusMeta.label}
                  </span>
                </dd>
              </div>
              <div><dt>卡ID</dt><dd><code>{card.id}</code></dd></div>
              <div><dt>建卡时间</dt><dd>{card.createdAt}</dd></div>
              <div><dt>卡组织 / 发行地</dt><dd>{schemeLabel(card.scheme)} · {regionLabel(card.region)}</dd></div>
              <div>
                <dt>备注</dt>
                <dd className="is-note">
                  <span>{card.remark || "—"}</span>
                  <button type="button" className="vcard-note-edit" onClick={() => onNote(card)} aria-label="编辑备注"><NotebookPen aria-hidden="true" /></button>
                </dd>
              </div>
              <div><dt>系统备注</dt><dd>{card.systemRemark || "—"}</dd></div>
            </dl>
            <div className="vcard-sub-block">
              <h3><Sparkles aria-hidden="true" />订阅更新</h3>
              {card.subscriptionUpdates?.length ? (
                <ol className="vcard-subscribe-timeline">
                  {card.subscriptionUpdates.map((item, index) => (
                    <li key={`${item.plan}-${item.time}`}>
                      <i aria-hidden="true" />
                      <div>
                        <strong>{item.brand} {item.plan}</strong>
                        <b>{money(item.amount)}</b>
                        <time>{item.time}</time>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="vcard-subscribe-empty">暂无订阅更新</p>
              )}
            </div>
          </section>
        </aside>
      </div>

      <section className="vcard-finance-panel">
        <header className="vcard-finance-head">
          <h3>{editable("cardFinanceTitle")}</h3>
          <small>数据截至 {finance.asOf || "—"} · 余额 = 充值 + 消费退款 − 消费 − 转出 − 手续费</small>
        </header>
        <dl className="vcard-finance">
          <div className="is-brand"><dt>可用余额</dt><dd>{money(finance.balance)}</dd></div>
          <div><dt>累计充值</dt><dd>{money(finance.rechargeTotal)}</dd></div>
          <div><dt>累计消费</dt><dd>{money(finance.consumeTotal)}</dd></div>
          <div><dt>消费退款</dt><dd>{money(finance.refundTotal)}</dd></div>
          <div><dt>转出至平台</dt><dd>{money(finance.cashoutTotal)}</dd></div>
          <div><dt>手续费</dt><dd>{finance.feeTotal ? money(finance.feeTotal) : "$0.00"}</dd></div>
          <div><dt>交易笔数</dt><dd>{finance.consumeCount}</dd></div>
          <div><dt>成功笔数</dt><dd>{finance.doneCount}</dd></div>
          <div className="is-risk"><dt>失败笔数</dt><dd>{finance.failedCount}</dd></div>
          <div className="is-risk"><dt>成功率</dt><dd>{finance.successRate}%</dd></div>
        </dl>
      </section>

      <section className="vcard-flow-panel">
        <header className="vcard-flow-head">
          <div className="vcard-panel-copy">
            <span className="section-title-icon"><ReceiptText aria-hidden="true" /></span>
            <div>
              <h3>{editable("cardFlowTitle")}</h3>
            </div>
          </div>
          <div className="vcard-flow-tools">
            <select className="vbin-select" value={flowType} onChange={(event) => setFlowType(event.target.value as typeof flowType)} aria-label="流水类型">
              <option value="all">{content.cardAllTypes}</option>
              <option value="recharge">{cardFlowTypeLabel.recharge}</option>
              <option value="consume">{cardFlowTypeLabel.consume}</option>
              <option value="refund">{cardFlowTypeLabel.refund}</option>
              <option value="cashout">{cardFlowTypeLabel.cashout}</option>
            </select>
            <button className="uc-secondary-action" type="button" onClick={handleExportFlows} disabled={!ownFlows.length}>
              <Download aria-hidden="true" />{editable("cardExport")}
            </button>
          </div>
        </header>

        {visibleFlows.length ? (
          <div className="uc-table-wrap">
            <table className="uc-table vcard-flow-table">
              <thead><tr>
                <th>时间</th><th>类型</th><th>金额</th><th>变动后余额</th><th>商户 / 说明</th><th>状态</th><th>交易号</th>
              </tr></thead>
              <tbody>
                {visibleFlows.map((flow) => (
                  <tr key={flow.id}>
                    <td><time>{flow.time}</time></td>
                    <td><span className={`vcard-flow-type is-${flow.type}`}>{cardFlowTypeLabel[flow.type]}</span></td>
                    <td className={`vcard-flow-amount ${flow.amount > 0 ? "is-income" : "is-expense"}`}>
                      {flow.amount > 0 ? "+" : "−"}{money(Math.abs(flow.amount))}
                    </td>
                    <td className="vcard-flow-balance">{money(flow.balanceAfter)}</td>
                    <td>{flow.merchant}</td>
                    <td><span className={`vcard-flow-status is-${flow.status}`}>{cardFlowStatusLabel[flow.status]}</span></td>
                    <td><code>{flow.txNo}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="uc-empty vcard-empty">
            <ReceiptText aria-hidden="true" />
            <strong>{editable("cardNoRecords")}</strong>
            <p>{editable("cardNoRecordsHint")}</p>
          </div>
        )}
      </section>
    </section>
  );
}
