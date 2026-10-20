"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";

import { EditableText } from "@/components/editable-text";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { binTitle, cardTail, money, type VirtualCard } from "@/data/card-business";
import { type DemoContent } from "@/data/content";

type Stage = "confirm" | "success";
const QUICK = [10, 50, 100, 200];

export function CardRechargeDialog({
  card, availableBalance, onOpenChange, onComplete, onGoTopup, onViewCard, content, editMode, updateContent,
}: {
  card: VirtualCard | null;
  availableBalance: number;
  onOpenChange: (open: boolean) => void;
  onComplete: (card: VirtualCard, amount: number) => void;
  onGoTopup: () => void;
  onViewCard: () => void;
  content: DemoContent;
  editMode: boolean;
  updateContent: (key: keyof DemoContent, value: string) => void;
}) {
  const [amount, setAmount] = useState(50);
  const [stage, setStage] = useState<Stage>("confirm");
  const [submitting, setSubmitting] = useState(false);
  const guard = useRef(false);

  useEffect(() => {
    if (card) { setAmount(50); setStage("confirm"); setSubmitting(false); guard.current = false; }
  }, [card]);

  const editable = (key: keyof DemoContent) => (
    <EditableText active={editMode} value={content[key]} onChange={(value) => updateContent(key, value)} />
  );

  const numeric = Number.isFinite(amount) ? amount : 0;
  const gap = Math.max(Number((numeric - availableBalance).toFixed(2)), 0);
  const sufficient = numeric > 0 && availableBalance >= numeric;
  const tooLow = numeric <= 0;

  const handleConfirm = () => {
    if (!card || !sufficient || guard.current) return;
    guard.current = true;
    setSubmitting(true);
    onComplete(card, numeric);
    setStage("success");
    setSubmitting(false);
  };
  const handleGoTopup = () => {
    if (!card || guard.current) return;
    guard.current = true;
    onGoTopup();
  };

  const confirmView = card ? (
    <>
      <section className="card-recharge-card">
        <span className="vcard-bin">{binTitle(card)}</span>
        <span className="card-recharge-tail">尾号 {cardTail(card.cardNo)}</span>
        <span className="card-recharge-balance">当前余额 {money(card.balance)}</span>
      </section>
      <dl className="payment-breakdown">
        <div><dt>{editable("cardRechargeAmountLabel")}</dt><dd>{money(numeric)}</dd></div>
        <div><dt>平台余额</dt><dd>{money(availableBalance)}</dd></div>
        <div className="is-total"><dt>划转后卡余额</dt><dd>{money(card.balance + numeric)}</dd></div>
      </dl>
      <div className="card-recharge-amount">
        <input
          type="number" min={1} value={Number.isNaN(amount) ? "" : amount}
          onChange={(event) => setAmount(Math.max(0, Number(event.target.value)))}
          aria-label="充值金额"
        />
        <div className="card-recharge-quick">
          {QUICK.map((q) => (
            <button key={q} type="button" onClick={() => setAmount(q)} disabled={q > availableBalance}>{money(q)}</button>
          ))}
        </div>
      </div>
      {sufficient ? (
        <div className="payment-balance-method"><span>平台余额</span><small>充值后剩余 {money(availableBalance - numeric)}</small></div>
      ) : tooLow ? (
        <div className="purchase-balance-warning"><div><TriangleAlert aria-hidden="true" /></div><p>请输入大于 0 的充值金额</p></div>
      ) : (
        <div className="purchase-balance-warning">
          <div><TriangleAlert aria-hidden="true" /><strong>{money(gap)}</strong></div>
          <p>{editable("cardInsufficientHint")}</p>
        </div>
      )}
    </>
  ) : null;

  const successView = card ? (
    <section className="payment-success-view">
      <span className="payment-success-icon"><CheckCircle2 aria-hidden="true" /></span>
      {editable("cardRechargeSuccessTitle")}
      <h2>{binTitle(card)} · 尾号 {cardTail(card.cardNo)}</h2>
      <p>{editable("cardRechargeSuccessDesc")}</p>
      <div className="payment-success-actions">
        <Button variant="outline" onClick={onViewCard}>{editable("cardDetailLabel")}</Button>
        <Button onClick={() => onOpenChange(false)}>{editable("cardCloseAction")}</Button>
      </div>
    </section>
  ) : null;

  return (
    <Dialog open={Boolean(card)} onOpenChange={onOpenChange}>
      <DialogContent className="purchase-dialog-account card-recharge-dialog">
        <DialogHeader>
          <DialogTitle>{editable("cardRechargeTitle")}</DialogTitle>
          <DialogDescription>{stage === "confirm" ? editable("cardRechargeDescConfirm") : editable("cardRechargeDescSuccess")}</DialogDescription>
        </DialogHeader>
        <div className="purchase-dialog-body">
          {stage === "confirm" ? confirmView : successView}
        </div>
        {stage === "confirm" && card ? (
          <div className="purchase-dialog-actions">
            <button className="page-back-button" type="button" onClick={() => onOpenChange(false)}>{editable("cancel")}</button>
            {sufficient ? (
              <Button className="payment-primary-action" disabled={submitting} onClick={handleConfirm}>
                {editable("cardRechargeAmountLabel")}<span>{money(numeric)}</span>
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
