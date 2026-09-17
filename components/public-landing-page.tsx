"use client";

import { useState } from "react";
import {
  ArrowRight, BookOpen, Bot, Boxes, Check, CircleDollarSign, ClipboardCheck,
  CreditCard, FileStack, Headphones, MapPin, PackageOpen, RefreshCcw,
  Sparkles, UserRound, Zap,
} from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { DashboardDestination } from "@/data/account-dashboard";

const benefits = [
  { icon: PackageOpen, title: "账号与套餐集中选择", text: "ChatGPT、Claude 的账号商品与套餐升级入口集中呈现，减少反复查找。" },
  { icon: MapPin, title: "多区域账号可选", text: "按实际库存提供菲区、美区、日区等账号选择，具体区域以商品页面为准。" },
  { icon: CreditCard, title: "灵活支付方式", text: "支持钱包余额及 USDT，订单不足部分可通过 TRC20 / ERC20 补差额。" },
  { icon: ClipboardCheck, title: "订单进度清晰可查", text: "账号交付、套餐办理与支付状态集中管理，重要进度随时查看。" },
];

const brandServices = [
  { id: "chatgpt-account", brand: "ChatGPT", logo: "/brands/openai.svg", title: "ChatGPT 账号", text: "选择适合的套餐与可售区域，购买即买即用的账号商品。", destination: "account" as const, action: "查看账号" },
  { id: "chatgpt-recharge", brand: "ChatGPT", logo: "/brands/openai.svg", title: "ChatGPT 套餐升级", text: "已有 ChatGPT 账号，可按页面流程办理 Plus、Pro 等套餐。", destination: "recharge" as const, action: "升级套餐" },
  { id: "claude-account", brand: "Claude", logo: "/brands/claude.svg", title: "Claude 账号", text: "购买 Claude Pro、Max 等账号商品，实际库存以商城为准。", destination: "account" as const, action: "查看账号" },
  { id: "claude-recharge", brand: "Claude", logo: "/brands/claude.svg", title: "Claude 套餐升级", text: "已有 Claude 账号，可选择 Pro、Max 等当前在售套餐。", destination: "recharge" as const, action: "升级套餐" },
];

const regions = [
  { code: "PH", name: "菲区账号", note: "Philippines", text: "根据上架商品选择菲区账号与对应套餐。" },
  { code: "US", name: "美区账号", note: "United States", text: "按实际库存选择美区账号商品与规格。" },
  { code: "JP", name: "日区账号", note: "Japan", text: "查看当前可售的日区账号与套餐信息。" },
];

const accountSteps = ["选择品牌和区域", "选择账号商品", "确认并完成支付", "在订单中查看交付信息"];
const rechargeSteps = ["选择品牌和套餐", "按指引提交办理资料", "确认并完成支付", "查看办理进度", "办理完成"];

const faqs = [
  { id: "choose", question: "我没有账号，应该选择哪种服务？", answer: "请选择“购买账号”。你可以先选择 ChatGPT 或 Claude，再根据商品页面查看当前可售套餐、区域和库存。" },
  { id: "existing", question: "我已经有账号，应该选择哪种服务？", answer: "请选择“升级套餐”。进入套餐升级页面后，选择品牌和目标套餐，并按当前商品的页面指引完成办理。" },
  { id: "brands", question: "目前支持哪些 AI 平台？", answer: "当前 Demo 主要展示 ChatGPT 与 Claude 的账号和套餐服务，具体商品与套餐以实时上架内容为准。" },
  { id: "regions", question: "成品账号有哪些区域可以选择？", answer: "页面展示菲区、美区、日区等区域选择。实际支持区域、套餐和库存以对应商品页面为准。" },
  { id: "orders", question: "购买后在哪里查看订单？", answer: "登录后可在“我的订单”中查看账号交付、套餐办理、支付状态和相关订单信息。" },
  { id: "batch", question: "是否支持多个账号批量办理？", answer: "当前 Demo 提供批量导入、Mock 解析、资格筛选、统一支付和批量任务追踪能力。" },
  { id: "refund", question: "支付后可以退款吗？", answer: "退款与售后范围取决于商品类型和当前处理状态，请以下单时的商品说明及实际售后政策为准。" },
];

