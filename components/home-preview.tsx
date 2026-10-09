"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown, CircleDot, Headphones, Menu, MoveUpRight, Sparkles, X, Zap } from "lucide-react";
import styles from "./home-preview.module.css";

function Logo() {
  return <span className={styles.logo}><b>S</b><strong>Sukai</strong><small>速开</small></span>;
}

function MockButton({ children, primary = false }: { children: ReactNode; primary?: boolean }) {
  return <button type="button" className={`${styles.button} ${primary ? styles.primary : styles.secondary}`} onClick={(event) => event.preventDefault()}>{children}</button>;
}

export function HomePreview() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <main className={styles.page}>
    <nav className={styles.navbar} aria-label="Sukai 预览导航"><div className={styles.navInner}>
      <button type="button" className={styles.logoButton} onClick={() => setMenuOpen(false)} aria-label="Sukai 预览首页"><Logo /></button>
      <div className={`${styles.navLinks} ${menuOpen ? styles.open : ""}`}><button type="button">首页</button><button type="button">购买账号</button><button type="button">套餐升级</button><button type="button">帮助中心</button><button type="button">常见问题</button></div>
      <div className={styles.navActions}><button type="button" className={styles.support}><Headphones />在线客服</button><button type="button" className={styles.login}>登录</button><button type="button" className={styles.register}>注册</button></div>
      <button type="button" className={styles.menu} onClick={() => setMenuOpen((open) => !open)} aria-label="打开导航菜单">{menuOpen ? <X /> : <Menu />}</button>
    </div></nav>

    <section className={styles.hero}>
      <div className={styles.noise} aria-hidden="true" /><div className={styles.grid} aria-hidden="true" /><div className={styles.glowGreen} aria-hidden="true" /><div className={styles.glowBlue} aria-hidden="true" /><div className={`${styles.ring} ${styles.ringOne}`} aria-hidden="true" /><div className={`${styles.ring} ${styles.ringTwo}`} aria-hidden="true" />
      <div className={styles.particles} aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <div className={styles.heroInner}>
        <div className={styles.copy}><span className={`${styles.eyebrow} ${styles.revealOne}`}><Sparkles />AI ACCOUNT &amp; SUBSCRIPTION PLATFORM</span><h1 className={styles.revealTwo}>ChatGPT / Claude<br /><span>一站完成<em>.</em></span></h1><p className={styles.revealThree}>账号获取与套餐升级，<br className={styles.mobileOnly} />从选择到进度都更清晰。</p><div className={`${styles.actions} ${styles.revealFour}`}><MockButton primary>获取新账号<ArrowRight /></MockButton><MockButton>升级现有账号</MockButton></div><div className={`${styles.proof} ${styles.revealFive}`}><span><CircleDot />ChatGPT / Claude</span><span><Check />多地区可选</span><span><Check />订单进度可查</span></div></div>

        <div className={`${styles.visual} ${styles.revealVisual}`}><div className={styles.visualHalo} aria-hidden="true" /><div className={`${styles.orbit} ${styles.orbitA}`} aria-hidden="true" /><div className={`${styles.orbit} ${styles.orbitB}`} aria-hidden="true" />
          <div className={`${styles.floatCard} ${styles.regionCard}`}><span className={styles.cardIcon}><Zap /></span><span><small>AVAILABLE REGION</small><strong>US · JP · PH</strong></span></div>
          <div className={`${styles.floatCard} ${styles.statusCard}`}><span className={styles.statusDot} /><span><small>ORDER STATUS</small><strong>Ready to use</strong></span></div>
          <div className={`${styles.floatCard} ${styles.upgradeCard}`}><span className={styles.upgradeMark}>↗</span><span><small>UPGRADE</small><strong>Claude Pro</strong></span></div>
          <article className={styles.serviceCard}><header><span className={styles.windowDots}><i /><i /><i /></span><span>SUKAI / SERVICE HUB</span><b>ONLINE</b></header><div className={styles.serviceBody}><div className={styles.serviceIntro}><small>YOUR AI SERVICE</small><h2>Everything<br />in one place.</h2><p>账号、订阅与订单状态</p></div><div className={`${styles.serviceRow} ${styles.selected}`}><span className={`${styles.brandMark} ${styles.openai}`}>✳</span><span><small>CHATGPT</small><strong>Plus · US</strong><em><Check />Available</em></span><MoveUpRight /></div><div className={styles.serviceRow}><span className={`${styles.brandMark} ${styles.claude}`}>✦</span><span><small>CLAUDE</small><strong>Pro · Upgrade</strong><em><Check />Upgrade available</em></span><MoveUpRight /></div><div className={styles.serviceFooter}><span><small>ORDER STATUS</small><strong>Processing</strong></span><span className={styles.progressLine}><i /></span></div></div><footer><span><Check />清晰选择</span><span><Check />简单下单</span><span><Check />随时查看</span></footer></article>
        </div>
      </div><div className={styles.scrollHint}><span>SCROLL TO EXPLORE</span><ChevronDown /></div>
    </section>

    <section className={styles.continuation}><div className={styles.continuationInner}><div><span className={styles.sectionTag}>SUKAI SERVICE FLOW</span><h2>从账号到订阅<br /><span>每一步都更清楚</span></h2></div><p>选择 AI 服务，完成购买或升级，再回到订单中心查看状态。预览版只展示服务节奏，不连接真实业务。</p><div className={styles.continuationCards}><article><b>01</b><span>获取新账号</span><small>ChatGPT / Claude</small></article><article><b>02</b><span>升级现有账号</span><small>Plus / Pro / Max</small></article><article><b>03</b><span>查看订单状态</span><small>Ready / Processing</small></article></div></div></section>
  </main>;
}
