"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  ShieldCheck,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { EditableText } from "@/components/editable-text";
import { CryptoPaymentPanel } from "@/components/payment-experience";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { type CopyUpdater } from "@/components/user-center-shared";
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

type TopUpStep = 1 | 2 | 3;

type AdviceKey = "topupNetworkAdvice1" | "topupNetworkAdvice2" | "topupNetworkAdvice3";

const quickAmounts = [10, 50, 100, 300, 500, 1000];

const networkOptions: Array<{
  id: PaymentNetwork;
  hintKey: "topupNetworkTrc20Hint" | "topupNetworkErc20Hint";
}> = [
  { id: "trc20", hintKey: "topupNetworkTrc20Hint" },
  { id: "erc20", hintKey: "topupNetworkErc20Hint" },
];

const networkAdvice: Array<{ key: AdviceKey; icon: typeof WalletCards }> = [
  { key: "topupNetworkAdvice1", icon: WalletCards },
  { key: "topupNetworkAdvice2", icon: Clock3 },
  { key: "topupNetworkAdvice3", icon: TriangleAlert },
];

const processSteps = [
  { title: "选择充值金额", description: "输入金额或选择快捷档位，金额 1:1 计入钱包可用余额。" },
  { title: "选择支付网络", description: "仅支持 TRC20 / ERC20，请与付款钱包的网络保持一致。" },
  { title: "扫码完成转账", description: "向页面地址转入精确金额，系统按金额自动匹配支付单。" },
  { title: "等待链上确认到账", description: "链上确认后（通常 5 分钟以内）余额自动更新，并生成对应的充值记录。" },
];

const faqItems = [
  { id: "arrival", question: "充值多久到账？", answer: "链上确认后自动到账，通常 5 分钟以内；金额按 1:1 计入钱包余额。最终到账时间以链上确认为准。" },
  { id: "network", question: "选错网络怎么办？", answer: "不同网络之间无法互转。充值前请确认付款钱包的网络与页面所选网络一致，否则资金可能无法识别。" },
  { id: "fee", question: "充值要手续费吗？", answer: "链上转账手续费由对应网络收取，平台不额外收取充值手续费；具体金额以你的钱包或交易所显示为准。" },
  { id: "refund", question: "充值可以退吗？", answer: "链上转账不可撤回。如果转错地址或金额，请联系客服并提供支付单号人工核对。" },
  { id: "minimum", question: "最小充值金额是多少？", answer: "最小充值金额为 $1.00，低于该金额无法自动匹配到账。" },
];

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function splitAdvice(text: string) {
  const match = text.match(/^([^：:]{2,16})[：:]\s*(.+)$/);
  return match ? { title: match[1], detail: match[2] } : { title: "", detail: text };
}

