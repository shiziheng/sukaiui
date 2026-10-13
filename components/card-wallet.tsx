"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, CreditCard, Layers, LockKeyhole, PlusCircle, ReceiptText,
  Snowflake, Trash2, WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import {
  CardVisual, SchemeBadge, SensitiveRow, copyText, type RevealMap,
} from "@/components/card-visual";
import { EditableText } from "@/components/editable-text";
import { Button } from "@/components/ui/button";
import {
  binTitle, buildCardFinance, cardFlowStatusLabel, cardFlowTypeLabel, cardStatusMeta, money,
  regionLabel, schemeLabel, type CardBin, type CardFlowItem, type VirtualCard,
} from "@/data/card-business";
import { type DemoContent } from "@/data/content";

type Editable = (key: keyof DemoContent, value: string) => void;

/* ------------------------------------------------------------------ */
/* 我的卡片（列表）                                                     */
/* ------------------------------------------------------------------ */

export function CardList({
  cards,
  platformBalance,
  onOpenMarket,
  onDetail,
  onFund,
  onRequestFreeze,
  onRequestDelete,
  content,
  editMode,
  updateContent,
}: {
  cards: VirtualCard[];
  platformBalance: number;
  onOpenMarket: () => void;
  onDetail: (card: VirtualCard) => void;
  onFund: (card: VirtualCard) => void;
  onRequestFreeze: (card: VirtualCard) => void;
  onRequestDelete: (card: VirtualCard) => void;
  content: DemoContent;
  editMode: boolean;
  updateContent: Editable;
}) {
  const [revealed, setRevealed] = useState<RevealMap>({});
  const editable = (key: keyof DemoContent) => (
    <EditableText active={editMode} value={content[key]} onChange={(value) => updateContent(key, value)} />
  );

  const stats = useMemo(() => {
    const active = cards.filter((card) => card.status === "active").length;
    const frozen = cards.filter((card) => card.status === "frozen" || card.status === "system_frozen").length;
    const balance = cards.reduce((sum, card) => sum + card.balance, 0);
    return { total: cards.length, active, frozen, balance };
  }, [cards]);

  return (
    <section className="vcard-panel">
      <header className="vcard-panel-head">
        <div className="vcard-panel-copy">
          <span className="section-title-icon"><CreditCard aria-hidden="true" /></span>
          <div>
            <h2>{editable("cardCardsTitle")}</h2>
            <p>{editable("cardCardsSubtitle")}</p>
          </div>
        </div>
        <Button className="vcard-open-entry" onClick={onOpenMarket}>
          <PlusCircle aria-hidden="true" />
          {editable("cardOpenAction")}
        </Button>
      </header>

      <section className="vcard-overview" aria-label="卡片概览">
        <article className="vcard-stat is-primary">
          <span className="vcard-stat-icon"><WalletCards aria-hidden="true" /></span>
          <div><span>平台余额</span><strong>{money(platformBalance)}</strong><small>用于开卡与卡片充值</small></div>
        </article>
        <article className="vcard-stat">
          <span className="vcard-stat-icon"><Layers aria-hidden="true" /></span>
          <div><span>卡片总数</span><strong>{stats.total}</strong><small>正常 {stats.active} 张</small></div>
        </article>
        <article className="vcard-stat">
          <span className="vcard-stat-icon"><CreditCard aria-hidden="true" /></span>
          <div><span>卡内总余额</span><strong>{money(stats.balance)}</strong><small>全部卡片合计</small></div>
        </article>
        <article className="vcard-stat">
          <span className="vcard-stat-icon"><Snowflake aria-hidden="true" /></span>
          <div><span>冻结中</span><strong>{stats.frozen}</strong><small>含系统冻结</small></div>
        </article>
      </section>

      {cards.length ? (
        <div className="vcard-grid">
          {cards.map((card) => {
            const frozen = card.status === "frozen" || card.status === "system_frozen";
            return (
              <article className="vcard-item" key={card.id}>
                <button className="vcard-item-face" type="button" onClick={() => onDetail(card)} aria-label={`查看 ${binTitle(card)} 卡详情`}>
                  <CardVisual
                    card={card}
                    revealed={Boolean(revealed[card.id])}
                    onToggleReveal={() => setRevealed((current) => ({ ...current, [card.id]: !current[card.id] }))}
                    content={content}
                    editMode={editMode}
                    updateContent={updateContent}
                  />
                </button>
                <div className="vcard-item-actions">
                  <Button variant="outline" className="vcard-item-action" onClick={() => onFund(card)} disabled={frozen}>
                    <PlusCircle aria-hidden="true" />充值
                  </Button>
                  <button className="uc-secondary-action" type="button" onClick={() => onDetail(card)}>
                    {editable("cardDetailLabel")}<ArrowRight aria-hidden="true" />
                  </button>
                  <button className="uc-secondary-action" type="button" onClick={() => onRequestFreeze(card)}>
                    <Snowflake aria-hidden="true" />{frozen ? content.cardUnfreeze : content.cardFreeze}
                  </button>
                  <button className="vcard-item-danger" type="button" onClick={() => onRequestDelete(card)} aria-label={content.cardDeleteCard}>
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="uc-empty vcard-empty">
          <CreditCard aria-hidden="true" />
          <strong>{editable("cardEmptyCards")}</strong>
          <p>{editable("cardEmptyCardsHint")}</p>
          <Button className="vcard-open-entry" onClick={onOpenMarket}><PlusCircle aria-hidden="true" />{editable("cardGoOpen")}</Button>
        </div>
      )}
    </section>
  );
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
  onRequestFreeze: (card: VirtualCard) => void;
  onRequestDelete: (card: VirtualCard) => void;
  content: DemoContent;
  editMode: boolean;
  updateContent: Editable;
}) {
  const [revealed, setRevealed] = useState(false);
  const [flowType, setFlowType] = useState<"all" | "recharge" | "consume">("all");
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

  const copy = async (value: string) => {
    const ok = await copyText(value);
    if (ok) toast.success(content.cardCopied);
    else toast.error("复制失败，请手动选择");
  };

  return (
    <section className="vcard-detail">
      <header className="vcard-detail-head">
        <button className="page-back-button" type="button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />{editable("cardBackCards")}
        </button>
        <div className="vcard-detail-title">
          <h2>{binTitle(card)}</h2>
          <span className={`vcard-status is-${statusMeta.tone}`}>
            {frozen ? <Snowflake aria-hidden="true" /> : null}
            {card.status === "processing" ? <i aria-hidden="true" /> : null}
            {statusMeta.label}
          </span>
        </div>
      </header>

      <div className="vcard-detail-top">
        <div className="vcard-detail-main">
          <CardVisual
            card={card}
            variant="detail"
            revealed={revealed}
            onToggleReveal={() => setRevealed((current) => !current)}
            content={content}
            editMode={editMode}
            updateContent={updateContent}
          />

          <section className="vcard-info-panel">
            <h3>{editable("cardInfoTitle")}</h3>
            <dl className="vcard-info-list">
              <SensitiveRow
                label={content.cardNoLabel}
                value={card.cardNo}
                display={card.cardNo.replace(/^(.{6})[\d]+(.{4})$/, "$1******$2")}
                revealed={revealed}
                onToggleReveal={() => setRevealed((current) => !current)}
                onCopy={() => copy(card.cardNo)}
              />
              <SensitiveRow
                label={content.cardCvvLabel}
                value={card.cvv}
                display="•••"
                revealed={revealed}
                onToggleReveal={() => setRevealed((current) => !current)}
                onCopy={() => copy(card.cvv)}
              />
              <div className="vcard-info-row">
                <dt>{editable("cardExpLabel")}</dt>
                <dd><span>{String(card.expMonth).padStart(2, "0")} / {card.expYear}</span></dd>
              </div>
              <div className="vcard-info-row">
                <dt>{editable("cardHolderLabel")}</dt>
                <dd><span>{card.holder}</span></dd>
              </div>
              <div className="vcard-info-row is-address">
                <dt>{editable("cardBillingLabel")}</dt>
                <dd>
                  <span>{card.billingAddress.line1}</span>
                  {card.billingAddress.line2 ? <span>{card.billingAddress.line2}</span> : null}
                  <span>{card.billingAddress.city}</span>
                  <span>{card.billingAddress.state}</span>
                  <span>{card.billingAddress.zip}</span>
                  <span>{card.billingAddress.country}</span>
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="vcard-detail-side">
          <section className="vcard-side-panel is-balance">
            <h3>{editable("cardOverviewTitle")}</h3>
            <div className="vcard-side-balance">
              <span>{editable("cardBalanceLabel")}</span>
              <strong>{money(card.balance)}</strong>
              <small>可用于订阅与线上消费</small>
            </div>
            <dl className="vcard-side-meta">
              <div><dt>{editable("cardBinLabel")}</dt><dd>{binTitle(card)}</dd></div>
              <div><dt>{editable("cardSchemeLabel")}</dt><dd><SchemeBadge scheme={card.scheme} /><span>{schemeLabel(card.scheme)}</span></dd></div>
              <div><dt>{editable("cardRegionLabel")}</dt><dd>{regionLabel(card.region)}</dd></div>
              <div><dt>{editable("cardCreatedLabel")}</dt><dd>{card.createdAt}</dd></div>
              <div><dt>{editable("cardRemarkLabel")}</dt><dd>{card.remark || "—"}</dd></div>
            </dl>
          </section>

          <section className="vcard-side-panel is-actions">
            <h3>{editable("cardActionsTitle")}</h3>
            <div className="vcard-action-list">
              <Button className="vcard-action-primary" onClick={() => onFund(card)} disabled={frozen}>
                <PlusCircle aria-hidden="true" />充值
              </Button>
              <Button variant="outline" onClick={() => onRequestFreeze(card)}>
                <Snowflake aria-hidden="true" />{frozen ? content.cardUnfreeze : content.cardFreeze}
              </Button>
              <Button variant="outline" className="vcard-action-danger" onClick={() => onRequestDelete(card)}>
                <Trash2 aria-hidden="true" />{editable("cardDeleteCard")}
              </Button>
            </div>
            <p className="vcard-action-note">
              <LockKeyhole aria-hidden="true" />
              卡号与 CVV 默认脱敏显示，请勿在不可信环境展示卡信息。
            </p>
          </section>
        </aside>
      </div>

      <section className="vcard-finance-panel">
        <h3>{editable("cardFinanceTitle")}</h3>
        <dl className="vcard-finance">
          <div><dt>可用余额</dt><dd>{money(finance.balance)}</dd></div>
          <div><dt>{editable("cardStatRecharge")}</dt><dd>{money(finance.rechargeTotal)}</dd></div>
          <div><dt>{editable("cardStatConsume")}</dt><dd>{money(finance.consumeTotal)}</dd></div>
          <div><dt>{editable("cardStatRefund")}</dt><dd>{money(finance.refundTotal)}</dd></div>
          <div><dt>{editable("cardStatConsumeCount")}</dt><dd>{finance.consumeCount}</dd></div>
          <div><dt>{editable("cardStatSuccessRate")}</dt><dd>{finance.successRate}%</dd></div>
        </dl>
      </section>

      <section className="vcard-flow-panel">
        <header className="vcard-flow-head">
          <div className="vcard-panel-copy">
            <span className="section-title-icon"><ReceiptText aria-hidden="true" /></span>
            <div>
              <h3>{editable("cardFlowTitle")}</h3>
              <p>这张卡的充值、消费与退款记录，按时间倒序排列。</p>
            </div>
          </div>
          <select className="vbin-select" value={flowType} onChange={(event) => setFlowType(event.target.value as typeof flowType)} aria-label="流水类型">
            <option value="all">{content.cardAllTypes}</option>
            <option value="recharge">{cardFlowTypeLabel.recharge}</option>
            <option value="consume">{cardFlowTypeLabel.consume}</option>
          </select>
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
