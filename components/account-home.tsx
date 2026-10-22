"use client";

import {
  ArrowRight, Clock3, CreditCard, Gift, PackageOpen, Plus, ReceiptText, Sparkles, WalletCards, Zap,
} from "lucide-react";

import "./account-home.css";

import { EditableText } from "@/components/editable-text";
import { StatusTag, formatMoney, type CopyUpdater } from "@/components/user-center-shared";
import { accountDashboardMock, type DashboardDestination } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";

const quickActions: Array<{
  id: string;
  icon: typeof Zap;
  title: string;
  note: string;
  destination: DashboardDestination;
}> = [
  { id: "recharge", icon: Zap, title: "套餐代充", note: "已有账号 · 升级套餐", destination: "recharge" },
  { id: "account", icon: PackageOpen, title: "成品号", note: "即买即用 · 直接交付", destination: "account" },
  { id: "card", icon: CreditCard, title: "卡片", note: "开卡 · 充值 · 流水", destination: "card" },
  { id: "wallet", icon: WalletCards, title: "钱包", note: "余额 · 充值 · 记录", destination: "wallet" },
];

export function AccountHome({
  onNavigate,
  onOpenRecharge,
  availableBalance,
  content,
  editMode,
  updateContent,
}: {
  onNavigate: (destination: DashboardDestination) => void;
  onOpenRecharge: () => void;
  availableBalance: number;
  content: DemoContent;
  editMode: boolean;
  updateContent: CopyUpdater;
}) {
  const data = accountDashboardMock;
  const pendingOrders = data.orders.filter((order) => order.status === "pending" || order.status === "processing");
  const recentOrders = data.orders.slice(0, 4);

  return (
    <section className="user-center-page account-home">
      <header className="acc-home-hero">
        <div className="acc-home-hero-copy">
          <span className="acc-home-eyebrow"><Sparkles aria-hidden="true" />会员中心</span>
          <h1>
            <EditableText active={editMode} value={content.homeActionTitle} onChange={(value) => updateContent("homeActionTitle", value)} />
            <span>，{data.user.name}</span>
          </h1>
          <p>
            <EditableText active={editMode} value={content.homeActionSubtitle} onChange={(value) => updateContent("homeActionSubtitle", value)} />
          </p>
        </div>
        <div className="acc-home-hero-actions">
          <button className="acc-home-primary" type="button" onClick={onOpenRecharge}>
            <Plus aria-hidden="true" />{content.walletRecharge}
          </button>
          <button className="acc-home-secondary" type="button" onClick={() => onNavigate("orders")}>
            <ReceiptText aria-hidden="true" />查看订单
          </button>
        </div>
        <div className="acc-home-glow" aria-hidden="true" />
      </header>

      <section className="acc-home-stats" aria-label="账户概览">
        <button className="acc-home-stat is-primary" type="button" onClick={() => onNavigate("wallet")}>
          <span><WalletCards aria-hidden="true" />可用余额</span>
          <strong>{formatMoney(availableBalance)}</strong>
          <small>可用于下单与代充</small>
          <ArrowRight aria-hidden="true" />
        </button>
        <button className="acc-home-stat" type="button" onClick={() => onNavigate("orders")}>
          <span><Clock3 aria-hidden="true" />进行中订单</span>
          <strong>{pendingOrders.length}<em>笔</em></strong>
          <small>{pendingOrders.length ? "正在为你处理，点此跟进" : "目前没有进行中的订单"}</small>
          <ArrowRight aria-hidden="true" />
        </button>
        <button className="acc-home-stat" type="button" onClick={() => onNavigate("invite")}>
          <span><Gift aria-hidden="true" />累计奖励</span>
          <strong>{formatMoney(data.summary.totalRewards)}</strong>
          <small>已邀请 {data.summary.invitedUsers} 位好友</small>
          <ArrowRight aria-hidden="true" />
        </button>
      </section>

      <div className="acc-home-layout">
        <div className="acc-home-main">
          <section className="uc-card acc-home-panel">
            <header className="acc-home-panel-head">
              <div>
                <h2>进行中的订单</h2>
                <p>备货、处理中的订单会先放在这里。</p>
              </div>
              <button className="acc-home-link" type="button" onClick={() => onNavigate("orders")}>
                全部订单<ArrowRight aria-hidden="true" />
              </button>
            </header>
            {pendingOrders.length ? (
              <div className="acc-home-order-list">
                {pendingOrders.map((order) => (
                  <button className="acc-home-order" type="button" onClick={() => onNavigate("orders")} key={order.id}>
                    <span className={`acc-home-order-icon is-${order.kind}`} aria-hidden="true">
                      {order.kind === "account" ? <PackageOpen /> : <Zap />}
                    </span>
                    <span className="acc-home-order-main">
                      <strong>{order.product}</strong>
                      <small>{order.id} · {order.createdAt}</small>
                    </span>
                    <StatusTag order={order} />
                    <strong className="acc-home-order-amount">{formatMoney(order.amount)}</strong>
                    <ArrowRight className="acc-home-order-arrow" aria-hidden="true" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="acc-home-empty">
                <Clock3 aria-hidden="true" />
                <strong>暂无进行中的订单</strong>
                <p>下单后可以在这里跟进备货与处理进度。</p>
              </div>
            )}
          </section>

          <section className="uc-card acc-home-panel">
            <header className="acc-home-panel-head">
              <div>
                <h2>最近订单</h2>
                <p>最近的购买与代充记录。</p>
              </div>
              <button className="acc-home-link" type="button" onClick={() => onNavigate("orders")}>
                查看全部<ArrowRight aria-hidden="true" />
              </button>
            </header>
            <div className="acc-home-recent-list">
              {recentOrders.map((order) => (
                <button className="acc-home-recent" type="button" onClick={() => onNavigate("orders")} key={order.id}>
                  <span className={`acc-home-order-icon is-${order.kind}`} aria-hidden="true">
                    {order.kind === "account" ? <PackageOpen /> : <Zap />}
                  </span>
                  <span className="acc-home-recent-main">
                    <strong>{order.product}</strong>
                    <small>{order.snapshot}</small>
                  </span>
                  <span className="acc-home-recent-time">{order.createdAt}</span>
                  <StatusTag order={order} />
                  <strong className="acc-home-recent-amount">{formatMoney(order.amount)}</strong>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="acc-home-side">
          <section className="uc-card acc-home-quick">
            <header className="acc-home-panel-head">
              <div>
                <h2>快捷服务</h2>
                <p>常用的四个入口。</p>
              </div>
            </header>
            <div className="acc-home-quick-list">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button type="button" onClick={() => onNavigate(action.destination)} key={action.id}>
                    <span className="acc-home-quick-icon"><Icon aria-hidden="true" /></span>
                    <span>
                      <strong>{action.title}</strong>
                      <small>{action.note}</small>
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </section>

          <button className="acc-home-invite" type="button" onClick={() => onNavigate("invite")}>
            <span className="acc-home-invite-icon" aria-hidden="true"><Gift /></span>
            <span className="acc-home-invite-copy">
              <strong>邀请好友，一起用 SUKAI</strong>
              <small>邀请码 {data.invite.code} · 好友消费返佣 1%</small>
            </span>
            <ArrowRight aria-hidden="true" />
          </button>
        </aside>
      </div>
    </section>
  );
}
