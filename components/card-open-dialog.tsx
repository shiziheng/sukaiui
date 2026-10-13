"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, Minus, Plus, TriangleAlert } from "lucide-react";

import { SchemeBadge } from "@/components/card-visual";
import { EditableText } from "@/components/editable-text";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { binTitle, money, regionLabel, type CardBin } from "@/data/card-business";
import { type DemoContent } from "@/data/content";

type Stage = "confirm" | "success";
const MAX_QTY = 10;

export function CardOpenDialog({
  bin, availableBalance, onOpenChange, onComplete, onGoTopup, onViewCards, content, editMode, updateContent,
}: {
  bin: CardBin | null;
  availableBalance: number;
  onOpenChange: (open: boolean) => void;
  onComplete: (bin: CardBin, quantity: number) => void;
  onGoTopup: () => void;
  onViewCards: () => void;
  content: DemoContent;
  editMode: boolean;
  updateContent: (key: keyof DemoContent, value: string) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [stage, setStage] = useState<Stage>("confirm");
  const [submitting, setSubmitting] = useState(false);
  const guard = useRef(false);

  useEffect(() => {
    if (bin) { setQuantity(1); setStage("confirm"); setSubmitting(false); guard.current = false; }
  }, [bin]);

  const editable = (key: keyof DemoContent) => (
    <EditableText active={editMode} value={content[key]} onChange={(value) => updateContent(key, value)} />
  );

  const totalFee = bin ? Number((bin.openFee * quantity).toFixed(2)) : 0;
  const gap = Math.max(Number((totalFee - availableBalance).toFixed(2)), 0);
  const sufficient = bin ? availableBalance >= totalFee && totalFee > 0 : false;

  const handleConfirm = () => {
    if (!bin || !sufficient || guard.current) return;
    guard.current = true;
    setSubmitting(true);
    onComplete(bin, quantity);
    setStage("success");
    setSubmitting(false);
  };
  const handleGoTopup = () => {
    if (!bin || guard.current) return;
    guard.current = true;
    onGoTopup();
  };

  const confirmView = bin ? (
    <>
      <section className="card-open-bin">
        <span className="vcard-bin">{binTitle(bin)}</span>
        <SchemeBadge scheme={bin.scheme} />
        <span className="card-open-region">{regionLabel(bin.region)}</span>
      </section>
      <dl className="card-open-meta">
        <div><dt>{editable("cardOpenFee")}</dt><dd>{money(bin.openFee)} <small>/ 张</small></dd></div>
        <div><dt>{editable("cardRechargeFeeLabel")}</dt><dd>{bin.rechargeFeePercent}%</dd></div>
      </dl>
      <div className="quantity-row">
        <div><strong>{editable("cardQuantityLabel")}</strong><span>最多 {MAX_QTY} 张</span></div>
        <div className="quantity-control">
          <button type="button" aria-label="减少数量" disabled={quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></button>
          <span>{quantity}</span>
          <button type="button" aria-label="增加数量" disabled={quantity >= MAX_QTY} onClick={() => setQuantity(Math.min(MAX_QTY, quantity + 1))}><Plus /></button>
        </div>
      </div>
      <dl className="payment-breakdown">
        <div><dt>{editable("cardOpenTotalLabel")}</dt><dd>{money(totalFee)}</dd></div>
        <div><dt>平台余额</dt><dd>{money(availableBalance)}</dd></div>
      </dl>
      {sufficient ? (
        <div className="payment-balance-method"><span><Check />平台余额</span><small>开卡后剩余 {money(availableBalance - totalFee)}</small></div>
      ) : (
        <div className="purchase-balance-warning">
          <div><TriangleAlert aria-hidden="true" /><strong>{money(gap)}</strong></div>
          <p>{editable("cardInsufficientHint")}</p>
        </div>
      )}
    </>
  ) : null;

  const successView = bin ? (
    <section className="payment-success-view">
      <span className="payment-success-icon"><CheckCircle2 aria-hidden="true" /></span>
      {editable("cardOpenSuccessTitle")}
      <h2>{binTitle(bin)} × {quantity}</h2>
      <p>{editable("cardOpenSuccessDesc")}</p>
      <div className="payment-success-actions">
        <Button variant="outline" onClick={onViewCards}>{editable("cardViewCards")}</Button>
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
                {editable("cardOpenNow")}<span>{money(totalFee)}</span>
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