export function PublicLandingPage({
  onNavigate,
  onLogin,
  onRegister,
  onSupport,
}: {
  onNavigate: (destination: DashboardDestination) => void;
  onLogin: () => void;
  onRegister: () => void;
  onSupport: () => void;
}) {
  const [openFaq, setOpenFaq] = useState("choose");

  return <div className="public-landing public-landing-v2">
    <section className="landing-hero landing-hero-v2">
      <div className="landing-hero-copy">
        <span className="landing-kicker"><Sparkles />AI 账号与订阅服务平台</span>
        <h1><span>ChatGPT / Claude</span><br />账号与套餐服务</h1>
        <p>没有账号，直接购买即买即用的账号商品；已经有账号，可办理套餐升级。支持菲区、美区、日区等多种区域选择。</p>
        <div className="landing-hero-actions">
          <Button onClick={() => onNavigate("account")}><PackageOpen />我没有账号，购买账号<ArrowRight /></Button>
          <Button variant="outline" onClick={() => onNavigate("recharge")}><Zap />我已有账号，升级套餐</Button>
        </div>
        <div className="landing-hero-meta">
          <span><Check />ChatGPT、Claude 可选</span>
          <span><Check />菲区 / 美区 / 日区可选</span>
          <span><Check />订单进度可查</span>
        </div>
      </div>

      <div className="landing-decision-panel" aria-label="根据账号情况选择服务">
        <header><span>QUICK DECISION</span><strong>先告诉我们：你有账号吗？</strong><small>01 / 02</small></header>
        <button type="button" className="is-primary" onClick={() => onNavigate("account")}>
          <span className="landing-decision-number">01</span>
          <span className="landing-decision-icon"><PackageOpen /></span>
          <span><small>还没有账号</small><strong>购买 ChatGPT / Claude 账号</strong><em>即买即用 · 多区域可选</em></span>
          <ArrowRight />
        </button>
        <button type="button" onClick={() => onNavigate("recharge")}>
          <span className="landing-decision-number">02</span>
          <span className="landing-decision-icon"><UserRound /></span>
          <span><small>已经有账号</small><strong>为现有账号升级套餐</strong><em>Plus · Pro · Max 等套餐</em></span>
          <ArrowRight />
        </button>
        <footer>
          <span><img src="/brands/openai.svg" alt="" />ChatGPT</span>
          <span><img src="/brands/claude.svg" alt="" />Claude</span>
          <span><MapPin />PH · US · JP</span>
        </footer>
      </div>
    </section>

    <section className="landing-section landing-choice" aria-labelledby="landing-choice-title">
      <header className="landing-section-heading landing-heading-split">
        <div><span>CHOOSE BY NEED</span><h2 id="landing-choice-title">根据你的情况选择服务</h2></div>
        <p>无需先理解平台分类。只需确认自己是否已经拥有账号，我们会带你进入对应的办理入口。</p>
      </header>
      <div className="landing-choice-grid">
        <article>
          <div className="landing-choice-top"><span>没有账号</span><small>服务分类 · 成品号</small></div>
          <div className="landing-choice-icon"><PackageOpen /></div>
          <h3>购买 ChatGPT / Claude 账号</h3>
          <p>适合还没有账号的用户。按品牌、套餐和区域选择商品，购买后在订单中查看交付信息。</p>
          <ul><li><Check />ChatGPT、Claude 可选</li><li><Check />菲区、美区、日区可选</li><li><Check />商品库存和交付状态清晰</li></ul>
          <button type="button" onClick={() => onNavigate("account")}>查看账号商品<ArrowRight /></button>
        </article>
        <article>
          <div className="landing-choice-top"><span>已有账号</span><small>服务分类 · 代充</small></div>
          <div className="landing-choice-icon"><Zap /></div>
          <h3>为现有账号升级套餐</h3>
          <p>适合已经拥有账号的用户。选择目标套餐后，按页面指引提交当前商品所需的办理资料。</p>
          <ul><li><Check />Plus、Pro、Max 等套餐</li><li><Check />支持单账号与批量办理</li><li><Check />办理进度集中查看</li></ul>
          <button type="button" onClick={() => onNavigate("recharge")}>查看套餐升级<ArrowRight /></button>
        </article>
      </div>
    </section>

    <section className="landing-brand-services" aria-labelledby="landing-brands-title">
      <div className="landing-section">
        <header className="landing-section-heading landing-heading-split">
          <div><span>CHOOSE BY BRAND</span><h2 id="landing-brands-title">选择你需要的 AI 服务</h2></div>
          <p>品牌在前、服务类型在后，快速找到 ChatGPT 或 Claude 的账号购买与套餐升级入口。</p>
        </header>
        <div className="landing-brand-service-grid">
          {brandServices.map((service) => <article key={service.id}>
            <div className="landing-brand-service-logo"><img src={service.logo} alt="" /></div>
            <span>{service.brand}</span>
            <h3>{service.title}</h3>
            <p>{service.text}</p>
            <button type="button" onClick={() => onNavigate(service.destination)}>{service.action}<ArrowRight /></button>
          </article>)}
        </div>
      </div>
    </section>

    <section className="landing-section landing-regions" aria-labelledby="landing-regions-title">
      <header className="landing-section-heading landing-heading-split">
        <div><span>REGION OPTIONS</span><h2 id="landing-regions-title">多区域账号可选</h2></div>
        <p>根据使用需求选择不同区域的账号商品。实际支持区域、套餐和库存以商品页面为准。</p>
      </header>
      <div className="landing-region-grid">
        {regions.map((region, index) => <article key={region.code}>
          <span className="landing-region-index">0{index + 1}</span>
          <span className="landing-region-code">{region.code}</span>
          <div><small>{region.note}</small><h3>{region.name}</h3><p>{region.text}</p></div>
          <button type="button" onClick={() => onNavigate("account")} aria-label={`查看${region.name}`}><ArrowRight /></button>
        </article>)}
      </div>
      <p className="landing-region-note"><MapPin />区域用于表达当前商品选择范围，不代表固定库存或额外权益。</p>
    </section>

    <section className="landing-benefits-band" aria-labelledby="landing-benefits-title">
      <div className="landing-section">
        <header className="landing-section-heading"><span>WHY SUKAI</span><h2 id="landing-benefits-title">从选择到交付，信息更清楚</h2><p>围绕购买决策、办理过程与订单管理，提供统一的前端服务体验。</p></header>
        <div className="landing-benefit-grid">{benefits.map(({ icon: Icon, title, text }, index) => <article key={title}><small>0{index + 1}</small><span><Icon /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </div>
    </section>

    <section className="landing-section landing-process-v2" aria-labelledby="landing-process-title">
      <header className="landing-section-heading landing-heading-split">
        <div><span>HOW IT WORKS</span><h2 id="landing-process-title">两类服务，两条清晰路径</h2></div>
        <p>首页仅展示简化流程。具体商品要求和办理说明，以进入对应页面后的内容为准。</p>
      </header>
      <div className="landing-process-panels">
        <article>
          <header><span><PackageOpen /></span><div><small>没有账号</small><h3>购买账号</h3></div><em>4 STEPS</em></header>
          <ol>{accountSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></li>)}</ol>
          <button type="button" onClick={() => onNavigate("account")}>购买账号<ArrowRight /></button>
        </article>
        <article>
          <header><span><Zap /></span><div><small>已有账号</small><h3>升级套餐</h3></div><em>5 STEPS</em></header>
          <ol>{rechargeSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></li>)}</ol>
          <button type="button" onClick={() => onNavigate("recharge")}>升级套餐<ArrowRight /></button>
        </article>
      </div>
    </section>

    <section className="landing-capability-band landing-capability-v2">
      <div><span>BATCH WORKSPACE</span><h2>多个账号，也能集中办理</h2><p>支持批量导入、Mock 解析、资格筛选、统一支付与批量任务追踪。官网仅介绍办理能力，不展示任何 Session 或敏感账号信息。</p><Button onClick={() => onNavigate("recharge")}>了解批量办理<ArrowRight /></Button></div>
      <div className="landing-capability-list"><article><FileStack /><span><strong>批量导入</strong><small>粘贴或文件导入</small></span></article><article><Boxes /><span><strong>统一处理</strong><small>筛选后集中结算</small></span></article><article><CircleDollarSign /><span><strong>灵活支付</strong><small>余额抵扣与 USDT</small></span></article><article><RefreshCcw /><span><strong>任务追踪</strong><small>结果与失败项可查</small></span></article></div>
    </section>

    <section className="landing-section landing-faq" id="landing-faq" aria-labelledby="landing-faq-title">
      <header className="landing-section-heading"><span>FAQ</span><h2 id="landing-faq-title">购买前常见问题</h2><p>先确认自己有没有账号，再选择购买账号或升级套餐。</p><button type="button" onClick={() => onNavigate("help")}><BookOpen />查看完整帮助中心</button></header>
      <Accordion type="single" collapsible value={openFaq} onValueChange={setOpenFaq}>{faqs.map((faq) => <AccordionItem value={faq.id} key={faq.id}><AccordionTrigger>{faq.question}</AccordionTrigger><AccordionContent>{faq.answer}</AccordionContent></AccordionItem>)}</Accordion>
    </section>

    <section className="landing-final-cta landing-final-cta-v2">
      <span><Bot /></span>
      <div><small>READY WHEN YOU ARE</small><h2>选择适合你的 AI 账号服务</h2><p>没有账号，直接购买账号；已经有账号，办理套餐升级。</p></div>
      <div><Button onClick={() => onNavigate("account")}>购买 ChatGPT / Claude 账号</Button><Button variant="outline" onClick={() => onNavigate("recharge")}>为现有账号升级套餐</Button></div>
    </section>

    <footer className="landing-footer"><div><span className="logo-mark">S</span><div><strong>Sukai 速开</strong><p>AI 账号与订阅服务平台</p></div></div><nav aria-label="页脚导航"><button type="button" onClick={() => onNavigate("account")}>购买账号</button><button type="button" onClick={() => onNavigate("recharge")}>套餐升级</button><button type="button" onClick={() => onNavigate("help")}><BookOpen />帮助中心</button><a href="#landing-faq">常见问题</a><button type="button" onClick={onSupport}><Headphones />在线客服</button></nav><div className="landing-footer-actions"><button type="button" onClick={onLogin}>登录</button><button type="button" onClick={onRegister}>注册</button></div><p>“官方套餐”指对应平台提供的订阅套餐；SUKAI 并非 OpenAI、Anthropic 或其他 AI 平台的官方合作方。实际服务、区域、库存、价格与售后范围以商品及结账页面为准。</p><small>© 2026 Sukai · 链上支付，订单全程留痕。</small></footer>
  </div>;
}
