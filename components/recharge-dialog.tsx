"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, Copy, QrCode, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  completeMockPayment,
  createPaymentIntent,
  paymentNetworks,
  type PaymentCompletion,
  type PaymentIntent,
  type PaymentNetwork,
} from "@/data/payment-mocks";
import "./recharge-dialog.css";

const quickAmounts = [20, 50, 100, 300, 500, 1000];
const networks: PaymentNetwork[] = ["trc20", "erc20"];
const countdownStart = 15 * 60;

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function usdt(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 4)} USDT`;
}

function clock(total: number) {
  const safe = Math.max(0, total);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

/**
 * 轻量充值弹窗：一屏填完金额与网络，生成收款信息后在弹窗内切到付款视图。
 * 业务动作仍走 data/payment-mocks 的同一套 mock，不新增任何接口。
 */
export function RechargeDialog({
  open,
  onOpenChange,
  availableBalance,
  initialAmount,
  onComplete,
  onViewRecords,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  /** 待支付订单的缺口金额，从下单链路进来时预填。 */
  initialAmount?: number;
  onComplete: (completion: PaymentCompletion) => void;
  onViewRecords: () => void;
}) {
  const [amount, setAmount] = useState(initialAmount ?? 100);
  const [network, setNetwork] = useState<PaymentNetwork>("trc20");
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [completion, setCompletion] = useState<PaymentCompletion | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(countdownStart);
  const confirming = useRef(false);

  // 每次打开都回到「填金额」，避免上次的支付单残留。
  useEffect(() => {
    if (!open) return;
    setAmount(initialAmount ?? 100);
    setNetwork("trc20");
    setIntent(null);
    setCompletion(null);
    setSecondsLeft(countdownStart);
    confirming.current = false;
  }, [open, initialAmount]);

  useEffect(() => {
    if (!open || !intent || completion) return;
    if (intent.status === "expired" || intent.status === "failed") return;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [open, intent, completion]);

  useEffect(() => {
    if (secondsLeft > 0 || !intent || completion) return;
    if (intent.status === "pending" || intent.status === "underpaid") {
      setIntent({ ...intent, status: "expired" });
    }
  }, [secondsLeft, intent, completion]);

  const finish = (current: PaymentIntent) => {
    const result = completeMockPayment({ intent: current, availableBalance, receivedAmount: current.uniquePayableAmount });
    setIntent(result.paymentIntent);
    setCompletion(result);
    onComplete(result);
    toast.success(`充值成功，已到账 ${money(result.paymentIntent.receivedAmount)}`);
  };

  // 「我已转账」点一次即可：先显示已检测，再自动完成链上确认，不再要求用户点第二次。
  useEffect(() => {
    if (!intent || intent.status !== "detected" || completion) return;
    const timer = window.setTimeout(() => finish(intent), 900);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent?.status, intent?.id]);

  const begin = () => {
    setIntent(createPaymentIntent({ mode: "wallet_recharge", amount, availableBalance, network }));
    setSecondsLeft(countdownStart);
  };

  const confirmTransfer = () => {
    if (!intent || intent.status === "detected" || confirming.current) return;
    confirming.current = true;
    setIntent({ ...intent, status: "detected", receivedAmount: intent.uniquePayableAmount });
  };

  const statusLabel = intent?.status === "detected" ? "链上确认中"
    : intent?.status === "expired" ? "支付已过期"
      : intent?.status === "failed" ? "支付失败" : "等待付款";

  const info = intent ? paymentNetworks[intent.network] : paymentNetworks[network];
  const stage = completion ? "done" : intent ? "pay" : "form";

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="rd-dialog" showCloseButton={false}>
      <DialogTitle className="sr-only">平台充值</DialogTitle>
      <DialogDescription className="sr-only">选择金额与网络，向收款地址转入对应 USDT 完成充值。</DialogDescription>

      <header className="rd-head">
        <div>
          <h2>{stage === "done" ? "充值成功" : stage === "pay" ? "完成转账" : "充值"}</h2>
          <p>{stage === "pay" ? "按下方金额转账，系统自动匹配到账" : "金额 1:1 计入平台余额，通常 5 分钟内到账"}</p>
        </div>
        <button className="rd-close" type="button" onClick={() => onOpenChange(false)} aria-label="关闭">
          <span aria-hidden="true">×</span>
        </button>
      </header>

      {stage === "form" ? <>
        <div className="rd-balance">
          <span>当前平台余额</span>
          <strong>{money(availableBalance)}</strong>
        </div>

        <label className="rd-field">
          <span className="rd-label">充值金额</span>
          <div className="rd-amount">
            <b>$</b>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              autoFocus
              onChange={(event) => setAmount(Math.max(1, Number(event.target.value) || 1))}
            />
            <em>USDT</em>
          </div>
        </label>

        <div className="rd-quick" aria-label="快捷金额">
          {quickAmounts.map((value) => <button key={value} type="button" data-selected={amount === value} onClick={() => setAmount(value)}>${value}</button>)}
        </div>

        <div className="rd-field">
          <span className="rd-label">支付网络</span>
          <div className="rd-networks" role="radiogroup" aria-label="选择支付网络">
            {networks.map((id) => <button
              key={id}
              type="button"
              role="radio"
              aria-checked={network === id}
              data-selected={network === id}
              onClick={() => setNetwork(id)}
            >
              <span className="rd-radio" aria-hidden="true"><i /></span>
              <span className="rd-network-copy">
                <strong>{paymentNetworks[id].name}</strong>
                <small>{paymentNetworks[id].networkName}</small>
              </span>
            </button>)}
          </div>
        </div>

        <div className="rd-hint">
          <TriangleAlert aria-hidden="true" />
          <p>收款网络必须与付款钱包一致，转错网络无法找回。最低充值 $1.00。</p>
        </div>

        <button className="rd-primary" type="button" disabled={amount <= 0} onClick={begin}>
          生成收款信息
        </button>
      </> : null}

      {stage === "pay" && intent ? <>
        <button className="rd-back" type="button" onClick={() => setIntent(null)}>
          <ArrowLeft aria-hidden="true" />修改金额
        </button>

        <div className="rd-pay-head">
          <span className="rd-label">应付金额</span>
          <strong>{usdt(intent.uniquePayableAmount)}</strong>
          <div className="rd-pay-meta">
            <span className={`rd-state is-${intent.status}`}><i />{statusLabel}</span>
            <span className="rd-countdown" data-urgent={secondsLeft <= 300 || undefined}><Clock3 aria-hidden="true" />{clock(secondsLeft)}</span>
          </div>
        </div>

        {intent.status === "expired" ? <div className="rd-expired">
          <TriangleAlert aria-hidden="true" />
          <div><strong>支付已过期</strong><p>未检测到付款，请重新生成收款信息。</p></div>
          <button type="button" onClick={() => { setIntent(null); setSecondsLeft(countdownStart); }}>重新发起</button>
        </div> : <>
          <div className="rd-qr">
            <div className="rd-qr-box" aria-label="Demo 收款二维码"><QrCode aria-hidden="true" /></div>
            <div className="rd-qr-side">
              <span className="rd-network-pill">{info.name}</span>
              <p>扫码或复制地址，转入 <strong>{usdt(intent.uniquePayableAmount)}</strong></p>
              <div className="rd-address">
                <code>{info.address}</code>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(info.address); toast.success("收款地址已复制"); }}><Copy aria-hidden="true" />复制</button>
              </div>
            </div>
          </div>

          <div className="rd-hint is-warn">
            <ShieldCheck aria-hidden="true" />
            <p>必须按显示金额转入，包含小数点后的尾数，否则无法自动匹配到账。</p>
          </div>

          <button className="rd-primary" type="button" disabled={intent.status === "detected"} onClick={confirmTransfer}>
            {intent.status === "detected" ? "链上确认中…" : "我已转账，查询到账"}
          </button>
          <p className="rd-foot-note">转账后通常 1–5 分钟到账，本页可关闭，到账后余额自动更新。</p>
        </>}
      </> : null}

      {stage === "done" && completion ? <>
        <div className="rd-done">
          <span className="rd-done-icon"><CheckCircle2 aria-hidden="true" /></span>
          <strong>{money(completion.paymentIntent.receivedAmount)} 已到账</strong>
          <p>当前平台余额 {money(completion.newBalance)}</p>
        </div>
        <dl className="rd-facts">
          <div><dt>充值单号</dt><dd><code>{completion.rechargeRecord?.id ?? completion.paymentIntent.id}</code></dd></div>
          <div><dt>支付网络</dt><dd>{paymentNetworks[completion.paymentIntent.network].name}</dd></div>
        </dl>
        <button className="rd-primary" type="button" onClick={() => onOpenChange(false)}>完成</button>
        <button className="rd-ghost" type="button" onClick={() => { onOpenChange(false); onViewRecords(); }}>查看充值记录</button>
      </> : null}
    </DialogContent>
  </Dialog>;
}
