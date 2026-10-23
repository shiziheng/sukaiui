"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, LayoutDashboard, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { SpendTrendChart } from "@/components/dashboard-charts";
import { type CopyUpdater } from "@/components/user-center-shared";
import { accountDashboardMock, type DashboardDestination } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";
import { homeOpsMock, personalSpendTrend, type DashboardRange } from "@/data/home-dashboard";
import "./home-overview.css";

const money = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ranges: Array<{ id: DashboardRange; label: string }> = [
  { id: "today", label: "今日" },
  { id: "week", label: "近 7 天" },
  { id: "month", label: "近 30 天" },
];

/**
 * 登录后首页：只回答三个问题——今天怎么样、整体还剩多少、下一步做什么。
 * 四块内容用一条细线分隔，不套卡片。
 */
export function AccountDashboard({ onNavigate, onOpenRecharge, availableBalance }: {
  onNavigate: (destination: DashboardDestination) => void;
  onOpenRecharge: () => void;
  availableBalance: number;
  content?: DemoContent;
  editMode?: boolean;
  updateContent?: CopyUpdater;
}) {
  const data = accountDashboardMock;
  const ops = homeOpsMock;
  const [range, setRange] = useState<DashboardRange>("week");
  const [updatedAt, setUpdatedAt] = useState(ops.updatedAt);
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  // 「今日」按最近两笔订单算，保证和下方「累计订单 10 笔」是同一个账户口径。
  const todayOrders = data.orders.slice(0, 2);
  const failedCount = todayOrders.filter((order) => order.status === "failed").length;
  const todaySpend = todayOrders.reduce((sum, order) => sum + order.amount, 0);
  const todayAccount = todayOrders.filter((order) => order.kind === "account").length;
  const todayRecharge = todayOrders.filter((order) => order.kind === "recharge").length;
  const successRate = todayOrders.length
    ? ((todayOrders.length - failedCount) / todayOrders.length) * 100
    : 100;
  const recentOrders = data.orders.slice(0, 5);

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    timer.current = window.setTimeout(() => {
      setUpdatedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }));
      setRefreshing(false);
      toast.success("数据已刷新");
    }, 600);
  };

  return <section className="hp-page">
    <header className="hp-head">
      <div className="hp-head-copy">
        <span className="hp-head-icon" aria-hidden="true"><LayoutDashboard /></span>
        <div>
          <h1>你好，{data.user.name}</h1>
          <p>今天的情况和账户整体，一屏看完。<em>更新于 {updatedAt}</em></p>
        </div>
      </div>
      <div className="hp-head-actions">
        <button className="hp-icon-button" type="button" onClick={refresh} aria-label="刷新数据" data-loading={refreshing || undefined}>
          <RefreshCw aria-hidden="true" />
        </button>
        <button className="hp-ghost" type="button" onClick={onOpenRecharge}>充值</button>
        <button className="hp-primary" type="button" onClick={() => onNavigate("card")}>去办卡<ArrowRight aria-hidden="true" /></button>
      </div>
    </header>

    <section className="hp-block">
      <header className="hp-block-head">
        <div><h2>今日</h2><p>成功与失败订单分开统计，不含历史</p></div>
      </header>
      <div className="hp-stats is-three">
        <div className="hp-stat">
          <span>今日消费</span>
          <strong>{money(todaySpend)}</strong>
          <em>最近 {todayOrders.length} 笔订单合计</em>
        </div>
        <div className="hp-stat">
          <span>今日订单</span>
          <strong>{todayOrders.length}<small>笔</small></strong>
          <em>成品号 {todayAccount} · 代充 {todayRecharge}</em>
        </div>
        <div className="hp-stat">
          <span>支付成功率</span>
          <strong>{successRate.toFixed(0)}<small>%</small></strong>
          <em>{failedCount ? `${failedCount} 笔未成功` : "暂无失败订单"}</em>
        </div>
      </div>
    </section>

    <section className="hp-block">
      <header className="hp-block-head">
        <div><h2>整体</h2><p>余额可以花，累计数字用来看趋势</p></div>
        <button className="hp-link" type="button" onClick={() => onNavigate("flows")}>账户明细<ArrowRight aria-hidden="true" /></button>
      </header>
      <div className="hp-stats is-four">
        <div className="hp-stat">
          <span>可用余额</span>
          <strong>{money(availableBalance)}</strong>
          <em>可直接下单</em>
        </div>
        <div className="hp-stat">
          <span>冻结金额</span>
          <strong>{money(data.summary.frozenBalance)}</strong>
          <em>处理中订单占用</em>
        </div>
        <div className="hp-stat">
          <span>累计消费</span>
          <strong>{money(data.summary.totalSpent)}</strong>
          <em>{data.summary.completedOrders} 笔已完成</em>
        </div>
        <div className="hp-stat">
          <span>累计订单</span>
          <strong>{data.summary.totalOrders}<small>笔</small></strong>
          <em>成品号 {data.summary.accountOrders} · 代充 {data.summary.rechargeOrders}</em>
        </div>
      </div>
    </section>

    <section className="hp-block">
      <header className="hp-block-head">
        <div><h2>消费趋势</h2><p>单位 USD，按你选的范围聚合</p></div>
        <div className="hp-range" role="group" aria-label="统计范围">
          {ranges.map((item) => <button
            key={item.id}
            type="button"
            data-active={range === item.id}
            onClick={() => setRange(item.id)}
          >{item.label}</button>)}
        </div>
      </header>
      <div className="hp-trend">
        <SpendTrendChart points={personalSpendTrend[range]} />
      </div>
    </section>

    <section className="hp-block is-last">
      <header className="hp-block-head">
        <div><h2>最近订单</h2><p>支付、处理、交付状态都集中在订单里</p></div>
        <button className="hp-link" type="button" onClick={() => onNavigate("orders")}>全部订单<ArrowRight aria-hidden="true" /></button>
      </header>
      <ul className="hp-orders">
        {recentOrders.map((order) => <li key={order.id}>
          <span className="hp-order-kind">{order.kind === "account" ? "成品号" : "代充"}</span>
          <div className="hp-order-main">
            <strong>{order.product}</strong>
            <small>{order.id} · {order.createdAt}</small>
          </div>
          <em className="hp-order-status" data-status={order.status}>{order.statusLabel}</em>
          <b>{money(order.amount)}</b>
        </li>)}
      </ul>
    </section>
  </section>;
}
