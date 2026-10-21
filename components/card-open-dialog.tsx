"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, Minus, Plus, RefreshCw, TriangleAlert } from "lucide-react";

import { CardNotice, SchemeBadge } from "@/components/card-visual";
import { EditableText } from "@/components/editable-text";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { binTitle, cardFeeSchedule, money, randomCardHolder, regionLabel, type CardBin } from "@/data/card-business";
import { type DemoContent } from "@/data/content";

type Stage = "confirm" | "success";
const MAX_QTY = 10;
const REMARK_MAX = 60;
const MIN_TOPUP = 10;
const MAX_TOPUP = 10000;
const STEP_TOPUP = 10;

export function CardOpenDialog({
  bin, availableBalance, onOpenChange, onComplete, onGoTopup, onViewCards, content, editMode, updateContent,
}: {
  bin: CardBin | null;
  availableBalance: number;
  onOpenChange: (open: boolean) => void;
  onComplete: (bin: CardBin, quantity: number, holder: string, remark: string, topupAmount: number) => void;
  onGoTopup: () => void;
  onViewCards: () => void;
  content: DemoContent;
  editMode: boolean;
  updateContent: (key: keyof DemoContent, value: string) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [topupText, setTopupText] = useState(String(MIN_TOPUP));
  const [holder, setHolder] = useState(randomCardHolder);
  const [remark, setRemark] = useState("");
  const [stage, setStage] = useState<Stage>("confirm");
  const [submitting, setSubmitting] = useState(false);
  const guard = useRef(false);

  useEffect(() => {
    if (bin) { setQuantity(1); setTopupText(String(MIN_TOPUP)); setHolder(randomCardHolder()); setRemark(""); setStage("confirm"); setSubmitting(false); guard.current = false; }
  }, [bin]);

  const editable = (key: keyof DemoContent) => (
    <EditableText active={editMode} value={content[key]} onChange={(value) => updateContent(key, value)} />
  );

  const parsedTopup = Number.parseFloat(topupText);
  const topupInvalid = !Number.isFinite(parsedTopup) || parsedTopup < MIN_TOPUP || parsedTopup > MAX_TOPUP;
  const topupAmount = topupInvalid ? 0 : Number(parsedTopup.toFixed(2));
  const openFeeTotal = bin ? Number((bin.openFee * quantity).toFixed(2)) : 0;
  const topupTotal = Number((topupAmount * quantity).toFixed(2));
  const totalFee = Number((openFeeTotal + topupTotal).toFixed(2));
  const gap = Math.max(Number((totalFee - availableBalance).toFixed(2)), 0);
  const sufficient = bin ? !topupInvalid && availableBalance >= totalFee : false;

  const stepTopup = (delta: number) => {
    const base = topupInvalid ? MIN_TOPUP : parsedTopup;
    const next = Math.min(MAX_TOPUP, Math.max(MIN_TOPUP, Number((base + delta).toFixed(2))));
    setTopupText(String(next));
  };

  const handleConfirm = () => {
    if (!bin || !sufficient || guard.current) return;
    guard.current = true;
    setSubmitting(true);
    onComplete(bin, quantity, holder, remark.trim(), topupAmount);
    setStage("success");
    setSubmitting(false);
  };
  const handleGoTopup = () => {
    if (!bin || guard.current) return;
    guard.current = true;
    onGoTopup();
  };

  const confirmView = bin ? (
    <div className="card-open-cols">
      <div className="card-open-col is-form">
      <section className="card-open-bin">
        <span className="vcard-bin">{binTitle(bin)}</span>
        <SchemeBadge scheme={bin.scheme} />
      </section>
      <p className="card-open-meta-line">
        {regionLabel(bin.region)} · {bin.cardType}
        {bin.upstreamProduct ? <span className="card-open-upstream">上游产品码 {bin.upstreamProduct}</span> : null}
      </p>

      <div className="card-open-holder">
        <span className="card-open-holder-label">持卡人（自动随机）</span>
        <code className="card-open-holder-name">{holder}</code>
        <button className="card-open-holder-shuffle" type="button" onClick={() => setHolder(randomCardHolder())}>
          <RefreshCw aria-hidden="true" />换一个
        </button>
      </div>

      <div className="card-open-amounts">
        <div className="quantity-row is-column">
          <div><strong>充值金额（不低于 {money(MIN_TOPUP)}）</strong><span>开卡后立即划入卡内</span></div>
          <div className={`quantity-control card-open-topup-control ${topupInvalid ? "is-invalid" : ""}`}>
            <button type="button" aria-label="减少充值金额" onClick={() => stepTopup(-STEP_TOPUP)}><Minus /></button>
            <input
              aria-label="充值金额"
              inputMode="decimal"
              value={topupText}
              onChange={(event) => setTopupText(event.target.value.replace(/[^\d.]/g, ""))}
            />
            <button type="button" aria-label="增加充值金额" onClick={() => stepTopup(STEP_TOPUP)}><Plus /></button>
          </div>
          {topupInvalid ? <p className="card-open-topup-hint">充值金额需在 {money(MIN_TOPUP)} – {money(MAX_TOPUP)} 之间</p> : null}
        </div>
        <div className="quantity-row is-column">
          <div><strong>{editable("cardQuantityLabel")}</strong><span>最多 {MAX_QTY} 张</span></div>
          <div className="quantity-control">
            <button type="button" aria-label="减少数量" disabled={quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></button>
            <span>{quantity}</span>
            <button type="button" aria-label="增加数量" disabled={quantity >= MAX_QTY} onClick={() => setQuantity(Math.min(MAX_QTY, quantity + 1))}><Plus /></button>
          </div>
        </div>
      </div>

      <div className="card-open-remark">
        <label htmlFor="card-open-remark-input">备注（可留空，用于记录账号信息）</label>
        <div className="card-open-remark-box">
          <input
            id="card-open-remark-input"
            value={remark}
            maxLength={REMARK_MAX}
            placeholder="例如：注册某网站 / 用途备注"
            onChange={(event) => setRemark(event.target.value)}
          />
          <span>{remark.length} / {REMARK_MAX}</span>
        </div>
      </div>

      </div>

      <div className="card-open-col is-info">
      <dl className="payment-breakdown">
        <div><dt>{editable("cardOpenFee")}</dt><dd>{money(bin.openFee)} × {quantity}</dd></div>
        <div><dt>充值金额</dt><dd>{money(topupAmount)} × {quantity}</dd></div>
        <div><dt>{editable("cardOpenTotalLabel")}（{quantity} 张）</dt><dd className="card-open-total">{money(totalFee)}</dd></div>
        <div><dt>平台余额</dt><dd>{money(availableBalance)}</dd></div>
      </dl>

      <details className="card-open-fees-fold">
        <summary className="card-open-fees-head">
          <span>完整费率标准</span>
          <small>共 {cardFeeSchedule(bin).length} 项</small>
        </summary>
        <dl className="card-open-fees-list">
          {cardFeeSchedule(bin).map((row) => (
            <div key={row.label}>
              <dt>{row.label}{row.code ? <small>（{row.code}）</small> : null}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="card-open-fees-note">开卡费、卡片充值费从平台余额额外扣除；交易授权手续费、账单撤销费、账单退款手续费、跨境手续费、小额管理费、拒付费从卡内余额扣收。</p>
      </details>

      {bin.restrictions.length ? (
        <div className="vbin-notice-block card-open-restrictions">
          <CardNotice items={bin.restrictions} />
        </div>
      ) : null}

      {sufficient ? (
        <div className="payment-balance-method"><span><Check />平台余额</span><small>开卡后剩余 {money(availableBalance - totalFee)}</small></div>
      ) : (
        <div className="purchase-balance-warning">
          <div><TriangleAlert aria-hidden="true" /><strong>{money(gap)}</strong></div>
          <p>{editable("cardInsufficientHint")}</p>
        </div>
      )}
      </div>
    </div>
  ) : null;

  const successView = bin ? (
    <section className="payment-success-view">
      <span className="payment-success-icon"><CheckCircle2 aria-hidden="true" /></span>
      {editable("cardOpenSuccessTitle")}
      <h2>{binTitle(bin)} × {quantity}</h2>
      <p>{editable("cardOpenSuccessDesc")}</p>
      <div className="payment-success-actions">
        <Button variant="outline" onClick={onViewCards}>{editable("cardViewCards")}</Button>
        <Button variant="outline" onClick={handleGoTopup}>去充值</Button>
        <Button onClick={() => onOpenChange(false)}>{editable("cardContinueOpen")}</Button>
      </div>
    </section>
  ) : null;

  return (
    <Dialog open={Boolean(bin)} onOpenChange={onOpenChange}>
      <DialogContent className="purchase-dialog-account card-open-dialog">
        <DialogHeader>
          <DialogTitle>{editable("cardOpenDialogTitle")}</DialogTitle>
          <DialogDescription>{stage === "confirm" ? editable("cardOpenDialogDescConfirm") : editable("cardOpenDialogDescSuccess")}</DialogDescription>
        </DialogHeader>
        <div className="purchase-dialog-body">
          {stage === "confirm" ? confirmView : successView}
        </div>
        {stage === "confirm" && bin ? (
          <div className="purchase-dialog-actions">
            <button className="page-back-button" type="button" onClick={() => onOpenChange(false)}>{editable("cancel")}</button>
            {sufficient ? (
              <Button className="payment-primary-action" disabled={submitting} onClick={handleConfirm}>
                {editable("cardOpenNow")} {quantity} 张<span>{money(totalFee)}</span>
              </Button>
            ) : (
              <Button className="payment-primary-action" disabled={submitting} onClick={handleGoTopup}>
                {editable("cardGoTopup")}<span>{money(gap)}</span>
              </Button>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
