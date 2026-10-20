"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  CreditCard,
  Headphones,
  Layers3,
  MapPin,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";

import type { DashboardDestination } from "@/data/account-dashboard";

const serviceCards = [
  {
    eyebrow: "VIRTUAL CARD",
    title: "虚拟卡开卡",
    audience: "适用于需要海外支付能力的用户",
    description: "选卡段与发行地，用平台余额充值，卡内余额独立管理，订阅和线上消费直接刷。",
    features: ["Visa / Mastercard", "美国 · 中国香港", "开卡即时可用"],
    icon: CreditCard,
    action: "去开通虚拟卡",
    destination: "card" as const,
    tone: "dark",
    badge: "NEW",
  },
  {
    eyebrow: "SUBSCRIPTION TOP-UP",
    title: "GPT / Claude 代充",
    audience: "适用于已有账号、只想解决付款的用户",
    description: "选择 Plus、Pro、Max 等套餐提交代充，单账号和批量都支持。",
    features: ["ChatGPT / Claude", "Plus · Pro · Max", "支持批量办理"],
    icon: Zap,
    action: "去办理代充",
    destination: "recharge" as const,
    tone: "light",
    badge: "",
  },
  {
    eyebrow: "READY ACCOUNT",
    title: "购买成品号",
    audience: "适用于还没有可用账号的用户",
    description: "选择 ChatGPT 或 Claude 成品号，按地区和套餐下单，交付后直接登录使用。",
    features: ["ChatGPT / Claude", "US · JP · PH", "即时交付"],
    icon: PackageOpen,
    action: "去购买成品号",
    destination: "account" as const,
    tone: "light",
    badge: "",
  },
];

const compareRows = [
  { label: "需要已有账号吗", card: "不需要，自己注册", recharge: "必须已有账号", account: "不需要" },
  { label: "由谁完成付款", card: "你自己刷卡，订阅在自己名下", recharge: "平台代你付", account: "已含在号价里" },
  { label: "到账 / 可用时间", card: "开卡即时，充值实时到账", recharge: "一般 10–30 分钟", account: "下单后即时交付" },
  { label: "适合的场景", card: "AI 订阅、云服务、广告投放等海外支付", recharge: "已有号，只想续 Plus / Pro / Max", account: "马上要一个能用的号" },
  { label: "费用怎么看", card: "开卡费 + 充值费率，卡段页直接列出", recharge: "按套餐报价，无额外开卡成本", account: "按商品定价，含账号本身" },
];

const benefits = [
  { icon: Layers3, title: "多卡段资源", text: "Visa / Mastercard 多条卡段，美国与中国香港发行，按支付场景匹配。" },
  { icon: WalletCards, title: "余额分开管理", text: "平台余额和卡内余额各管各的，开卡、充值、退款都留流水。" },
  { icon: ShieldCheck, title: "费率写在明面上", text: "开卡费、充值费率、消费手续费都在卡段卡片上标清楚，不用问客服。" },
];

const stats = [
  { label: "CARDS ISSUED", target: 8420, prefix: "", suffix: "+" },
  { label: "REGISTERED", target: 18642, prefix: "", suffix: "+" },
  { label: "TOP-UP VOLUME", target: 3842190, prefix: "$", suffix: "+" },
];
const resourceHeads = ["54502000", "54493747", "54492360", "53240691", "53211359", "52737597", "52737560"];

