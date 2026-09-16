"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft, Check, CheckCircle2, Clock3, Copy,
  QrCode, RefreshCcw, ShieldCheck, TriangleAlert, WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  completeMockPayment,
  createPaymentIntent,
  getPaymentMode,
  paymentNetworks,
  type PaymentCompletion,
  type PaymentIntent,
  type PaymentMode,
  type PaymentNetwork,
  type ProductOrder,
} from "@/data/payment-mocks";

type PaymentStage = "setup" | "detail" | "success";

export type PaymentRequest = {
  mode: PaymentMode;
  amount?: number;
  order?: ProductOrder;
  history?: {
    id: string;
    status: string;
    method: string;
    purpose?: string;
    orderId?: string;
    createdAt: string;
    completedAt: string;
  };
};

function money(value: number, digits = 2) {
  return `$${value.toFixed(digits)}`;
}

function usdt(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 4)} USDT`;
}

function NetworkSelector({ value, onChange }: { value: PaymentNetwork; onChange: (value: PaymentNetwork) => void }) {
  return <div className="payment-network-grid" role="radiogroup" aria-label="选择支付网络">
    {(Object.values(paymentNetworks)).map((network) => <button
      className="payment-network-card"
      data-selected={value === network.id}
      type="button"
      role="radio"
      aria-checked={value === network.id}
      onClick={() => onChange(network.id)}
      key={network.id}
    >
      <span className="payment-radio"><i /></span>
      <span><strong>{network.name}</strong><small>{network.networkName}</small><em>{network.description}</em></span>
    </button>)}
  </div>;
}

function PaymentTimeline({ intent }: { intent: PaymentIntent }) {
  const orderMode = intent.mode === "order_payment";
  const items = orderMode ? ["等待付款", "链上确认", "支付完成", "自动处理订单"] : ["等待付款", "链上确认", "充值到账"];
  const activeIndex = intent.status === "pending" || intent.status === "underpaid" || intent.status === "expired" || intent.status === "failed"
    ? 0
    : intent.status === "detected" || intent.status === "confirming" ? 1 : items.length - 1;
  return <ol className="payment-timeline">
    {items.map((item, index) => <li className={index < activeIndex ? "is-done" : index === activeIndex ? "is-active" : ""} key={item}>
      <span>{index < activeIndex ? <Check /> : index + 1}</span><strong>{item}</strong>
    </li>)}
  </ol>;
}

export function CryptoPaymentPanel({
  intent,
  onIntentChange,
  onComplete,
}: {
  intent: PaymentIntent;
  onIntentChange: (intent: PaymentIntent) => void;
  onComplete: (receivedAmount: number) => void;
}) {
  const network = paymentNetworks[intent.network];
  const remaining = Math.max(0, intent.uniquePayableAmount - intent.receivedAmount);
  const statusLabel = intent.status === "underpaid" ? "等待补足金额"
    : intent.status === "detected" ? "已检测到链上交易"
      : intent.status === "confirming" ? "链上确认中"
        : intent.status === "expired" ? "支付已过期"
          : intent.status === "failed" ? "支付失败" : "等待付款";

  const setReceived = (amount: number) => {
    if (amount < intent.uniquePayableAmount) {
      onIntentChange({ ...intent, receivedAmount: amount, status: "underpaid" });
      return;
    }
    onIntentChange({ ...intent, receivedAmount: amount, status: "confirming" });
  };
  const simulateTimeout = () => {
    if (intent.status === "detected" || intent.status === "confirming" || intent.receivedAmount > 0) {
      onIntentChange({ ...intent, status: "confirming" });
      return;
    }
    onIntentChange({ ...intent, status: "expired", receivedAmount: 0 });
  };

  return <div className="crypto-payment-panel">
    <section className="payment-detail-card">
      <div className="payment-detail-heading">
        <div><span>支付状态</span><strong className={`payment-state is-${intent.status}`}><i />{statusLabel}</strong></div>
        <span className="payment-countdown"><Clock3 />29:42</span>
      </div>

      <div className="payment-amount-focus">
        <span>{intent.mode === "wallet_recharge" ? "应付金额" : "链上应付"}</span>
        <strong>{usdt(intent.uniquePayableAmount)}</strong>
        <p>此金额用于自动匹配当前支付，请按页面金额准确转账。</p>
      </div>

      {intent.mode === "order_payment" ? <dl className="payment-breakdown compact">
        <div><dt>商品金额</dt><dd>{money(intent.totalAmount)}</dd></div>
        <div><dt>余额抵扣</dt><dd>−{money(intent.balanceApplied)}</dd></div>
        <div className="is-total"><dt>链上待支付</dt><dd>{money(intent.cryptoAmount)}</dd></div>
      </dl> : <dl className="payment-breakdown compact"><div><dt>到账余额</dt><dd>{money(intent.cryptoAmount)}</dd></div></dl>}

      {intent.status === "underpaid" ? <div className="payment-underpaid-card">
        <div><span>已到账</span><strong>{usdt(intent.receivedAmount)}</strong></div>
        <div><span>还需支付</span><strong>{usdt(remaining)}</strong></div>
        <p>请继续向同一收款地址补足金额，支付单仍然有效。</p>
      </div> : null}

      {intent.status === "expired" ? <div className="payment-expired-card"><TriangleAlert /><div><strong>支付已过期</strong><p>尚未检测到付款，可以重新生成支付信息。</p></div><Button variant="outline" onClick={() => onIntentChange({ ...intent, status: "pending", receivedAmount: 0 })}><RefreshCcw />重新生成支付</Button></div> : null}

      <PaymentTimeline intent={intent} />
    </section>

    <aside className="payment-qr-card">
      <span className="payment-network-badge">{network.name}</span>
      <div className="payment-qr-placeholder" aria-label="Demo 支付二维码"><QrCode /></div>
      <strong>请使用 {network.name} 支付</strong>
      <div className="payment-address-block"><span>收款地址</span><code>{network.address}</code><button type="button" onClick={() => { navigator.clipboard?.writeText(network.address); toast.success("收款地址已复制"); }}><Copy />复制</button></div>
      <div className="payment-warning"><ShieldCheck /><p>仅支持 {network.name}，使用其他网络可能导致资金无法识别。</p></div>
    </aside>

    <section className="payment-demo-controls">
      <div><strong>Demo 状态演示</strong><span>仅改变前端 Mock 状态，不会发起真实付款。</span></div>
      <div>
        <button type="button" onClick={() => setReceived(Math.max(0, intent.uniquePayableAmount - 9))}>模拟少付</button>
        <button type="button" onClick={() => setReceived(intent.uniquePayableAmount + 1)}>模拟多付</button>
        <button type="button" onClick={() => onIntentChange({ ...intent, status: "detected", receivedAmount: intent.uniquePayableAmount })}>检测到交易</button>
        <button type="button" onClick={simulateTimeout}>模拟超时</button>
        <button type="button" onClick={() => onIntentChange({ ...intent, status: "failed", receivedAmount: 0 })}>模拟失败</button>
        {intent.status === "underpaid" ? <button className="is-primary" type="button" onClick={() => setReceived(intent.uniquePayableAmount)}>补足金额</button>
          : intent.status === "confirming" || intent.status === "detected" ? <button className="is-primary" type="button" onClick={() => onComplete(intent.receivedAmount || intent.uniquePayableAmount)}>完成链上确认</button>
            : <button className="is-primary" type="button" onClick={() => setReceived(intent.uniquePayableAmount)}>模拟足额付款</button>}
      </div>
    </section>
  </div>;
}

export function PaymentExperience({
  request,
  availableBalance,
  onComplete,
  onClose,
}: {
  request: PaymentRequest;
  availableBalance: number;
  onComplete: (completion: PaymentCompletion) => void;
  onClose: () => void;
}) {
  const initialMode = request.order ? getPaymentMode(request.order.amount, availableBalance) : request.mode;
  const [mode] = useState<PaymentMode>(initialMode);
  const [amount, setAmount] = useState(request.amount ?? 100);
  const [network, setNetwork] = useState<PaymentNetwork>("trc20");
  const [stage, setStage] = useState<PaymentStage>("setup");
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [completion, setCompletion] = useState<PaymentCompletion | null>(null);
  const orderAmount = request.order?.amount ?? amount;
  const balanceApplied = mode === "wallet_recharge" ? 0 : Math.min(orderAmount, availableBalance);
  const cryptoAmount = mode === "order_payment" ? Math.max(orderAmount - balanceApplied, 0) : amount;

  if (request.history) {
    return <section className="payment-history-view">
      <div className="payment-history-status"><CheckCircle2 /><div><span>充值状态</span><strong>{request.history.status}</strong></div></div>
      <div className="payment-amount-focus"><span>充值金额</span><strong>{money(amount)}</strong><p>该记录仅用于前端 Demo 展示。</p></div>
      <dl className="payment-history-details">
        <div><dt>充值单号</dt><dd><code>{request.history.id}</code></dd></div>
        <div><dt>支付网络</dt><dd>{request.history.method}</dd></div>
        <div><dt>用途</dt><dd>{request.history.purpose ?? "钱包充值"}</dd></div>
        <div><dt>关联订单</dt><dd><code>{request.history.orderId ?? "—"}</code></dd></div>
        <div><dt>创建时间</dt><dd>{request.history.createdAt}</dd></div>
        <div><dt>完成时间</dt><dd>{request.history.completedAt}</dd></div>
      </dl>
      <PaymentTimeline intent={{
        id: request.history.id,
        mode: "wallet_recharge",
        totalAmount: amount,
        balanceApplied: 0,
        cryptoAmount: amount,
        uniquePayableAmount: amount,
        network: request.history.method.includes("ERC20") ? "erc20" : "trc20",
        status: request.history.status === "已完成" ? "completed" : "pending",
        receivedAmount: request.history.status === "已完成" ? amount : 0,
      }} />
      <Button className="payment-primary-action" onClick={onClose}>返回钱包</Button>
    </section>;
  }

  const beginCryptoPayment = () => {
    const next = createPaymentIntent({ mode, amount: orderAmount, availableBalance, network, orderId: request.order?.id });
    setIntent(next);
    setStage("detail");
  };

  const finishPayment = (receivedAmount: number) => {
    if (!intent) return;
    const result = completeMockPayment({ intent, availableBalance, receivedAmount, order: request.order });
    setIntent(result.paymentIntent);
    setCompletion(result);
    setStage("success");
    onComplete(result);
  };

  const payWithBalance = () => {
    const balanceIntent = createPaymentIntent({ mode: "balance_payment", amount: orderAmount, availableBalance, network, orderId: request.order?.id });
    const result = completeMockPayment({ intent: balanceIntent, availableBalance, receivedAmount: 0, order: request.order });
    setCompletion(result);
    setStage("success");
    onComplete(result);
  };

  if (stage === "success" && completion) {
    return <section className="payment-success-view">
      <span className="payment-success-icon"><CheckCircle2 /></span>
      <span>{mode === "wallet_recharge" ? "充值成功" : "支付成功"}</span>
      <h2>{mode === "wallet_recharge" ? `${money(completion.paymentIntent.receivedAmount)} 已到账` : request.order?.productName}</h2>
      <p>{mode === "wallet_recharge" ? `当前钱包余额 ${money(completion.newBalance)}` : "订单已提交，正在进入后续处理流程。"}</p>
      {completion.overpaidAmount > 0 ? <div className="payment-overpaid-note">多支付的 {money(completion.overpaidAmount)} 已计入钱包余额。</div> : null}
      {mode !== "wallet_recharge" ? <dl className="payment-success-summary">
        <div><dt>订单金额</dt><dd>{money(orderAmount)}</dd></div>
        <div><dt>支付方式</dt><dd>{mode === "balance_payment" ? "平台余额" : paymentNetworks[network].name}</dd></div>
        <div><dt>余额抵扣</dt><dd>{money(balanceApplied)}</dd></div>
        {mode === "order_payment" ? <div><dt>链上支付</dt><dd>{usdt(completion.paymentIntent.receivedAmount)}</dd></div> : null}
      </dl> : null}
      <div className="payment-success-actions"><Button variant="outline" onClick={onClose}>{mode === "wallet_recharge" ? "查看钱包" : "查看订单"}</Button><Button onClick={onClose}>{mode === "wallet_recharge" ? "完成" : "返回首页"}</Button></div>
    </section>;
  }

  if (stage === "detail" && intent) {
    return <div className="payment-experience-detail">
      <button className="payment-back-button" type="button" onClick={() => setStage("setup")}><ArrowLeft />返回修改支付方式</button>
      <CryptoPaymentPanel intent={intent} onIntentChange={setIntent} onComplete={finishPayment} />
    </div>;
  }

  return <div className="payment-setup-view">
    {mode === "wallet_recharge" ? <>
      <section className="payment-setup-card">
        <label className="payment-amount-input"><span>充值金额</span><div><b>$</b><input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(Math.max(1, Number(event.target.value) || 1))} /></div></label>
        <div className="payment-quick-amounts" aria-label="快捷金额">{[10, 50, 100, 300].map((value) => <button data-selected={amount === value} type="button" onClick={() => setAmount(value)} key={value}>${value}</button>)}</div>
      </section>
      <section className="payment-section"><div className="payment-section-heading"><strong>支付网络</strong><span>同一时间只能选择一种网络</span></div><NetworkSelector value={network} onChange={setNetwork} /></section>
      <section className="payment-payable-bar"><div><span>预计到账</span><strong>{money(amount)}</strong></div><Button disabled={amount <= 0} onClick={beginCryptoPayment}>继续充值</Button></section>
    </> : <>
      <section className="order-payment-product"><span className="order-payment-icon"><WalletCards /></span><div><small>商品摘要</small><strong>{request.order?.productName}</strong><code>{request.order?.id}</code></div><b>{money(orderAmount)}</b></section>
      <dl className="payment-breakdown">
        <div><dt>商品金额</dt><dd>{money(orderAmount)}</dd></div>
        <div><dt>可用余额</dt><dd>{money(availableBalance)}</dd></div>
        {mode === "order_payment" ? <div><dt>余额抵扣</dt><dd className="is-deduction">−{money(balanceApplied)}</dd></div> : null}
        <div className="is-total"><dt>{mode === "balance_payment" ? "本次支付" : "待支付"}</dt><dd>{mode === "balance_payment" ? money(orderAmount) : money(cryptoAmount)}</dd></div>
      </dl>
      {mode === "balance_payment" ? <>
        <div className="payment-balance-method"><span><Check />平台余额</span><small>支付后剩余 {money(availableBalance - orderAmount)}</small></div>
        <Button className="payment-primary-action" onClick={payWithBalance}>确认支付 {money(orderAmount)}</Button>
      </> : <>
        <div className="payment-auto-deduction"><Check />账户余额将自动抵扣，仅需支付剩余 {money(cryptoAmount)}。</div>
        <section className="payment-section"><div className="payment-section-heading"><strong>请选择补差额方式</strong><span>订单金额不可修改</span></div><NetworkSelector value={network} onChange={setNetwork} /></section>
        <Button className="payment-primary-action" onClick={beginCryptoPayment}>支付 {usdt(cryptoAmount)}</Button>
      </>}
    </>}
  </div>;
}

export function PaymentFlowSheet({
  open,
  request,
  availableBalance,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  request: PaymentRequest | null;
  availableBalance: number;
  onOpenChange: (open: boolean) => void;
  onComplete: (completion: PaymentCompletion) => void;
}) {
  const requestKey = useMemo(() => request ? `${request.mode}-${request.order?.id ?? request.history?.id ?? "wallet"}-${request.amount ?? "amount"}` : "none", [request]);
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="payment-flow-sheet" side="right">
      <SheetHeader>
        <SheetTitle>{request?.mode === "wallet_recharge" ? "充值" : "支付订单"}</SheetTitle>
        <SheetDescription>{request?.mode === "wallet_recharge" ? "为 SUKAI 钱包增加可用余额。" : "确认金额并完成本次订单支付。"}</SheetDescription>
      </SheetHeader>
      {request ? <PaymentExperience key={requestKey} request={request} availableBalance={availableBalance} onComplete={onComplete} onClose={() => onOpenChange(false)} /> : null}
    </SheetContent>
  </Sheet>;
}
