"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, Minus, Plus, ShieldCheck, TriangleAlert } from "lucide-react";

import { EditableText } from "@/components/editable-text";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { defaultBrands } from "@/data/brands";
import { type DemoContent } from "@/data/content";
import {
  completeMockPayment,
  createPaymentIntent,
  type PaymentCompletion,
  type PaymentIntent,
  type ProductOrder,
} from "@/data/payment-mocks";
import { type Product } from "@/data/products";

/**
 * 购买弹窗的界面态：确认下单 → 支付完成。
 * 余额不足不再进入链上补差流程，而是跳转钱包充值页后回到本弹窗继续支付，
 * 所以这里不存在「链上支付」这一段。
 */
export type PurchaseStage = "confirm" | "success";

type PurchaseMode = "purchase" | "preorder" | "soldout";

/**
 * 余额支付不产生链上金额，网络字段仅用于满足支付单结构，UI 不再提供网络选择。
 */
const BALANCE_SETTLEMENT_NETWORK = "trc20" as const;

/** Resolve how a product can be purchased. Mirrors the helper that drives the product list. */
function getPurchaseMode(product: Product): PurchaseMode {
  if (product.status === "soldout") return "soldout";
  if (product.fulfillment === "preorder" || product.stock === 0) return "preorder";
  return "purchase";
}

function getPurchaseLimit(product: Product, mode: PurchaseMode): number {
  const configuredLimit = Math.max(1, product.maxQuantity ?? 1);
  if (mode !== "purchase" || product.stock === undefined) return configuredLimit;
  return Math.max(1, Math.min(configuredLimit, product.stock));
}

function money(value: number, digits = 2) {
  return `$${value.toFixed(digits)}`;
}

/** 数量区副信息：限购 1 时只写限购口径，其余组合库存 / 上限。 */
function buildQuantityHint(product: Product, mode: PurchaseMode, limit: number, content: DemoContent): string {
  if (limit <= 1) return `${content.maxQuantityLabel} ${limit} ${content.accountUnit}`;
  if (mode === "preorder") return `${content.maxReservationLabel} ${limit} ${content.accountUnit}`;
  if (product.stock === undefined) return `${content.maxQuantityLabel} ${limit} ${content.accountUnit}`;
  return `${content.currentStockLabel} ${product.stock} · ${content.maxQuantityLabel} ${limit} ${content.accountUnit}`;
}

/**
 * AccountPurchaseDialog —— 成品号 / 代充商品的购买弹窗。
 *
 * 支付只有一个动作：扣钱包余额。余额不足时不在弹窗内做链上补差，而是由父级
 * 跳转到钱包充值页；充值完成后「返回订单继续支付」会重新打开本弹窗。
 */
