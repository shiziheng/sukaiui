"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";

import { EditableText } from "@/components/editable-text";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { binTitle, cardTail, money, type VirtualCard } from "@/data/card-business";
import { type DemoContent } from "@/data/content";

type Stage = "confirm" | "success";
/** 退款后卡内必须保留的最低余额（美元）。 */
const MIN_KEEP = 0.1;
const QUICK = [1, 5, 10];

/**
 * 卡内余额退款弹窗：金额可自定义（默认 1 美元），
 * 退款后卡内余额不能低于 $0.10（为订阅续扣保留），金额实时退回平台余额。
 */
export function CardRefundDialog({
  card, onOpenChange, onComplete, content, editMode, updateContent,
}: {
  card: VirtualCard | null;
  onOpenChange: (open: boolean) => void;
  onComplete: (card: VirtualCard, amount: number) => void;
  content: DemoContent;
  editMode: boolean;
  updateContent: (key: keyof DemoContent, value: string) => void;
}) {
  const [amount, setAmount] = useState(1);
  const [stage, setStage] = useState<Stage>("confirm");
  const [submitting, setSubmitting] = useState(false);
  const guard = useRef(false);

  useEffect(() => {
    if (card) {
      const maxRefund = Math.max(Number((card.balance - MIN_KEEP).toFixed(2)), 0);
      // 默认退 1 美元；可退空间不足 1 美元时按可退最大金额预填。
      setAmount(Number(Math.min(1, maxRefund).toFixed(2)));
      setStage("confirm");
      setSubmitting(false);
      guard.current = false;
    }
  }, [card]);

  const editable = (key: keyof DemoContent) => (
    <EditableText active={editMode} value={content[key]} onChange={(value) => updateContent(key, value)} />
  );

  if (!card) return null;

  const numeric = Number.isFinite(amount) ? amount : 0;
  const maxRefund = Math.max(Number((card.balance - MIN_KEEP).toFixed(2)), 0);
  const canRefund = maxRefund >= 0.01;
  const overKeep = numeric > maxRefund + 1e-9;
  const tooLow = numeric <= 0;
  const valid = canRefund && !tooLow && !overKeep;

  const clampInput = (value: number) => setAmount(Math.max(0, Number(value.toFixed(2))));

  const handleConfirm = () => {
    if (!card || !valid || guard.current) return;
    guard.current = true;
    setSubmitting(true);
    // 模拟上游退款接口的处理耗时
    window.setTimeout(() => {
      onComplete(card, Number(numeric.toFixed(2)));
      setSubmitting(false);
      setStage("success");
      guard.current = false;
    }, 800);
  };

  const confirmView = (
    <>
      <section className="card-recharge-card">
        <span className="vcard-bin">{binTitle(card)}</span>
        <span className="card-recharge-tail">尾号 {cardTail(card.cardNo)}</span>
        <span className="card-recharge-balance">{money(card.balance)}</span>
      </section>
      <dl className="payment-breakdown">
        <div><dt>退款金额</dt><dd>{money(numeric)}</dd></div>
        <div><dt>退款后卡内余额</dt><dd>{money(Math.max(Number((card.balance - numeric).toFixed(2)), 0))}</dd></div>
        <div className="is-total"><dt>到账平台余额</dt><dd>{money(numeric)}</dd></div>
      </dl>
      <div className="card-recharge-amount">
        <input
          type="number"
          min={0}
          step={0.01}
          value={Number.isNaN(amount) ? "" : amount}
          onChange={(event) => clampInput(Number(event.target.value))}
          disabled={!canRefund}
          aria-label="退款金额"
        />
        <div className="card-recharge-quick">
          {QUICK.map((q) => (
            <button key={q} type="button" onClick={() => setAmount(q)} disabled={!canRefund || q > maxRefund + 1e-9}>
              {money(q)}
            </button>
          ))}
          {canRefund ? (
            <button type="button" onClick={() => setAmount(maxRefund)}>{`最大 ${money(maxRefund)}`}</button>
          ) : null}
        </div>
      </div>
      <p className="vcard-refund-keep">
        为保障订阅续扣，转出后卡内需保留至少 <b>{money(MIN_KEEP)}</b>，本次最多可转出 <b>{money(maxRefund)}</b>。
      </p>
      {canRefund && valid ? (
        <div className="payment-balance-method"><span>退回至 平台余额</span><small>实时到账</small></div>
      ) : canRefund && overKeep ? (
        <div className="purchase-balance-warning">
          <div><TriangleAlert aria-hidden="true" /><strong>{money(Number((numeric - maxRefund).toFixed(2)))}</strong></div>
          <p>退款后卡内余额不能低于 {money(MIN_KEEP)}，请把金额降到 {money(maxRefund)} 以内</p>
        </div>
      ) : (
        <div className="purchase-balance-warning">
          <div><TriangleAlert aria-hidden="true" /></div>
          <p>{tooLow && numeric > 0 ? `卡内余额需保留至少 ${money(MIN_KEEP)}，当前余额不足，无法转出` : "请输入大于 0 且不超过可退金额的退款金额"}</p>
        </div>
      )}
    </>
  );

  const successView = (
    <section className="payment-success-view">
      <span className="payment-success-icon"><CheckCircle2 aria-hidden="true" /></span>
      <h2>退款成功</h2>
      <p>{money(card.balance)} 中的 {money(numeric)} 已退回平台余额，卡内剩余 {money(Math.max(Number((card.balance - numeric).toFixed(2)), 0))}。</p>
      <div className="payment-success-actions">
        <Button onClick={() => onOpenChange(false)}>{content.cardCloseAction}</Button>
      </div>
    </section>
  );

  return (
    <Dialog open={Boolean(card)} onOpenChange={onOpenChange}>
      <DialogContent className="purchase-dialog-account card-recharge-dialog card-refund-dialog">
        <DialogHeader>
          <DialogTitle>{editable("cardRefundConfirmTitle")}</DialogTitle>
          <DialogDescription>
            {stage === "confirm"
              ? "退款金额将从卡内余额实时退回平台余额，请输入本次要转出的金额。"
              : "卡内余额已按本次金额退回平台余额。"}
          </DialogDescription>
        </DialogHeader>
        <div className="purchase-dialog-body">
          {stage === "confirm" ? confirmView : successView}
        </div>
        {stage === "confirm" ? (
          <div className="purchase-dialog-actions">
            <button className="page-back-button" type="button" onClick={() => onOpenChange(false)} disabled={submitting}>
              {content.cancel}
            </button>
            <Button className="payment-primary-action" disabled={!valid || submitting} onClick={handleConfirm}>
              {submitting ? "正在提交上游处理…" : "确认退款"}<span>{submitting ? "" : money(numeric)}</span>
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