export function PublicLandingPage({ onNavigate, onLogin, onRegister, onSupport }: {
  onNavigate: (destination: DashboardDestination) => void;
  onLogin: () => void;
  onRegister: () => void;
  onSupport: () => void;
}) {
  const [statValues, setStatValues] = useState(() => stats.map(() => 0));

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".compact-reveal"));
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const start = performance.now();
    const duration = 1500;
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setStatValues(stats.map(({ target }) => Math.round(target * eased)));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <div className="compact-home">
    <section className="compact-hero">
      <div className="compact-hero-gridlines" aria-hidden="true" />
      <div className="compact-hero-orb compact-hero-orb-one" aria-hidden="true" />
      <div className="compact-hero-orb compact-hero-orb-two" aria-hidden="true" />
      <div className="compact-hero-ring compact-hero-ring-one" aria-hidden="true" />
      <div className="compact-hero-particles" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <div className="compact-container compact-hero-grid">
        <div className="compact-hero-copy compact-reveal is-visible">
          <span className="compact-eyebrow"><Sparkles />AI ACCOUNTS · TOP-UP · VIRTUAL CARDS</span>
          <h1>AI 账号代充<br /><strong>虚拟卡支付</strong><br /><em>一个平台搞定</em></h1>
          <p>有账号就代充，没账号买成品号，<br />想自己订阅就开一张虚拟卡 —— 三条路，同一个账户。</p>
          <div className="compact-actions">
            <div className="compact-action-stack"><button type="button" className="compact-button compact-button-primary" onClick={() => onNavigate("card")}>开通虚拟卡<ArrowRight /></button><small>多卡段 · 开卡即时可用</small></div>
            <div className="compact-action-stack"><button type="button" className="compact-button compact-button-secondary" onClick={() => onNavigate("recharge")}>开始代充</button><small>已有账号，代付订阅</small></div>
          </div>
          <button type="button" className="compact-hero-tertiary" onClick={() => onNavigate("account")}>
            还没有账号？直接买成品号<ArrowRight />
          </button>
          <div className="compact-hero-stats" aria-label="平台数据示意"><span className="compact-hero-stats-label">PLATFORM SIGNALS · LIVE DEMO</span><div className="compact-stats">{stats.map(({ label, prefix, suffix }, index) => <span key={label}><small>{label}</small><strong>{prefix}{statValues[index].toLocaleString("en-US")}{suffix}</strong></span>)}</div></div>
          <div className="compact-hero-tags" aria-label="服务特点"><span><CreditCard />多卡段可用</span><span><ShieldCheck />无需自行绑卡</span><span><Users />支持批量办理</span><span><Clock3 />状态可查</span></div>
        </div>

        <div className="compact-hero-visual compact-reveal is-visible">
          <div className="compact-orbit-scene" aria-label="Sukai 账号、代充与虚拟卡服务中枢">
            <div className="compact-orbit-halo" aria-hidden="true" />
            <div className="compact-orbit-ring compact-orbit-ring-outer" aria-hidden="true" />
            <div className="compact-orbit-ring compact-orbit-ring-inner" aria-hidden="true" />
            <div className="compact-orbit-node compact-orbit-node-chatgpt"><span className="compact-console-logo compact-console-logo-openai"><img src="/brands/openai.svg" alt="" /></span><small>CHATGPT</small><b>PLUS</b></div>
            <div className="compact-orbit-node compact-orbit-node-claude"><span className="compact-console-logo compact-console-logo-claude"><img src="/brands/claude.svg" alt="" /></span><small>CLAUDE</small><b>PRO</b></div>
            <div className="compact-orbit-node compact-orbit-node-card"><span className="compact-orbit-card-icon"><CreditCard /></span><small>VIRTUAL CARD</small><b>US / HK</b></div>
            <div className="compact-resource-core">
              <span className="compact-core-top"><i /><i /><i /><b>ONLINE</b></span>
              <div className="compact-core-brand">SUKAI<span>/ AI SERVICE HUB</span></div>
              <strong>Accounts · Top-up<br /><em>&amp; cards.</em></strong>
              <p>账号 · 代充 · 虚拟卡<br />一个账户全部打通</p>
              <div className="compact-core-status"><span><Check />虚拟卡可用</span><span><Check />代充可用</span></div>
            </div>
            <div className="compact-orbit-float compact-orbit-float-region"><MapPin /><span><small>CARD REGION</small><b>US / HK</b></span></div>
            <div className="compact-orbit-float compact-orbit-float-order"><WalletCards /><span><small>OPEN FEE FROM</small><b>$0.10 / 张</b></span></div>
          </div>
        </div>
      </div>
      <div className="compact-scroll-hint">SCROLL TO EXPLORE <i /></div>
    </section>

    <section className="compact-section compact-services-section" id="services"><div className="compact-container"><div className="compact-section-heading compact-reveal"><span>THREE WAYS TO GET STARTED</span><h2>代充、成品号、虚拟卡</h2><p>同一套余额和订单体系，按你现在缺什么选入口。</p></div><div className="compact-service-grid">{serviceCards.map((card, index) => { const Icon = card.icon; return <article className={`compact-service-card compact-service-card-${card.tone} compact-reveal`} key={card.title}><div className="compact-card-top"><span>{card.eyebrow}</span><b>{card.badge ? <em className="compact-new-tag">{card.badge}</em> : `0${index + 1}`}</b></div><span className="compact-card-icon"><Icon /></span><h3>{card.title}</h3><small className="compact-card-audience">{card.audience}</small><p>{card.description}</p><ul>{card.features.map((feature) => <li key={feature}><Check />{feature}</li>)}</ul><button type="button" onClick={() => onNavigate(card.destination)}>{card.action}<ArrowRight /></button></article>; })}</div></div></section>

    <section className="compact-decide-section" id="how-to-choose"><div className="compact-container"><div className="compact-section-heading compact-reveal"><span>CHOOSE BY YOUR SITUATION</span><h2>三条路怎么选</h2><p>差别不在价格，在于账号归谁、由谁付款。对着这张表看一遍就清楚了。</p></div><div className="compact-compare-scroll compact-reveal"><div className="compact-compare"><div className="compact-compare-row is-head"><span className="compact-compare-label">对比项</span><span className="is-featured"><em>CARD</em>虚拟卡</span><span><em>TOP-UP</em>套餐代充</span><span><em>ACCOUNT</em>成品号</span></div>{compareRows.map((row) => <div className="compact-compare-row" key={row.label}><span className="compact-compare-label">{row.label}</span><span className="is-featured">{row.card}</span><span>{row.recharge}</span><span>{row.account}</span></div>)}</div></div><p className="compact-compare-hint">左右滑动查看完整对比</p><div className="compact-compare-foot compact-reveal"><p>三条业务共用平台余额，充值一次都能用；卡内余额单独存放，退款回到卡里。</p><div className="compact-compare-actions"><button type="button" onClick={() => onNavigate("card")}>开虚拟卡<ArrowRight /></button><button type="button" onClick={() => onNavigate("recharge")}>办代充<ArrowRight /></button><button type="button" onClick={() => onNavigate("account")}>买成品号<ArrowRight /></button></div></div></div></section>

    <section className="compact-resource-section" id="resources"><div className="compact-container"><div className="compact-resource-heading compact-reveal"><div><span>RESOURCE POOL</span><h2>多卡段资源，同时支撑虚拟卡与代充</h2></div><p>平台接入多种上游卡源，虚拟卡按场景匹配卡段，代充按套餐和地区匹配资源。</p></div><div className="compact-resource-ticker compact-reveal"><span>RESOURCE HEADS · SAMPLE</span><div>{resourceHeads.map((head) => <b key={head}><i />{head}</b>)}</div><small>资源池编号示例</small></div><div className="compact-benefit-grid">{benefits.map(({ icon: Icon, title, text }) => <article className="compact-benefit compact-reveal" key={title}><span><Icon /></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div></section>

    <section className="compact-register-section"><div className="compact-container compact-register-inner compact-reveal"><div><span className="compact-eyebrow compact-eyebrow-dark"><Zap />READY WHEN YOU ARE</span><h2>注册后，三条业务随时切换</h2><p>开虚拟卡、办代充、买成品号，余额和订单都在同一个账户里。</p></div><div className="compact-register-actions"><button type="button" className="compact-button compact-button-primary" onClick={onRegister}>注册并开始办理<ArrowRight /></button><button type="button" className="compact-button compact-button-light" onClick={onLogin}>已有账号，直接登录</button></div></div></section>

    <footer className="compact-footer"><div className="compact-container compact-footer-inner"><div className="compact-footer-brand"><span>S</span><div><strong>Sukai 速开</strong><small>AI 账号、代充与虚拟卡服务平台</small></div></div><nav aria-label="页脚导航"><button type="button" onClick={() => onNavigate("card")}>虚拟卡</button><button type="button" onClick={() => onNavigate("recharge")}>GPT / Claude 代充</button><button type="button" onClick={() => onNavigate("account")}>购买成品号</button><button type="button" onClick={onSupport}><Headphones />在线客服</button></nav><div className="compact-footer-actions"><button type="button" onClick={onLogin}>登录</button><button type="button" onClick={onRegister}>注册</button></div><p>“官方套餐”指对应平台提供的订阅套餐；SUKAI 并非 OpenAI、Anthropic 或其他 AI 平台的官方合作方。实际服务与售后范围以商品及结账页面为准。</p></div></footer>
  </div>;
}
