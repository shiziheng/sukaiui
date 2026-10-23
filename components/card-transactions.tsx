"use client";

import { useMemo, useState } from "react";
import { ReceiptText, Search } from "lucide-react";

import { EditableText } from "@/components/editable-text";
import {
  cardFlowStatusLabel, cardFlowTypeLabel, cardTail, money,
  type CardFlowItem, type CardFlowType, type VirtualCard,
} from "@/data/card-business";
import { type DemoContent } from "@/data/content";

type Editable = (key: keyof DemoContent, value: string) => void;

export function CardTransactions({
  cards, closedCards = [], flows, content, editMode, updateContent, embedded = false,
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
}) {
  const [cardId, setCardId] = useState<string>("all");
  const [type, setType] = useState<"all" | CardFlowType>("all");
  const [keyword, setKeyword] = useState("");

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

  const visible = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return flows
      .filter((flow) => cardId === "all" || flow.cardId === cardId)
      .filter((flow) => type === "all" || flow.type === type)
      .filter((flow) => !query || flow.merchant.toLowerCase().includes(query) || flow.txNo.toLowerCase().includes(query))
      .slice()
      .sort((a, b) => (a.time < b.time ? 1 : -1));
  }, [flows, cardId, type, keyword]);

  const totalAmount = useMemo(
    () => visible.reduce((sum, flow) => sum + flow.amount, 0),
    [visible],
  );

  return (
    <section className="vtxn-panel">
      <header className="vtxn-panel-head" data-embedded={embedded || undefined}>
        {embedded ? null : <div className="vtxn-panel-copy">
          <span className="section-title-icon"><ReceiptText aria-hidden="true" /></span>
          <div>
            <h2>{editable("cardTxnTitle")}</h2>
            <p>{editable("cardTxnSubtitle")}</p>
          </div>
        </div>}
        <span className="vtxn-count">共 {visible.length} 条</span>
      </header>

      <div className="vtxn-filters">
        <label className="vbin-select-wrap">
          <span>卡片</span>
          <select className="vbin-select" value={cardId} onChange={(event) => setCardId(event.target.value)} aria-label="筛选卡片">
            <option value="all">{content.cardAllCards}</option>
            {allCards.map((card) => (
              <option key={card.id} value={card.id}>
                {closedIds.has(card.id) ? "已销卡 · " : ""}尾号 {cardTail(card.cardNo)} · {card.scheme === "visa" ? "Visa" : card.scheme === "mastercard" ? "MasterCard" : "Discover"}
              </option>
            ))}
          </select>
        </label>
        <label className="vbin-select-wrap">
          <span>类型</span>
          <select className="vbin-select" value={type} onChange={(event) => setType(event.target.value as "all" | CardFlowType)} aria-label="筛选类型">
            <option value="all">{content.cardAllTypes}</option>
            <option value="recharge">{cardFlowTypeLabel.recharge}</option>
            <option value="consume">{cardFlowTypeLabel.consume}</option>
            <option value="refund">{cardFlowTypeLabel.refund}</option>
          </select>
        </label>
        <label className="vtxn-search">
          <Search aria-hidden="true" />
          <input value={keyword} placeholder={content.cardSearchMerchant} onChange={(event) => setKeyword(event.target.value)} />
        </label>
      </div>

      {visible.length ? (
        <div className="uc-table-wrap">
          <table className="uc-table vtxn-table">
            <thead><tr>
              <th>时间</th><th>卡号（尾号）</th><th>类型</th><th>金额</th><th>变动后余额</th><th>商户 / 说明</th><th>状态</th><th>交易号</th>
            </tr></thead>
            <tbody>
              {visible.map((flow) => {
                const card = cardMap[flow.cardId];
                return (
                  <tr key={flow.id}>
                    <td><time>{flow.time}</time></td>
                    <td>{card ? `${closedIds.has(card.id) ? "已销卡 " : ""}•••• ${cardTail(card.cardNo)}` : "—"}</td>
                    <td><span className={`vcard-flow-type is-${flow.type}`}>{cardFlowTypeLabel[flow.type]}</span></td>
                    <td className={`vcard-flow-amount ${flow.amount > 0 ? "is-income" : "is-expense"}`}>{flow.amount > 0 ? "+" : "−"}{money(Math.abs(flow.amount))}</td>
                    <td className="vcard-flow-balance">{money(flow.balanceAfter)}</td>
                    <td>{flow.merchant}</td>
                    <td><span className={`vcard-flow-status is-${flow.status}`}>{cardFlowStatusLabel[flow.status]}</span></td>
                    <td><code>{flow.txNo}</code></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="uc-empty vtxn-empty">
          <ReceiptText aria-hidden="true" />
          <strong>{editable("cardNoRecords")}</strong>
          <p>{editable("cardNoRecordsHint")}</p>
        </div>
      )}

      {visible.length ? (
        <footer className="vtxn-summary">
          <span>本页合计</span>
          <strong className={totalAmount >= 0 ? "is-income" : "is-expense"}>{totalAmount >= 0 ? "+" : "−"}{money(Math.abs(totalAmount))}</strong>
        </footer>
      ) : null}
    </section>
  );
}
