"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Headphones,
  Layers3,
  MapPin,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import type { DashboardDestination } from "@/data/account-dashboard";

const serviceCards = [
  {
    eyebrow: "ACCOUNT SUBSCRIPTION",
    title: "GPT / Claude 代充",
    audience: "适用于已有 GPT / Claude 账号的用户",
    description: "选择 Plus、Pro、Max 等套餐，提交代充需求并查看办理状态。",
    features: ["ChatGPT / Claude", "Plus · Pro · Max", "支持批量办理"],
    icon: Zap,
    action: "去办理代充",
    destination: "recharge" as const,
    tone: "dark",
  },
  {
    eyebrow: "READY ACCOUNT",
    title: "购买成品号",
    audience: "适用于还没有可用账号的用户",
    description: "选择 ChatGPT 或 Claude 成品号，按地区和套餐快速完成购买。",
    features: ["ChatGPT / Claude", "PH · US · JP", "可直接使用"],
    icon: PackageOpen,
    action: "去购买成品号",
    destination: "account" as const,
    tone: "light",
  },
];

const benefits = [
  { icon: Layers3, title: "多卡头资源", text: "接入多种上游卡源，按服务和地区匹配可用资源。" },
  { icon: ShieldCheck, title: "低门槛办理", text: "无需自行绑卡或研究复杂开通流程，按需选择服务。" },
  { icon: Users, title: "支持批量用户", text: "适合工作室、团队和长期使用账号的用户集中办理。" },
];

