"use client";

import {
  ArrowRight, Bot, Boxes, Check, CircleDollarSign, ClipboardCheck,
  CreditCard, FileStack, Headphones, PackageOpen, RefreshCcw, Sparkles, Zap,
} from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { DashboardDestination } from "@/data/account-dashboard";

const benefits = [
  { icon: PackageOpen, title: "即买即用", text: "成品号完成交付后即可按商品说明开始使用，减少重复配置。" },
  { icon: Zap, title: "多品牌订阅办理", text: "围绕 ChatGPT、Claude 等实际在售品牌提供账号与套餐服务。" },
  { icon: CreditCard, title: "灵活支付", text: "支持钱包余额及 USDT，订单不足部分可通过 TRC20 / ERC20 补差额。" },
  { icon: ClipboardCheck, title: "全程可追踪", text: "订单、充值与处理状态集中管理，重要进度清晰可查。" },
];

const faqs = [
  { id: "account", question: "如何购买 AI 成品号？", answer: "进入成品号页面，选择品牌和套餐，确认商品信息后完成支付。交付内容与售后范围以对应商品说明为准。" },
  { id: "recharge", question: "AI 代充如何办理？", answer: "进入代充页面选择目标套餐，再按页面步骤提交当前商品所需的信息。不同品牌与套餐的办理步骤可能不同。" },
  { id: "batch", question: "是否支持多个账号批量办理？", answer: "当前 Demo 已提供批量导入、解析、资格筛选、统一支付和批量任务追踪能力。" },
  { id: "payment", question: "支持哪些支付方式？", answer: "当前系统展示钱包余额及 USDT 支付能力，并支持 TRC20 / ERC20 网络。实际可用方式以结账页面为准。" },
  { id: "support", question: "订单遇到问题怎么办？", answer: "请保留订单编号和页面提示，通过在线客服联系售后处理。请勿在非订单渠道随意发送敏感账号信息。" },
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
  return <div className="public-landing">
    <section className="landing-hero">
      <div className="landing-hero-copy">
        <span className="landing-kicker"><Sparkles />SUKAI · AI 账号与订阅服务平台</span>
        <h1>AI 账号与订阅，<br /><em>一站式办理</em></h1>
        <p>购买已配置完成的 AI 成品号，为已有账号升级或续费套餐，并支持多个账号集中办理。</p>
        <div className="landing-hero-actions">
          <Button onClick={() => onNavigate("account")}>查看成品号<ArrowRight /></Button>
          <Button variant="outline" onClick={() => onNavigate("recharge")}>开始代充</Button>
        </div>
        <ul className="landing-trust-points"><li><Check />成品号交付</li><li><Check />批量办理</li><li><Check />链上支付</li><li><Check />订单追踪</li></ul>
      </div>
      <div className="landing-hero-console" aria-label="SUKAI 平台能力概览">
        <header><span><i /><i /><i /></span><strong>SUKAI SERVICE DESK</strong><small>ONLINE</small></header>
        <div className="landing-console-focus"><span>选择你的办理方式</span><strong>更快开始使用 AI 服务</strong></div>
        <div className="landing-console-grid">
          <button type="button" onClick={() => onNavigate("account")}><PackageOpen /><span><strong>AI 成品号</strong><small>购买已配置完成的账号</small></span><ArrowRight /></button>
          <button type="button" onClick={() => onNavigate("recharge")}><Zap /><span><strong>AI 代充</strong><small>升级或续费已有账号</small></span><ArrowRight /></button>
        </div>
        <footer><span>统一支付</span><span>批量任务</span><span>订单留痕</span></footer>
      </div>
    </section>

    <section className="landing-section landing-business" aria-labelledby="landing-business-title">
      <header className="landing-section-heading"><span>CORE SERVICES</span><h2 id="landing-business-title">两种核心业务，直接开始办理</h2><p>根据你是否已有账号，选择更适合的服务。</p></header>
      <div className="landing-business-grid">
        <article><span className="landing-card-index">01</span><PackageOpen /><div><h3>AI 成品号</h3><p>购买已经配置完成的 AI 账号，按商品说明完成交付后即可使用。</p><ul><li>多品牌与套餐选择</li><li>商品信息与库存清晰</li><li>订单交付状态可追踪</li></ul></div><button type="button" onClick={() => onNavigate("account")}>查看成品号<ArrowRight /></button></article>
        <article><span className="landing-card-index">02</span><Zap /><div><h3>AI 代充</h3><p>为已有 AI 账号升级或续费套餐，支持单账号与批量办理。</p><ul><li>目标套餐清晰固定</li><li>批量解析与统一结算</li><li>处理进度集中查看</li></ul></div><button type="button" onClick={() => onNavigate("recharge")}>开始代充<ArrowRight /></button></article>
      </div>
    </section>

    <section className="landing-brand-strip" aria-label="支持的 AI 品牌">
      <div><span>SUPPORTED AI SERVICES</span><strong>当前支持</strong></div>
      <article><img src="/brands/openai.svg" alt="" /><span><strong>ChatGPT</strong><small>Go · Plus · Pro</small></span></article>
      <article><img src="/brands/claude.svg" alt="" /><span><strong>Claude</strong><small>Pro · Max</small></span></article>
      <p>具体商品与套餐以实时上架内容为准。</p>
    </section>

    <section className="landing-section" aria-labelledby="landing-benefits-title">
      <header className="landing-section-heading"><span>WHY SUKAI</span><h2 id="landing-benefits-title">为什么选择 SUKAI</h2><p>复用旧站真实业务重点，并按新系统能力重新整理。</p></header>
      <div className="landing-benefit-grid">{benefits.map(({ icon: Icon, title, text }) => <article key={title}><span><Icon /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="landing-section landing-process" aria-labelledby="landing-process-title">
      <header className="landing-section-heading"><span>HOW IT WORKS</span><h2 id="landing-process-title">四步完成办理</h2><p>从选择服务到查看结果，流程保持清晰可控。</p></header>
      <ol><li><span>01</span><div><strong>选择服务</strong><p>选择成品号或 AI 代充，并确认品牌与套餐。</p></div></li><li><span>02</span><div><strong>提交信息</strong><p>按当前商品提示确认数量或办理账号。</p></div></li><li><span>03</span><div><strong>完成支付</strong><p>使用钱包余额，或通过 USDT 支付差额。</p></div></li><li><span>04</span><div><strong>追踪订单</strong><p>在我的订单中查看交付、处理与完成状态。</p></div></li></ol>
    </section>

    <section className="landing-capability-band">
      <div><span>BATCH WORKSPACE</span><h2>多个 AI 账号，也能集中处理</h2><p>支持批量导入、Mock 解析、资格筛选、统一支付与批量任务追踪。官网仅介绍能力，不展示任何 Session 或敏感账号信息。</p><Button onClick={() => onNavigate("recharge")}>了解批量办理<ArrowRight /></Button></div>
      <div className="landing-capability-list"><article><FileStack /><span><strong>批量导入</strong><small>粘贴或文件导入</small></span></article><article><Boxes /><span><strong>统一处理</strong><small>筛选后集中结算</small></span></article><article><CircleDollarSign /><span><strong>灵活支付</strong><small>余额抵扣与 USDT</small></span></article><article><RefreshCcw /><span><strong>任务追踪</strong><small>结果与失败项可查</small></span></article></div>
    </section>

    <section className="landing-section landing-faq" id="landing-faq" aria-labelledby="landing-faq-title">
      <header className="landing-section-heading"><span>FAQ</span><h2 id="landing-faq-title">常见问题</h2><p>关于购买、代充、批量办理与支付。</p></header>
      <Accordion type="single" collapsible defaultValue="account">{faqs.map((faq) => <AccordionItem value={faq.id} key={faq.id}><AccordionTrigger>{faq.question}</AccordionTrigger><AccordionContent>{faq.answer}</AccordionContent></AccordionItem>)}</Accordion>
    </section>

    <section className="landing-final-cta"><span><Bot /></span><div><small>SUKAI AI SERVICE PLATFORM</small><h2>准备开始办理你的 AI 服务？</h2><p>选择成品号直接购买，或为已有账号办理套餐升级与续费。</p></div><div><Button onClick={() => onNavigate("account")}>查看成品号</Button><Button variant="outline" onClick={() => onNavigate("recharge")}>开始代充</Button></div></section>

    <footer className="landing-footer"><div><span className="logo-mark">S</span><div><strong>Sukai 速开</strong><p>AI 账号与订阅服务平台</p></div></div><nav aria-label="页脚导航"><button type="button" onClick={() => onNavigate("account")}>成品号</button><button type="button" onClick={() => onNavigate("recharge")}>AI 代充</button><a href="#landing-faq">FAQ</a><button type="button" onClick={onSupport}><Headphones />在线客服</button></nav><div className="landing-footer-actions"><button type="button" onClick={onLogin}>登录</button><button type="button" onClick={onRegister}>注册</button></div><p>“官方套餐”指对应平台提供的订阅套餐；SUKAI 并非 OpenAI、Anthropic 或其他 AI 平台的官方合作方。实际服务与价格以结账页面为准。</p><small>© 2026 Sukai · 链上支付，订单全程留痕。</small></footer>
  </div>;
}