export function AccountPurchaseDialog({
  product,
  quantity,
  onQuantityChange,
  availableBalance,
  stage,
  onStageChange,
  onIntentChange,
  onOpenChange,
  onComplete,
  onGoTopup,
  onViewOrders,
  onBackToProducts,
  content,
  editMode,
  updateContent,
}: {
  product: Product | null;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  availableBalance: number;
  stage: PurchaseStage;
  onStageChange: (stage: PurchaseStage) => void;
  onIntentChange: (intent: PaymentIntent | null) => void;
  onOpenChange: (open: boolean) => void;
  onComplete: (completion: PaymentCompletion) => void;
  onGoTopup: (productId: string, quantity: number) => void;
  onViewOrders: () => void;
  onBackToProducts: () => void;
  content: DemoContent;
  editMode: boolean;
  updateContent: (key: keyof DemoContent, value: string) => void;
}) {
  const [order, setOrder] = useState<ProductOrder | null>(null);
  const [completion, setCompletion] = useState<PaymentCompletion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const submitGuard = useRef(false);

  // 弹窗关闭即丢弃草稿：数量由父级重置，这里清理弹窗内部状态。
  useEffect(() => {
    if (product) return;
    setOrder(null);
    setCompletion(null);
    setSubmitting(false);
    submitGuard.current = false;
  }, [product]);

  // stage 切换后把滚动容器回到顶部。
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [stage, product]);

  // stage 变化即解除主按钮的防重复点击锁。
  useEffect(() => {
    submitGuard.current = false;
    setSubmitting(false);
  }, [stage]);

  const brand = product ? defaultBrands.find((item) => item.id === product.brand) ?? defaultBrands[0] : defaultBrands[0];
  const mode = product ? getPurchaseMode(product) : null;
  const limit = product && mode ? getPurchaseLimit(product, mode) : 1;
  const total = product ? product.price * quantity : 0;
  const gap = Math.max(total - availableBalance, 0);
  const balanceSufficient = total > 0 && availableBalance >= total;
  const quantityHint = product && mode ? buildQuantityHint(product, mode, limit, content) : "";
  const editable = (key: keyof DemoContent) => (
    <EditableText active={editMode} value={content[key]} onChange={(value) => updateContent(key, value)} />
  );

  const handlePrimaryAction = () => {
    if (!product || !balanceSufficient || submitGuard.current) return;
    submitGuard.current = true;
    setSubmitting(true);
    const nextOrder: ProductOrder = {
      id: `${product.businessType === "account" ? "MO" : "DO"}${Date.now().toString().slice(-11)}`,
      amount: total,
      type: product.businessType,
      productName: product.name,
      paymentStatus: "pending",
    };
    setOrder(nextOrder);
    const balanceIntent = createPaymentIntent({
      mode: "balance_payment",
      amount: total,
      availableBalance,
      network: BALANCE_SETTLEMENT_NETWORK,
      orderId: nextOrder.id,
    });
    const result = completeMockPayment({ intent: balanceIntent, availableBalance, receivedAmount: 0, order: nextOrder });
    onIntentChange(result.paymentIntent);
    setCompletion(result);
    onStageChange("success");
    onComplete(result);
  };

  const handleGoTopup = () => {
    if (!product || submitGuard.current) return;
    submitGuard.current = true;
    onGoTopup(product.id, quantity);
  };

  const confirmView = product && mode ? <>
    <section className="order-payment-product">
      <span className="order-payment-icon" aria-hidden="true">
        <span className={`brand-mark brand-mark-${brand.id} brand-mark-small`} style={{ "--brand-accent": brand.accentColor } as CSSProperties}>
          <img src={brand.logo} alt="" aria-hidden="true" />
        </span>
      </span>
      <div>
        <strong>{product.name}</strong>
        <small>{product.subtitle}</small>
      </div>
      <b>${product.price}{product.priceSuffix ? <small>{product.priceSuffix}</small> : null}</b>
    </section>

    <div className="quantity-row">
      <div>
        <strong>{editable("quantityLabel")}</strong>
        <span>{quantityHint}</span>
      </div>
      {limit > 1 ? (
        <div className="quantity-control">
          <button type="button" aria-label="减少数量" disabled={quantity <= 1} onClick={() => onQuantityChange(Math.max(1, quantity - 1))}><Minus /></button>
          <span>{quantity}</span>
          <button type="button" aria-label="增加数量" disabled={quantity >= limit} onClick={() => onQuantityChange(Math.min(limit, quantity + 1))}><Plus /></button>
        </div>
      ) : null}
    </div>

    {product.businessType === "account" ? (
      <section className="purchase-notes">
        <h3>{editable("purchaseNotesTitle")}</h3>
        <ul>
          <li>{editable("purchaseNoteOfficial")}</li>
          <li>{editable("purchaseNoteOrder")}</li>
          <li>{editable("purchaseNoteBatch")}</li>
          {product.credentialFormatDescription ? <li>{product.credentialFormatDescription}</li> : null}
          {mode === "preorder" ? <li>{editable("preorderNote")}</li> : null}
        </ul>
      </section>
    ) : null}

    {product.businessType === "account" && product.afterSalesDescription ? (
      <section className="after-sales-note">
        <strong><ShieldCheck aria-hidden="true" />{editable("afterSalesTitle")}</strong>
        <p>{product.afterSalesDescription}</p>
      </section>
    ) : null}

    <dl className="payment-breakdown">
      <div><dt>商品金额</dt><dd>{money(total)}</dd></div>
      {availableBalance > 0 ? <div><dt>可用余额</dt><dd>{money(availableBalance)}</dd></div> : null}
      <div className="is-total">
        <dt>{balanceSufficient ? editable("totalLabel") : editable("purchaseTopUpTotal")}</dt>
        <dd>{balanceSufficient ? money(total) : money(gap)}</dd>
      </div>
    </dl>

    {balanceSufficient ? (
      <div className="payment-balance-method">
        <span><Check />平台余额</span>
        <small>支付后剩余 {money(availableBalance - total)}</small>
      </div>
    ) : (
      <div className="purchase-balance-warning">
        <div><TriangleAlert aria-hidden="true" /><strong>{money(gap)}</strong></div>
        <p>{editable("purchaseInsufficientHint")}</p>
      </div>
    )}
  </> : null;

  const successView = product && completion ? (
    <section className="payment-success-view">
      <span className="payment-success-icon"><CheckCircle2 aria-hidden="true" /></span>
      {editable("purchaseSuccess")}
      <h2>{product.name}</h2>
      <p>{editable("purchaseSuccessDescription")}</p>
      <dl className="payment-success-summary">
        <div><dt>订单金额</dt><dd>{money(total)}</dd></div>
        <div><dt>支付方式</dt><dd>平台余额</dd></div>
        <div><dt>{editable("purchaseBalancePaidLabel")}</dt><dd>{money(completion.paymentIntent.balanceApplied)}</dd></div>
      </dl>
      <div className="payment-success-actions">
        <Button variant="outline" onClick={onViewOrders}>查看订单</Button>
        <Button onClick={onBackToProducts}>返回商品页</Button>
      </div>
    </section>
  ) : null;

  return (
    <Dialog open={Boolean(product)} onOpenChange={onOpenChange}>
      <DialogContent className="purchase-dialog-account">
        <DialogHeader>
          <DialogTitle>{editable("purchaseSheetTitle")}</DialogTitle>
          <DialogDescription>
            {stage === "confirm" ? editable("purchaseSheetDescConfirm") : editable("purchaseSheetDescSuccess")}
          </DialogDescription>
        </DialogHeader>

        <div className="purchase-dialog-body" ref={bodyRef}>
          {stage === "confirm" ? confirmView : null}
          {stage === "success" ? successView : null}
        </div>

        {stage === "confirm" && product ? (
          <div className="purchase-dialog-actions">
            <button className="page-back-button" type="button" onClick={() => onOpenChange(false)}>{editable("cancel")}</button>
            {balanceSufficient ? (
              <Button className="payment-primary-action" disabled={submitting} onClick={handlePrimaryAction}>
                {editable("purchasePayAction")}
                <span>{money(total)}</span>
              </Button>
            ) : (
              <Button className="payment-primary-action" disabled={submitting} onClick={handleGoTopup}>
                {editable("purchaseGoTopup")}
                <span>{money(gap)}</span>
              </Button>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
