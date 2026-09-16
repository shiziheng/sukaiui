"use client";

import { ArrowRight, Bot, Clock3, Gift, Headphones, ReceiptText, Sparkles, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { EditableText } from "@/components/editable-text";
import { OrderTable, formatMoney, type CopyUpdater } from "@/components/user-center-shared";
import { accountDashboardMock, type DashboardDestination } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";

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

  return (
    <section className="user-center-page business-dashboard">
      <header className="home-hero-heading">
        <span>欢迎回来，{data.user.name}</span>
        <h1><EditableText active={editMode} value={content.homeActionTitle} onChange={(value) => updateContent("homeActionTitle", value)} /></h1>
        <p><EditableText active={editMode} value={content.homeActionSubtitle} onChange={(value) => updateContent("homeActionSubtitle", value)} /></p>
      </header>

      <section className="business-entry-grid" aria-label="业务办理">
        <button className="business-entry-card is-account" type="button" onClick={() => onNavigate("account")}>
          <span className="business-entry-icon"><Bot /></span><span className="business-card-art" aria-hidden="true"><i /><i /><i /></span>
          <span className="business-entry-copy"><strong><EditableText active={editMode} value={content.accountServiceTitle} onChange={(value) => updateContent("accountServiceTitle", value)} /></strong><small><EditableText active={editMode} value={content.accountServiceDescription} onChange={(value) => updateContent("accountServiceDescription", value)} /></small></span>
          <span className="business-entry-action"><EditableText active={editMode} value={content.selectAccountService} onChange={(value) => updateContent("selectAccountService", value)} /><ArrowRight /></span>
        </button>
        <button className="business-entry-card is-recharge" type="button" onClick={() => onNavigate("recharge")}>
          <span className="business-entry-icon"><Sparkles /></span><span className="business-card-art" aria-hidden="true"><i /><i /><i /></span>
          <span className="business-entry-copy"><strong><EditableText active={editMode} value={content.rechargeServiceTitle} onChange={(value) => updateContent("rechargeServiceTitle", value)} /></strong><small><EditableText active={editMode} value={content.rechargeServiceDescription} onChange={(value) => updateContent("rechargeServiceDescription", value)} /></small></span>
          <span className="business-entry-action"><EditableText active={editMode} value={content.startRechargeService} onChange={(value) => updateContent("startRechargeService", value)} /><ArrowRight /></span>
        </button>
      </section>

      <section className="home-quick-section uc-card">
        <div className="uc-section-heading home-quick-heading"><div><span className="quick-heading-icon"><WalletCards /></span><div><h2><EditableText active={editMode} value={content.accountQuickInfo} onChange={(value) => updateContent("accountQuickInfo", value)} /></h2><p>账户状态与常用入口</p></div></div><span className="quick-heading-badge">ACCOUNT OVERVIEW</span></div>
        <div className="home-quick-layout"><div className="home-quick-grid">
          <button type="button" onClick={onOpenRecharge}><WalletCards /><span><EditableText active={editMode} value={content.availableBalance} onChange={(value) => updateContent("availableBalance", value)} /></span><strong>{formatMoney(availableBalance)}</strong><small><EditableText active={editMode} value={content.rechargeAction} onChange={(value) => updateContent("rechargeAction", value)} /><ArrowRight /></small></button>
          <button type="button" onClick={() => onNavigate("orders")}><Clock3 /><span><EditableText active={editMode} value={content.pendingOrders} onChange={(value) => updateContent("pendingOrders", value)} /></span><strong>{pending}</strong><small>查看处理进度<ArrowRight /></small></button>
          <button type="button" onClick={() => onNavigate("orders")}><ReceiptText /><span><EditableText active={editMode} value={content.recentOrderCount} onChange={(value) => updateContent("recentOrderCount", value)} /></span><strong>{data.orders.length}</strong><small><EditableText active={editMode} value={content.viewAllOrders} onChange={(value) => updateContent("viewAllOrders", value)} /><ArrowRight /></small></button>
        </div><div className="home-quick-actions"><button className="is-primary" type="button" onClick={onOpenRecharge}><WalletCards /><EditableText active={editMode} value={content.rechargeAction} onChange={(value) => updateContent("rechargeAction", value)} /></button><button type="button" onClick={() => onNavigate("wallet")}>查看钱包<ArrowRight /></button></div></div>
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
