"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight, Check, CircleDot, Clock3, Globe2, Headphones, MapPin, Menu, PackageOpen, Sparkles, X, Zap } from "lucide-react";
import styles from "./landing-preview.module.css";

function Brand({ name, logo }: { name: string; logo: string }) {
  return <span className={styles.brand}><img src={logo} alt="" aria-hidden="true" />{name}</span>;
}

function PreviewButton({ children, primary = false }: { children: ReactNode; primary?: boolean }) {
  return <button type="button" className={`${styles.button} ${primary ? styles.buttonPrimary : styles.buttonGhost}`} onClick={(event) => event.preventDefault()}>{children}</button>;
}

export function LandingPreview() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <main className={styles.page}>
    <nav className={styles.navbar} aria-label="Preview navigation"><div className={styles.navInner}>
      <button type="button" className={styles.logo} onClick={() => setMenuOpen(false)} aria-label="Sukai 速开预览首页"><span>S</span><strong>Sukai</strong><small>速开</small></button>
      <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ""}`}><button type="button">产品服务</button><button type="button">服务优势</button><button type="button">使用流程</button><button type="button">常见问题</button></div>
      <div className={styles.navActions}><button type="button" className={styles.support}><Headphones />在线客服</button><button type="button" className={styles.login}>登录</button><button type="button" className={styles.register}>注册</button></div>
      <button type="button" className={styles.menuButton} onClick={() => setMenuOpen((value) => !value)} aria-label="打开预览菜单">{menuOpen ? <X /> : <Menu />}</button>
    </div></nav>
    <section className={styles.hero}><div className={styles.grid} aria-hidden="true" /><div className={styles.orbOne} aria-hidden="true" /><div className={styles.orbTwo} aria-hidden="true" /><div className={styles.arc} aria-hidden="true" /><div className={styles.particles} aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className={styles.heroInner}><div className={styles.heroCopy}><span className={`${styles.eyebrow} ${styles.inOne}`}><Sparkles />AI ACCOUNT &amp; SUBSCRIPTION</span><h1 className={styles.inTwo}>ChatGPT / Claude<br /><span>账号与订阅<br className={styles.mobileBreak} /><em>一站完成</em></span></h1><p className={styles.inThree}>购买可直接使用的 AI 账号，或为现有账号升级 Plus、Pro 等套餐。<br className={styles.desktopBreak} />从选择服务、完成下单，到查看订单进度，都可以更简单。</p><div className={`${styles.actions} ${styles.inFour}`}><PreviewButton primary>立即获取账号<ArrowRight /></PreviewButton><PreviewButton>升级现有账号</PreviewButton></div><div className={`${styles.trustLine} ${styles.inFive}`}><span><CircleDot />ChatGPT / Claude</span><span><MapPin />多地区商品</span><span><Clock3 />订单进度可查</span></div></div>
        <div className={`${styles.stage} ${styles.inMockup}`}><div className={`${styles.orbit} ${styles.orbitOne}`} /><div className={`${styles.orbit} ${styles.orbitTwo}`} /><span className={`${styles.orbitDot} ${styles.dotOne}`} /><span className={`${styles.orbitDot} ${styles.dotTwo}`} /><div className={`${styles.floatCard} ${styles.floatRegion}`}><Globe2 /><span><small>AVAILABLE REGION</small><strong>US / JP / PH</strong></span></div><div className={`${styles.floatCard} ${styles.floatStatus}`}><span className={styles.liveDot} /><span><small>ORDER STATUS</small><strong>Processing</strong></span></div><div className={`${styles.floatCard} ${styles.floatClaude}`}><Brand name="Claude" logo="/brands/claude.svg" /><span><small>CLAUDE</small><strong>Pro · Upgrade</strong></span></div>
          <div className={styles.console}><header className={styles.consoleHeader}><span className={styles.dots}><i /><i /><i /></span><span>SUKAI / AI SERVICE</span><b>ONLINE</b></header><div className={styles.consoleBody}><div className={styles.consoleTitle}><small>账号与套餐服务</small><strong>Everything in one place.</strong></div><div className={`${styles.plan} ${styles.planActive}`}><Brand name="ChatGPT" logo="/brands/openai.svg" /><div><small>ChatGPT</small><strong>Plus · US</strong><em><Check />可购买</em></div><ArrowRight /></div><div className={styles.plan}><Brand name="Claude" logo="/brands/claude.svg" /><div><small>Claude</small><strong>Pro · Upgrade</strong><em><Zap />可升级</em></div><ArrowRight /></div><div className={styles.progress}><div><small>订单进度</small><strong>Processing</strong></div><span>Step 2 / 3</span><i><em /></i></div></div><footer><span><Check />账号购买</span><span><Check />套餐升级</span><span><Check />状态可查</span></footer></div></div>
      </div><div className={styles.scrollCue}>SCROLL TO EXPLORE<i /></div>
    </section>
    <section className={styles.trustBar}><div className={styles.trustInner}><span className={styles.trustLabel}>BUILT FOR YOUR NEXT MOVE</span><span><Brand name="ChatGPT" logo="/brands/openai.svg" /></span><span><Brand name="Claude" logo="/brands/claude.svg" /></span><span><MapPin />PH · US · JP</span><span><Clock3 />订单进度可查</span></div></section>
    <section className={styles.feature}><div className={styles.featureGrid} aria-hidden="true" /><div className={styles.featureInner}><div className={styles.featureCopy}><span className={styles.featureEyebrow}>ONE PLATFORM</span><h2>从账号到订阅<br /><span>都可以更简单</span></h2><p>购买 ChatGPT / Claude 账号，或者升级已有账号。Sukai 把服务入口、产品选择和订单状态放在一个清晰的体验里。</p><div className={styles.featureChecks}><span><Check />账号购买</span><span><Check />套餐升级</span><span><Check />进度可查</span></div><PreviewButton primary>探索服务<ArrowRight /></PreviewButton></div><div className={styles.featureVisual}><div className={styles.featureGlow} /><div className={styles.featurePanel}><header><span>SERVICE OVERVIEW</span><b>03 ITEMS</b></header><div className={styles.featureRow}><span className={styles.featureIcon}><PackageOpen /></span><span><small>ACCOUNT</small><strong>ChatGPT / Claude</strong></span><em>Ready</em></div><div className={styles.featureRow}><span className={`${styles.featureIcon} ${styles.featureIconGreen}`}><Zap /></span><span><small>SUBSCRIPTION</small><strong>Plus / Pro / Max</strong></span><em>Upgrade</em></div><div className={styles.featureLine}><span><i /><i /><i /></span><small>一个平台，清晰完成每一步</small></div></div></div></div></section>
  </main>;
}

