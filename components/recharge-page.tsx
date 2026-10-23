"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Check, CheckCircle2, Clock3, Copy, QrCode, RefreshCcw, TriangleAlert, Zap,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeading, type CopyUpdater } from "@/components/user-center-shared";
import { accountDashboardMock } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";
import {
  completeMockPayment,
  createPaymentIntent,
  paymentNetworks,
  type PaymentCompletion,
  type PaymentIntent,
  type PaymentNetwork,
} from "@/data/payment-mocks";
import "./recharge-page.css";

const quickAmounts = [50, 100, 200, 500, 1000];
const networks: PaymentNetwork[] = ["trc20", "erc20"];
const countdownStart = 15 * 60;

const prefixHint: Record<PaymentNetwork, string> = {
  trc20: "TRON · 地址以 T 开头",
  erc20: "Ethereum · 地址以 0x 开头",
};

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function clock(total: number) {
  const safe = Math.max(0, total);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function payable(value: number) {
  return value.toFixed(3);
}

/** 充值金额固定 3 位小数：尾数也是真金白银，不能四舍五入掉。 */
function money3(value: number) {
  return `$${value.toFixed(3)}`;
}

/** 应付金额：整数部分大字，尾数加品牌绿下划线，提醒用户这一串必须原样转。 */
function PayableAmount({ value, small = false }: { value: number; small?: boolean }) {
  const [whole, decimal] = payable(value).split(".");
  return <span className={small ? "rc-amount is-small" : "rc-amount"}>
    {whole}<span className="rc-amount-tail">.{decimal}</span><em>USDT</em>
  </span>;
}

/**
 * 充值页：三步竖轴（网络 → 金额 → 转账），全页不套卡片。
 * 付款信息仍由 data/payment-mocks 生成，接口字段一个没加。
 */
export function RechargePage({
  content,
  editMode,
  updateContent,
  availableBalance,
  topUpRecords,
  onBack,
  onComplete,
  initialAmount,
  onResumeOrder,
  pendingOrderHint,
}: {
  content: DemoContent;
  editMode: boolean;
  updateContent: CopyUpdater;
  availableBalance: number;
  topUpRecords: typeof accountDashboardMock.topUpRecords;
  onBack: () => void;
  onComplete: (completion: PaymentCompletion) => void;
  initialAmount?: number;
  onResumeOrder?: () => void;
  pendingOrderHint?: string;
}) {
  const [phase, setPhase] = useState<"form" | "pay" | "done">("form");
  const [amount, setAmount] = useState(initialAmount ?? 100);
  const [network, setNetwork] = useState<PaymentNetwork>("trc20");
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [completion, setCompletion] = useState<PaymentCompletion | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(countdownStart);
  const confirming = useRef(false);

  const recentRecords = topUpRecords.slice(0, 3);
  const topUpTotal = topUpRecords.reduce((sum, record) => sum + record.amount, 0);
  const networkInfo = paymentNetworks[intent?.network ?? network];
  const expired = intent?.status === "expired";
  const detected = intent?.status === "detected";

  useEffect(() => {
    if (phase !== "pay" || !intent || expired) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase, intent, expired]);

  useEffect(() => {
    if (secondsLeft > 0 || !intent || phase !== "pay") return;
    if (intent.status === "pending" || intent.status === "underpaid") {
      setIntent({ ...intent, status: "expired" });
    }
  }, [secondsLeft, intent, phase]);

  const finish = (current: PaymentIntent) => {
    const result = completeMockPayment({
      intent: current,
      availableBalance,
      receivedAmount: current.uniquePayableAmount,
    });
    setIntent(result.paymentIntent);
    setCompletion(result);
    setPhase("done");
    onComplete(result);
    toast.success(`充值成功，已到账 ${money3(result.paymentIntent.receivedAmount)}`);
  };

  // 点一次「我已转账」就够：先显示确认中，再自动完成，不再让用户点第二次。
  useEffect(() => {
    if (!intent || intent.status !== "detected" || phase !== "pay") return;
    const timer = window.setTimeout(() => finish(intent), 900);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent?.status, intent?.id, phase]);

  const begin = () => {
    setIntent(createPaymentIntent({ mode: "wallet_recharge", amount, availableBalance, network }));
    setSecondsLeft(countdownStart);
    confirming.current = false;
    setPhase("pay");
  };

  const modify = () => {
    setIntent(null);
    setCompletion(null);
    setSecondsLeft(countdownStart);
    setPhase("form");
  };

  const restart = () => {
    setIntent(null);
    setSecondsLeft(countdownStart);
    confirming.current = false;
    begin();
  };

  const confirmTransfer = () => {
    if (!intent || detected || confirming.current) return;
    confirming.current = true;
    setIntent({ ...intent, status: "detected", receivedAmount: intent.uniquePayableAmount });
  };

  const resumeRecord = (record: { amount: number; method: string }) => {
    setAmount(Math.max(1, Math.round(record.amount)));
    setNetwork(record.method.includes("ERC20") ? "erc20" : "trc20");
    setIntent(null);
    setCompletion(null);
    setPhase("form");
    toast.info(`已恢复待支付充值单，金额 ${money(record.amount)}`);
  };

  return <section className="rc-page">
    <PageHeading
      titleKey="topupTitle"
      subtitleKey="topupSubtitle"
      content={content}
      editMode={editMode}
      updateContent={updateContent}
      icon={<Zap aria-hidden="true" />}
      actions={phase === "pay" && intent ? <span className="rc-countdown" data-urgent={secondsLeft <= 300 || undefined}>
        <Clock3 aria-hidden="true" />{clock(secondsLeft)}
      </span> : undefined}
    />

    {/* 与卡片页的「共 N 张 · 卡内可用」同构：页头下面先给一行当前状态，再接流程 */}
    <div className="rc-meta">
      <span>当前余额 <strong>{money(availableBalance)}</strong></span>
      <span>累计充值 <strong>{money(topUpTotal)}</strong></span>
      <span>单笔限额 <strong>$10,000</strong></span>
    </div>

    {pendingOrderHint ? <p className="rc-pending"><Clock3 aria-hidden="true" />{pendingOrderHint}</p> : null}

    <div className="rc-grid">
      <div className="rc-main">

    {phase === "done" && completion ? <section className="rc-done">
      <span className="rc-done-icon"><CheckCircle2 aria-hidden="true" /></span>
      <span className="rc-done-label">充值到账</span>
      <strong>{money3(completion.paymentIntent.receivedAmount)}</strong>
      <p>当前可用余额 {money(completion.newBalance)}，流水已记入钱包。</p>
      <dl className="rc-done-facts">
        <div><dt>充值单号</dt><dd><code>{completion.rechargeRecord?.id ?? completion.paymentIntent.id}</code></dd></div>
        <div><dt>支付网络</dt><dd>{paymentNetworks[completion.paymentIntent.network].name}</dd></div>
        <div><dt>到账时间</dt><dd>{new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-")}</dd></div>
      </dl>
      <div className="rc-done-actions">
        {onResumeOrder ? <button className="rc-primary" type="button" onClick={onResumeOrder}>返回订单继续支付<ArrowRight aria-hidden="true" /></button> : null}
        <button className="rc-secondary" type="button" onClick={() => { setCompletion(null); setIntent(null); setPhase("form"); }}>再充一笔</button>
        <button className="rc-secondary" type="button" onClick={onBack}>查看钱包流水</button>
      </div>
    </section> : <ol className="rc-flow">
      <li className="rc-step" data-state={phase === "pay" ? "is-done" : "is-active"}>
        <span className="rc-step-dot">{phase === "form" ? "1" : <Check aria-hidden="true" />}</span>
        <div className="rc-step-body">
          <div className="rc-step-head">
            <strong>选择网络</strong>
            <span>钱包里的网络必须和这里一致</span>
          </div>
          {phase === "form" ? <>
            <div className="rc-networks" role="radiogroup" aria-label="选择支付网络">
              {networks.map((id) => <button
                className="rc-network"
                data-selected={network === id}
                type="button"
                role="radio"
                aria-checked={network === id}
                onClick={() => setNetwork(id)}
                key={id}
              >
                <span className="rc-radio" aria-hidden="true"><i /></span>
                <span className="rc-network-copy">
                  <strong>{paymentNetworks[id].name}</strong>
                  <small>{prefixHint[id]}</small>
                </span>
              </button>)}
            </div>
            <p className="rc-net-note">转账前对一遍地址前缀：T 开头是 TRC20，0x 开头是 ERC20。ERC20 与 BEP20 地址同为 0x 开头，光看地址分辨不出来。</p>
          </> : <div className="rc-line">
            <strong>{networkInfo.name}</strong>
            <small>{prefixHint[network]}</small>
            {phase === "pay" ? <button type="button" onClick={modify}>修改</button> : null}
          </div>}
        </div>
      </li>

      <li className="rc-step" data-state={phase === "pay" ? "is-done" : phase === "form" ? "is-active" : "is-todo"}>
        <span className="rc-step-dot">{phase === "form" ? "2" : <Check aria-hidden="true" />}</span>
        <div className="rc-step-body">
          <div className="rc-step-head">
            <strong>充值金额</strong>
            <span>最低 1 USDT，金额 1:1 计入余额</span>
          </div>
          {phase === "form" ? <>
            <label className="rc-amount-field">
              <span>$</span>
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={amount}
                onChange={(event) => setAmount(Math.max(1, Math.floor(Number(event.target.value) || 1)))}
              />
              <em>USDT</em>
            </label>
            <div className="rc-quick" aria-label="快捷金额">
              {quickAmounts.map((value) => <button
                type="button"
                data-selected={amount === value}
                onClick={() => setAmount(value)}
                key={value}
              >${value}</button>)}
            </div>
          </> : <div className="rc-line">
            <strong>{money3(intent?.uniquePayableAmount ?? amount)}</strong>
            <small>含匹配尾数，一并计入余额</small>
            {phase === "pay" ? <button type="button" onClick={modify}>修改</button> : null}
          </div>}
        </div>
      </li>

      <li className="rc-step" data-state={phase === "pay" ? "is-active" : "is-todo"}>
        <span className="rc-step-dot">3</span>
        <div className="rc-step-body">
          <div className="rc-step-head">
            <strong>转账</strong>
            <span>{phase === "pay" ? "在你的钱包里向下方地址转账" : "生成收款信息后显示金额、地址与二维码"}</span>
          </div>

          {phase === "form" ? <>
            <p className="rc-placeholder">生成后 15 分钟内有效。过期会自动失效，避免往旧单继续转账。</p>
            <button className="rc-primary" type="button" disabled={amount <= 0} onClick={begin}>
              生成收款信息<ArrowRight aria-hidden="true" />
            </button>
          </> : null}

          {phase === "pay" && intent ? <>
            {expired ? <div className="rc-expired">
              <TriangleAlert aria-hidden="true" />
              <div>
                <strong>支付单已过期</strong>
                <p>为避免往旧地址继续转账，地址和二维码已隐藏。</p>
              </div>
              <button type="button" onClick={restart}><RefreshCcw aria-hidden="true" />重新发起</button>
            </div> : <>
              <div className="rc-payable">
                <span className="rc-payable-label">应付金额</span>
                <PayableAmount value={intent.uniquePayableAmount} />
                <p>尾数用于匹配这笔充值。四舍五入成 {intent.uniquePayableAmount.toFixed(2)} 会匹配失败。</p>
                <button
                  className="rc-copy-amount"
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(payable(intent.uniquePayableAmount));
                    toast.success(`已复制 ${payable(intent.uniquePayableAmount)}，请在钱包选择 ${networkInfo.name}`);
                  }}
                ><Copy aria-hidden="true" />复制金额</button>
              </div>

              <div className="rc-pay-grid">
                <div className="rc-qr">
                  <span className="rc-qr-badge">{networkInfo.name}</span>
                  <div className="rc-qr-box" aria-label="Demo 收款二维码"><QrCode aria-hidden="true" /></div>
                  <p>扫码只带出地址，网络仍要在钱包里自己选。</p>
                </div>
                <div className="rc-address-block">
                  <span>收款地址</span>
                  <code>{networkInfo.address}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(networkInfo.address);
                      toast.success(`已复制，请在钱包选择 ${networkInfo.name}`);
                    }}
                  ><Copy aria-hidden="true" />复制地址</button>
                  <div className="rc-pay-state">
                    <span className={`rc-state is-${intent.status}`}><i />{detected ? "链上确认中" : "等待付款"}</span>
                    <small>充值单 {intent.id}</small>
                  </div>
                </div>
              </div>

              <div className="rc-warn">
                <TriangleAlert aria-hidden="true" />
                <p><strong>请从个人钱包转账，不要从交易所直接提币。</strong>部分交易所会抹掉三位小数或走内部地址，尾数就丢了。</p>
              </div>

              <button className="rc-primary" type="button" disabled={detected} onClick={confirmTransfer}>
                {detected ? "链上确认中…" : "我已转账，查询到账"}
              </button>
              <p className="rc-foot">通常 1–5 分钟到账。可以关掉页面，到账后余额自动更新。</p>
            </>}
          </> : null}
        </div>
      </li>
    </ol>}

        <p className="rc-policy">平台不收取充值手续费；链上手续费由你的钱包收取。</p>
      </div>

      <aside className="rc-aside">
        <section className="rc-records">
          <header>
            <strong>最近充值</strong>
            <button type="button" onClick={onBack}>查看钱包流水<ArrowRight aria-hidden="true" /></button>
          </header>
          {recentRecords.length ? <ul>
            {recentRecords.map((record) => <li key={record.id}>
              <div className="rc-record-top">
                <strong>{money(record.amount)}</strong>
                {record.status === "已完成"
                  ? <em className="is-done"><Check aria-hidden="true" />已完成</em>
                  : <button type="button" onClick={() => resumeRecord(record)}>继续支付</button>}
              </div>
              <div className="rc-record-meta">
                <code>{record.id}</code>
                <span>{record.method} · {record.createdAt}</span>
              </div>
            </li>)}
          </ul> : <p className="rc-empty">还没有充值记录，完成第一笔后会显示在这里。</p>}
        </section>
      </aside>
    </div>
  </section>;
}