const stats = [
  { label: "VISITS", target: 1286420, prefix: "", suffix: "+" },
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
          <span className="compact-eyebrow"><Sparkles />AI ACCOUNT SERVICE · SOURCE-POWERED</span>
          <h1>ChatGPT / Claude<br /><strong>账号代充</strong><br /><em>成品号服务</em></h1>
          <p>源头卡头资源接入，代充与成品号一站办理。无需绑卡，按地区与套餐快速开通。</p>
          <div className="compact-actions">
            <div className="compact-action-stack"><button type="button" className="compact-button compact-button-primary" onClick={() => onNavigate("recharge")}>开始代充<ArrowRight /></button><small>已有 ChatGPT / Claude 账号</small></div>
            <div className="compact-action-stack"><button type="button" className="compact-button compact-button-secondary" onClick={() => onNavigate("account")}>购买成品号</button><small>需要即用的 AI 账号</small></div>
          </div>
          <div className="compact-hero-stats" aria-label="平台数据示意"><span className="compact-hero-stats-label">PLATFORM SIGNALS · LIVE DEMO</span><div className="compact-stats">{stats.map(({ label, prefix, suffix }, index) => <span key={label}><small>{label}</small><strong>{prefix}{statValues[index].toLocaleString("en-US")}{suffix}</strong></span>)}</div></div>
          <div className="compact-hero-tags" aria-label="服务特点"><span><Layers3 />源头卡头资源</span><span><Layers3 />多卡头匹配</span><span><ShieldCheck />无需绑卡</span><span><Clock3 />状态可查</span></div>
        </div>

        <div className="compact-hero-visual compact-reveal is-visible">
          <div className="compact-orbit-scene" aria-label="Sukai 多卡头服务资源中枢">
            <div className="compact-orbit-halo" aria-hidden="true" />
            <div className="compact-orbit-ring compact-orbit-ring-outer" aria-hidden="true" />
            <div className="compact-orbit-ring compact-orbit-ring-inner" aria-hidden="true" />
            <div className="compact-orbit-node compact-orbit-node-chatgpt"><span className="compact-console-logo compact-console-logo-openai"><img src="/brands/openai.svg" alt="" /></span><small>CHATGPT</small><b>PLUS</b></div>
            <div className="compact-orbit-node compact-orbit-node-claude"><span className="compact-console-logo compact-console-logo-claude"><img src="/brands/claude.svg" alt="" /></span><small>CLAUDE</small><b>PRO</b></div>
            <div className="compact-orbit-node compact-orbit-node-source"><span className="compact-live-dot" /><small>SOURCE HEAD</small><b>54502000</b></div>
            <div className="compact-resource-core">
              <span className="compact-core-top"><i /><i /><i /><b>ONLINE</b></span>
              <div className="compact-core-brand">SUKAI<span>/ RESOURCE HUB</span></div>
              <strong>Multi-source<br /><em>AI services.</em></strong>
              <p>多卡头源头资源<br />匹配更快 · 成本更低</p>
              <div className="compact-core-status"><span><Check />代充可用</span><span><Check />成品号可用</span></div>
            </div>
            <div className="compact-orbit-float compact-orbit-float-region"><MapPin /><span><small>AVAILABLE REGION</small><b>US / JP / PH</b></span></div>
            <div className="compact-orbit-float compact-orbit-float-order"><Zap /><span><small>ORDER STATUS</small><b>READY TO USE</b></span></div>
          </div>
        </div>
      </div>
      <div className="compact-scroll-hint">SCROLL TO EXPLORE <i /></div>
    </section>

    <section className="compact-section compact-services-section"><div className="compact-container"><div className="compact-section-heading compact-reveal"><span>START WITH YOUR SERVICE</span><h2>直接选择要办理的服务</h2><p>两个入口对应两种办理方式，进入后按页面指引完成选择。</p></div><div className="compact-service-grid">{serviceCards.map((card) => { const Icon = card.icon; return <article className={`compact-service-card compact-service-card-${card.tone} compact-reveal`} key={card.title}><div className="compact-card-top"><span>{card.eyebrow}</span><b>0{card.destination === "recharge" ? "1" : "2"}</b></div><span className="compact-card-icon"><Icon /></span><h3>{card.title}</h3><small className="compact-card-audience">{card.audience}</small><p>{card.description}</p><ul>{card.features.map((feature) => <li key={feature}><Check />{feature}</li>)}</ul><button type="button" onClick={() => onNavigate(card.destination)}>{card.action}<ArrowRight /></button></article>; })}</div></div></section>

    <section className="compact-resource-section"><div className="compact-container"><div className="compact-resource-heading compact-reveal"><div><span>RESOURCE POOL</span><h2>源头卡头资源，降低代充与代开成本</h2></div><p>平台接入多种上游卡源，根据服务、套餐和地区匹配可用资源。</p></div><div className="compact-resource-ticker compact-reveal"><span>RESOURCE HEADS · SAMPLE</span><div>{resourceHeads.map((head) => <b key={head}><i />{head}</b>)}</div><small>资源池编号示例</small></div><div className="compact-benefit-grid">{benefits.map(({ icon: Icon, title, text }) => <article className="compact-benefit compact-reveal" key={title}><span><Icon /></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div></section>

    <section className="compact-register-section"><div className="compact-container compact-register-inner compact-reveal"><div><span className="compact-eyebrow compact-eyebrow-dark"><Zap />READY WHEN YOU ARE</span><h2>注册后，直接开始办理</h2><p>购买成品号、办理 GPT / Claude 代充，订单状态统一查看。</p></div><div className="compact-register-actions"><button type="button" className="compact-button compact-button-primary" onClick={onRegister}>注册并开始办理<ArrowRight /></button><button type="button" className="compact-button compact-button-light" onClick={onLogin}>已有账号，直接登录</button></div></div></section>

    <footer className="compact-footer"><div className="compact-container compact-footer-inner"><div className="compact-footer-brand"><span>S</span><div><strong>Sukai 速开</strong><small>GPT / Claude 账号与订阅服务平台</small></div></div><nav aria-label="页脚导航"><button type="button" onClick={() => onNavigate("account")}>购买成品号</button><button type="button" onClick={() => onNavigate("recharge")}>GPT / Claude 代充</button><button type="button" onClick={onSupport}><Headphones />在线客服</button></nav><div className="compact-footer-actions"><button type="button" onClick={onLogin}>登录</button><button type="button" onClick={onRegister}>注册</button></div><p>“官方套餐”指对应平台提供的订阅套餐；SUKAI 并非 OpenAI、Anthropic 或其他 AI 平台的官方合作方。实际服务与售后范围以商品及结账页面为准。</p></div></footer>
  </div>;
}
