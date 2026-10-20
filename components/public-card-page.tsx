"use client";

import "./card.css";
import { ArrowRight, Check, CreditCard, Layers3, ShieldCheck, Sparkles, WalletCards } from "lucide-react";

import { CardMarket } from "@/components/card-market";
import { Button } from "@/components/ui/button";
import { money, type CardBin } from "@/data/card-business";
import { type DemoContent } from "@/data/content";

/** 未登录的虚拟卡页：可浏览卡段与费率，开卡动作走站内一键登录。 */
export function PublicCardPage({ bins, content, onRequireLogin, onRegister }: {
  bins: CardBin[];
  content: DemoContent;
  onRequireLogin: (bin?: CardBin) => void;
  onRegister: () => void;
}) {
  const minFee = bins.length ? Math.min(...bins.map((bin) => bin.openFee)) : 0;

  return (
    <div className="public-card-page">
      <header className="public-card-hero">
        <div className="public-card-hero-main">
          <span className="public-card-eyebrow"><Sparkles aria-hidden="true" />VIRTUAL CARD · MULTI-BIN</span>
          <h1>虚拟卡开卡中心</h1>
          <p>{content.cardPageSubtitle}</p>
          <ul className="public-card-points">
            <li><Check aria-hidden="true" />Visa / Mastercard 多卡段，美国与中国香港发行</li>
            <li><Check aria-hidden="true" />开卡费、充值费率、消费手续费在卡段上直接列出</li>
            <li><Check aria-hidden="true" />卡内余额独立存放，充值、消费、退款都有流水</li>
          </ul>
          <div className="public-card-actions">
            <Button className="public-card-primary" onClick={() => onRequireLogin()}>登录后开卡<ArrowRight aria-hidden="true" /></Button>
            <button type="button" className="public-card-register" onClick={onRegister}>还没有账号？先注册</button>
          </div>
        </div>
        <aside className="public-card-aside">
          <div className="public-card-stat-grid">
            <div><span>可用卡段</span><strong>{bins.length}<small>个</small></strong></div>
            <div><span>开卡费起</span><strong>{money(minFee)}<small>/ 张</small></strong></div>
            <div><span>发行地区</span><strong>US<small>/ HK</small></strong></div>
            <div><span>开卡时长</span><strong>即时<small>可用</small></strong></div>
          </div>
          <p className="public-card-aside-note"><ShieldCheck aria-hidden="true" />平台余额用于开卡与卡充值；卡内余额单独计，退款回到卡里。</p>
          <div className="public-card-aside-tags"><span><CreditCard aria-hidden="true" />多卡段</span><span><WalletCards aria-hidden="true" />余额分离</span><span><Layers3 aria-hidden="true" />费率透明</span></div>
        </aside>
      </header>

      <CardMarket
        bins={bins}
        ownedCounts={{}}
        onOpen={(bin) => onRequireLogin(bin)}
        content={content}
        editMode={false}
        updateContent={() => {}}
      />

      <section className="public-card-notes">
        <article><span>01</span><h3>选卡段，不选套餐</h3><p>按支付场景和发行地挑卡段，卡段卡片上写明可用场景和限制，不用猜能不能过。</p></article>
        <article><span>02</span><h3>充值是充值，开卡是开卡</h3><p>开卡费从平台余额扣一次；之后给卡充多少由你决定，卡内余额不会和平台余额混在一起。</p></article>
        <article><span>03</span><h3>登录后卡包统一管理</h3><p>卡号、CVV、有效期、余额和消费记录都在卡包里；需要停用、退款或销卡也在这里操作。</p></article>
      </section>
    </div>
  );
}
