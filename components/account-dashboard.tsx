"use client";

import { ArrowRight, Bot, ClipboardCheck, Clock3, CreditCard, Gift, Headphones, LifeBuoy, MapPinned, ReceiptText, Sparkles, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { EditableText } from "@/components/editable-text";
import { OrderTable, formatMoney, type CopyUpdater } from "@/components/user-center-shared";
import { accountDashboardMock, type DashboardDestination } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";
import { homeDashboardCopy } from "@/data/home-dashboard";

export function AccountDashboard({ onNavigate, onOpenRecharge, availableBalance, content, editMode, updateContent }: {
  onNavigate: (destination: DashboardDestination) => void;
  onOpenRecharge: () => void;
  availableBalance: number;
  content: DemoContent;
  editMode: boolean;
  updateContent: CopyUpdater;
}) {
  const data = accountDashboardMock;
  const pending = data.orders.filter((order) => order.status === "pending" || order.status === "processing").length;
  const trustIcons = { region: MapPinned, order: ClipboardCheck, payment: WalletCards, support: LifeBuoy };

  return (
    <section className="user-center-page business-dashboard">
      <section className="business-entry-grid" aria-label="业务办理">
        <button className="business-entry-card is-account" type="button" onClick={() => onNavigate("account")}>
          <span className="business-entry-icon"><Bot /></span><span className="business-card-art" aria-hidden="true"><i /><i /><i /></span>
          <span className="business-entry-copy"><em>{homeDashboardCopy.accountScenario}</em><strong><EditableText active={editMode} value={content.accountServiceTitle} onChange={(value) => updateContent("accountServiceTitle", value)} /></strong><small><EditableText active={editMode} value={content.accountServiceDescription} onChange={(value) => updateContent("accountServiceDescription", value)} /></small><span className="business-entry-tags">{homeDashboardCopy.accountTags.map((tag) => <i key={tag}>{tag}</i>)}</span></span>
          <span className="business-entry-category">{homeDashboardCopy.accountCategory}</span>
          <span className="business-entry-action"><EditableText active={editMode} value={content.selectAccountService} onChange={(value) => updateContent("selectAccountService", value)} /><ArrowRight /></span>
        </button>
        <button className="business-entry-card is-recharge" type="button" onClick={() => onNavigate("recharge")}>
          <span className="business-entry-icon"><Sparkles /></span><span className="business-card-art" aria-hidden="true"><i /><i /><i /></span>
          <span className="business-entry-copy"><em>{homeDashboardCopy.rechargeScenario}</em><strong><EditableText active={editMode} value={content.rechargeServiceTitle} onChange={(value) => updateContent("rechargeServiceTitle", value)} /></strong><small><EditableText active={editMode} value={content.rechargeServiceDescription} onChange={(value) => updateContent("rechargeServiceDescription", value)} /></small><span className="business-entry-tags">{homeDashboardCopy.rechargeTags.map((tag) => <i key={tag}>{tag}</i>)}</span></span>
          <span className="business-entry-category">{homeDashboardCopy.rechargeCategory}</span>
          <span className="business-entry-action"><EditableText active={editMode} value={content.startRechargeService} onChange={(value) => updateContent("startRechargeService", value)} /><ArrowRight /></span>
        </button>
        <button className="business-entry-card is-card" type="button" onClick={() => onNavigate("card")}>
          <span className="business-entry-icon"><CreditCard /></span><span className="business-card-art" aria-hidden="true"><i /><i /><i /></span>
          <span className="business-entry-copy"><em>虚拟信用卡</em><strong><EditableText active={editMode} value={content.cardServiceTitle} onChange={(value) => updateContent("cardServiceTitle", value)} /></strong><small><EditableText active={editMode} value={content.cardServiceDescription} onChange={(value) => updateContent("cardServiceDescription", value)} /></small><span className="business-entry-tags">{["Visa", "MasterCard", "香港卡"].map((tag) => <i key={tag}>{tag}</i>)}</span></span>
          <span className="business-entry-category">虚拟卡</span>
          <span className="business-entry-action"><EditableText active={editMode} value={content.cardGoOpen} onChange={(value) => updateContent("cardGoOpen", value)} /><ArrowRight /></span>
        </button>
      </section>

      <section className="home-trust-strip" aria-label="服务保障">
        {homeDashboardCopy.trustItems.map((item) => { const Icon = trustIcons[item.icon]; return <article key={item.id}><span><Icon /></span><div><strong>{item.title}</strong><p>{item.description}</p></div></article>; })}
      </section>

      <section className="home-state-grid has-single">
        <article className="home-account-overview uc-card">
          <header><span>{homeDashboardCopy.overviewEyebrow}</span><h2>{homeDashboardCopy.overviewTitle}</h2><p>{homeDashboardCopy.overviewDescription}</p></header>
          <dl><button type="button" onClick={onOpenRecharge}><dt><WalletCards />{content.availableBalance}</dt><dd>{formatMoney(availableBalance)}</dd></button><button type="button" onClick={() => onNavigate("orders")}><dt><Clock3 />{content.pendingOrders}</dt><dd>{pending}</dd></button><button type="button" onClick={() => onNavigate("orders")}><dt><ReceiptText />{content.recentOrderCount}</dt><dd>{data.orders.length}</dd></button></dl>
          <footer><button className="is-primary" type="button" onClick={onOpenRecharge}>{content.rechargeAction}</button><button type="button" onClick={() => onNavigate("wallet")}>查看钱包<ArrowRight /></button></footer>
        </article>
      </section>

      <section className="home-lower-grid">
        <div className="uc-card uc-orders-preview home-orders-preview">
          <div className="uc-section-heading"><div><span className="section-title-icon"><ReceiptText /></span><div><h2><EditableText active={editMode} value={content.recentOrders} onChange={(value) => updateContent("recentOrders", value)} /></h2><p>最近 5 条成品号与代充办理记录</p></div></div><button className="uc-secondary-action" type="button" onClick={() => onNavigate("orders")}><EditableText active={editMode} value={content.viewAllOrders} onChange={(value) => updateContent("viewAllOrders", value)} /><ArrowRight /></button></div>
          <OrderTable orders={data.orders.slice(0, 5)} mode="all" content={content} editMode={editMode} updateContent={updateContent} compact />
        </div>
        <aside className="home-assist-column">
          <button className="home-assist-card uc-card" type="button" onClick={() => onNavigate("invite")}><span className="assist-icon"><Gift /></span><strong><EditableText active={editMode} value={content.inviteLightTitle} onChange={(value) => updateContent("inviteLightTitle", value)} /></strong><p>邀请好友一起使用，获取现金奖励</p><dl><div><dt>已邀请</dt><dd>{data.summary.invitedUsers} 人</dd></div><div><dt>累计奖励</dt><dd>{formatMoney(data.summary.totalRewards)}</dd></div></dl><span className="assist-action"><EditableText active={editMode} value={content.viewInviteActivity} onChange={(value) => updateContent("viewInviteActivity", value)} /><ArrowRight /></span></button>
          <button className="home-assist-card uc-card" type="button" onClick={() => toast.info("在线客服为 Demo 入口")}><span className="assist-icon"><Headphones /></span><strong><EditableText active={editMode} value={content.supportNav} onChange={(value) => updateContent("supportNav", value)} /></strong><p>遇到问题？我们的团队随时为您服务</p><span className="assist-action">联系客服<ArrowRight /></span></button>
        </aside>
      </section>
    </section>
  );
}