export function WalletRechargePage({
  content,
  editMode,
  updateContent,
  availableBalance,
  topUpRecords,
  onBack,
  onComplete,
  onSupport,
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
  onSupport: () => void;
  /** 从购买弹窗跳来时预填的充值金额（订单缺口额）；不传时沿用默认 100。 */
  initialAmount?: number;
  /** 传入时，成功态额外渲染 primary 的「返回订单继续支付」按钮。 */
  onResumeOrder?: () => void;
  /** 传入时，页头下方渲染一条「正在为订单补足余额」提示条。 */
  pendingOrderHint?: string;
}) {
  const [step, setStep] = useState<TopUpStep>(1);
  // 初值只在挂载时取一次：从商品页跳来是新挂载，不要用 effect 同步，否则会冲掉用户手动改过的金额。
  const [amount, setAmount] = useState(initialAmount ?? 100);
  const [network, setNetwork] = useState<PaymentNetwork>("trc20");
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [completion, setCompletion] = useState<PaymentCompletion | null>(null);
  const recentRecords = topUpRecords.slice(0, 3);

  const resetToStart = () => {
    setIntent(null);
    setCompletion(null);
    setStep(1);
  };

  const beginPayment = () => {
    setIntent(createPaymentIntent({ mode: "wallet_recharge", amount, availableBalance, network }));
    setCompletion(null);
    setStep(3);
  };

  const finishPayment = (receivedAmount: number) => {
    if (!intent) return;
    const result = completeMockPayment({ intent, availableBalance, receivedAmount });
    setIntent(result.paymentIntent);
    setCompletion(result);
    onComplete(result);
    toast.success(`充值成功，已到账 ${money(result.paymentIntent.receivedAmount)}`);
  };

  // 「查询到账状态」：第一次点击模拟检测到转账（进入链上确认中），再次点击完成到账。
  const queryArrivalStatus = () => {
    if (!intent) return;
    if (intent.status === "confirming" || intent.status === "detected") {
      finishPayment(intent.receivedAmount || intent.uniquePayableAmount);
      return;
    }
    setIntent({ ...intent, receivedAmount: intent.uniquePayableAmount, status: "confirming" });
    toast.info("已检测到您的链上转账，正在确认，请稍后再查询");
  };

  const resumePayment = (record: { amount: number; method: string }) => {
    setAmount(Math.max(1, record.amount));
    setNetwork(record.method.includes("ERC20") ? "erc20" : "trc20");
    setIntent(null);
    setCompletion(null);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info(`已恢复待支付充值单，金额 ${money(record.amount)}`);
  };

  const scrollToRecords = () => {
    document.getElementById("topup-records")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const networkInfo = paymentNetworks[network];
  const editable = (key: keyof DemoContent) => (
    <EditableText active={editMode} value={content[key]} onChange={(value) => updateContent(key, value)} />
  );

  const summaryCard = (
    <div className="topup-info-card">
      <h3>{editable("topupSummaryTitle")}</h3>
      <dl className="topup-summary-list">
        <div><dt>充值金额</dt><dd>{money(amount)}</dd></div>
        <div><dt>支付网络</dt><dd>{networkInfo.name}</dd></div>
        <div><dt>预计到账金额</dt><dd>{money(amount)}</dd></div>
      </dl>
      <p className="topup-note">充值金额 1:1 计入钱包可用余额，通常 {content.topupArrivalEta}到账。</p>
    </div>
  );

  const noticeCard = (
    <div className="topup-info-card">
      <h3>{editable("topupNoticeTitle")}</h3>
      <ul className="topup-notice-list">
        <li><ShieldCheck aria-hidden="true" /><span>仅支持 TRC20 / ERC20 两种网络</span></li>
        <li><Clock3 aria-hidden="true" /><span>链上确认后到账，通常 {content.topupArrivalEta}</span></li>
        <li><TriangleAlert aria-hidden="true" /><span>请转入精确金额，系统按金额自动匹配</span></li>
        <li><WalletCards aria-hidden="true" /><span>请勿使用其他网络或交易所提现通道</span></li>
      </ul>
      <p className="topup-note topup-fee-note">{editable("topupNetworkFeeNote")}</p>
    </div>
  );

  return <section className="topup-page">
    <header className="uc-page-heading topup-heading">
      <div className="uc-page-heading-copy">
        <span className="uc-page-heading-icon" aria-hidden="true"><WalletCards /></span>
        <div>
          <nav className="topup-breadcrumb" aria-label="面包屑"><span>钱包</span><ChevronRight aria-hidden="true" /><strong>充值</strong></nav>
          <h1>{editable("topupTitle")}</h1>
          <p>{editable("topupSubtitle")}</p>
        </div>
      </div>
      <button className="topup-back-button" type="button" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        {editable("topupBackWallet")}
      </button>
    </header>

    {pendingOrderHint ? <p className="payment-auto-deduction"><Clock3 aria-hidden="true" />{pendingOrderHint}</p> : null}

    {completion ? <section className="topup-card is-primary topup-success">
      <span className="topup-success-icon"><CheckCircle2 /></span>
      <span className="topup-success-eyebrow">{editable("topupSuccessEyebrow")}</span>
      <h2>{money(completion.paymentIntent.receivedAmount)} 已到账</h2>
      <p>{editable("topupSuccessHint")}</p>
      <dl className="topup-success-facts">
        <div><dt>到账金额</dt><dd>{money(completion.paymentIntent.receivedAmount)}</dd></div>
        <div><dt>当前钱包余额</dt><dd>{money(completion.newBalance)}</dd></div>
        <div><dt>充值单号</dt><dd><code>{completion.rechargeRecord?.id ?? completion.paymentIntent.id}</code></dd></div>
        <div><dt>支付网络</dt><dd>{paymentNetworks[completion.paymentIntent.network].name}</dd></div>
        <div><dt>到账时间</dt><dd>{new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-")}</dd></div>
      </dl>
      <div className="topup-success-actions">
        {onResumeOrder ? <Button className="topup-primary-button" onClick={onResumeOrder}>{editable("purchaseResumeOrder")}</Button> : null}
        <Button variant="outline" className="topup-secondary-button" onClick={scrollToRecords}>{editable("topupViewRecords")}</Button>
        <Button variant="outline" className="topup-secondary-button" onClick={onBack}>{editable("topupBackWallet")}</Button>
        {onResumeOrder
          ? <Button variant="outline" className="topup-secondary-button" onClick={resetToStart}>{editable("topupContinueRecharge")}</Button>
          : <Button className="topup-primary-button" onClick={resetToStart}>{editable("topupContinueRecharge")}</Button>}
      </div>
    </section> : <>
      <ol className="topup-steps">
        {([
          { index: 1 as TopUpStep, titleKey: "topupStepAmount" as const, meta: "输入金额或选择快捷档位" },
          { index: 2 as TopUpStep, titleKey: "topupStepNetwork" as const, meta: "TRC20 / ERC20" },
          { index: 3 as TopUpStep, titleKey: "topupStepPay" as const, meta: `转账后等待到账（${content.topupArrivalEta}）` },
        ]).map((item) => {
          const state = step > item.index ? "is-done" : step === item.index ? "is-current" : "is-todo";
          return <li className={state} key={item.index}>
            <button type="button" disabled={step < item.index} onClick={() => { if (step > item.index) { setIntent(null); setStep(item.index); } }}>
              <span>{step > item.index ? <Check aria-hidden="true" /> : item.index}</span>
              <div><strong>{editable(item.titleKey)}</strong><small>{item.meta}</small></div>
            </button>
          </li>;
        })}
      </ol>

      {step === 1 ? <section className="topup-card is-primary">
        <header className="topup-card-heading">
          <span className="topup-card-index">01</span>
          <div>
            <h2>{editable("topupStepAmount")}</h2>
            <p>{editable("topupStepAmountHint")}</p>
          </div>
        </header>
        <div className="topup-card-body">
          <div className="topup-card-main">
            <label className="topup-amount-field">
              <span>充值金额</span>
              <div>
                <b>$</b>
                <input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(Math.max(1, Number(event.target.value) || 1))} />
                <em>USDT</em>
              </div>
            </label>
            <div className="topup-quick-amounts" aria-label="快捷金额">
              {quickAmounts.map((value) => <button data-selected={amount === value} type="button" onClick={() => setAmount(value)} key={value}>${value}</button>)}
            </div>
            <p className="topup-note">{editable("topupMinAmount")}</p>
            <div className="topup-step-actions">
              <Button className="topup-primary-button" disabled={amount <= 0} onClick={() => setStep(2)}>下一步：选择支付网络</Button>
            </div>
          </div>
          <aside className="topup-card-info">{summaryCard}</aside>
        </div>
      </section> : null}

      {step === 2 ? <section className="topup-card is-primary">
        <header className="topup-card-heading">
          <span className="topup-card-index">02</span>
          <div>
            <h2>{editable("topupStepNetwork")}</h2>
            <p>{editable("topupStepNetworkHint")}</p>
          </div>
        </header>
        <div className="topup-card-body">
          <div className="topup-card-main">
            <div className="topup-network-grid" role="radiogroup" aria-label="选择支付网络">
              {networkOptions.map((option) => {
                const info = paymentNetworks[option.id];
                return <button
                  className="topup-network-card"
                  data-selected={network === option.id}
                  type="button"
                  role="radio"
                  aria-checked={network === option.id}
                  onClick={() => setNetwork(option.id)}
                  key={option.id}
                >
                  <span className="topup-radio"><i /></span>
                  <div>
                    <strong>{info.name}</strong>
                    <small>{info.networkName}</small>
                    <em>{editable(option.hintKey)}</em>
                    <ul>
                      <li>预计到账：{content.topupArrivalEta}</li>
                    </ul>
                  </div>
                </button>;
              })}
            </div>
            <div className="topup-advice">
              <h3>{editable("topupNetworkAdviceTitle")}</h3>
              <div className="topup-advice-grid">
                {networkAdvice.map((item) => {
                  const Icon = item.icon;
                  const advice = splitAdvice(String(content[item.key]));
                  return <article key={item.key}>
                    <span className="topup-advice-icon" aria-hidden="true"><Icon /></span>
                    {editMode ? editable(item.key) : <div><strong>{advice.title}</strong><p>{advice.detail}</p></div>}
                  </article>;
                })}
              </div>
            </div>
            <div className="topup-warning"><TriangleAlert aria-hidden="true" /><p>{editable("topupNetworkWarning")}</p></div>
            <div className="topup-step-actions">
              <Button variant="outline" className="topup-secondary-button" onClick={() => setStep(1)}>上一步</Button>
              <Button className="topup-primary-button" onClick={beginPayment}>生成收款信息</Button>
            </div>
          </div>
          <aside className="topup-card-info">
            {summaryCard}
            {noticeCard}
          </aside>
        </div>
      </section> : null}

      {step === 3 && intent ? <section className="topup-card is-pay">
        <header className="topup-card-heading">
          <span className="topup-card-index">03</span>
          <div>
            <h2>{editable("topupStepPay")}</h2>
            <p>{editable("topupStepPayHint")}</p>
          </div>
        </header>
        <CryptoPaymentPanel
          intent={intent}
          onIntentChange={setIntent}
          onComplete={finishPayment}
          showDemoControls={false}
          showTimeline={false}
          orderNo={intent.id}
          amountNotice="请注意小数点后尾数：如不按显示金额转账会导致不能正常到账（有些交易所会扣除手续费 请确保到账金额为显示金额）"
          countdownLabel={content.topupCountdownLabel}
          countdownHint={content.topupCountdownHint}
        />
        <p className="topup-note">{editable("topupWaitingHint")}</p>
        <p className="topup-note">关闭页面后可在下方充值记录中继续支付。</p>
        <div className="topup-step-actions">
          <Button className="topup-primary-button" onClick={queryArrivalStatus}>查询到账状态</Button>
          <Button variant="outline" className="topup-secondary-button" onClick={() => { setIntent(null); setStep(2); }}><ArrowLeft />返回修改支付方式</Button>
        </div>
      </section> : null}
    </>}

    <section className="topup-card topup-process">
      <header className="topup-supplement-heading">
        <div><h2>{editable("topupProcessTitle")}</h2><p>从选择金额到到账共 4 步，通常 {content.topupArrivalEta}完成。</p></div>
      </header>
      <ol>
        {processSteps.map((item, index) => <li key={item.title}>
          <span>{index + 1}</span>
          <strong>{item.title}</strong>
          <p>{item.description}</p>
        </li>)}
      </ol>
    </section>

    <section className="topup-card topup-records" id="topup-records">
      <header className="topup-supplement-heading">
        <div><h2>{editable("topupRecentTitle")}</h2><p>最近的充值单与到账状态，待支付充值单可以继续支付。</p></div>
        <button className="topup-link-button" type="button" onClick={onBack}>查看全部</button>
      </header>
      <div className="topup-record-list">
        {recentRecords.length ? recentRecords.map((record) => <article key={record.id}>
          <div className="topup-record-main">
            <code>{record.id}</code>
            <strong>{money(record.amount)}</strong>
            <span>{record.method}</span>
          </div>
          <div className="topup-record-meta">
            <span className={record.status === "已完成" ? "is-completed" : "is-pending"}><i />{record.status}</span>
            <time>{record.createdAt}</time>
            {record.status === "已完成"
              ? <small>完成于 {record.completedAt}</small>
              : <button type="button" onClick={() => resumePayment(record)}>{content.topupContinuePay}</button>}
          </div>
        </article>) : <p className="topup-note">还没有充值记录，完成第一笔充值后会显示在这里。</p>}
      </div>
    </section>

    <section className="topup-card topup-faq">
      <header className="topup-supplement-heading">
        <div><h2>{editable("topupFaqTitle")}</h2><p>关于到账时间、网络选择和金额的常见问题。</p></div>
      </header>
      <Accordion type="single" collapsible className="topup-faq-list">
        {faqItems.map((item) => <AccordionItem value={item.id} key={item.id}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.id === "fee" ? content.topupNetworkFeeNote : item.answer}</AccordionContent>
        </AccordionItem>)}
      </Accordion>
    </section>

    <section className="topup-support-strip">
      <span className="topup-support-icon" aria-hidden="true"><Headphones /></span>
      <div className="topup-support-copy">
        <strong>{editable("topupSupportStripTitle")}</strong>
        <p>{editable("topupSupportStripHint")}</p>
      </div>
      <Button variant="outline" className="topup-secondary-button" onClick={onSupport}>{editable("topupSupportAction")}</Button>
    </section>
  </section>;
}
