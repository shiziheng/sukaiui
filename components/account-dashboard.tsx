"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Gift, Headphones, LayoutDashboard, ReceiptText, RefreshCw, Sparkles, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { RechargeSpendChart, SparkLine, SpendTrendChart } from "@/components/dashboard-charts";
import { type CopyUpdater } from "@/components/user-center-shared";
import { accountDashboardMock, type DashboardDestination } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";
import { homeOpsCopy, homeOpsMock, type DashboardRange } from "@/data/home-dashboard";
import "./home-overview.css";

const money = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * 登录后首页。
 * 版式沿用现在的区块骨架（页头 + 细线分隔的区块，不套卡片壳）；
 * 内容项按运营看板口径：核心指标 → 运营 → 消费趋势 → 充值/消费对比 → 订单状态 → 实时动态 → 快捷入口 → 邀请与客服。
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
  const copy = homeOpsCopy;
  const [range, setRange] = useState<DashboardRange>("week");
  const [updatedAt, setUpdatedAt] = useState(ops.updatedAt);
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    timer.current = window.setTimeout(() => {
      setUpdatedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }));
      setRefreshing(false);
      toast.success("数据已刷新");
    }, 600);
  };

  const kpi = ops.kpi;
  const sparkValues = ops.trend.month.slice(-14).map((point) => point.value);
  const orderTotal = 3_354;

  const quickLinks: Array<{ id: string; icon: typeof Sparkles; label: string; note: string; onClick: () => void }> = [
    { id: "recharge", icon: Sparkles, label: "查看代充", note: "4 单 · 2 笔", onClick: () => onNavigate("recharge") },
    { id: "balance", icon: WalletCards, label: "可用余额", note: money(availableBalance), onClick: () => onNavigate("wallet") },
    { id: "records", icon: ReceiptText, label: "交易记录", note: "8 笔 · 2 笔", onClick: () => onNavigate("flows") },
    { id: "invite", icon: Gift, label: "我的邀请", note: `已邀 ${data.summary.invitedUsers} 人`, onClick: () => onNavigate("invite") },
    { id: "support", icon: Headphones, label: "在线客服", note: "3 分钟内响应", onClick: () => toast.info("在线客服为 Demo 入口") },
  ];

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

    {/* 核心指标：本月消费额（主卡）+ 今日成功 / 今日失败 / 拒付率 */}
    <section className="hp-block">
      <header className="hp-block-head">
        <div><h2>本月与今日</h2><p>成功与失败订单分开统计，不含历史</p></div>
      </header>
      <div className="hp-stats is-four">
        <div className="hp-stat is-primary">
          <span>{copy.kpi.monthSpend.label}<i className="hp-dot is-brand" aria-hidden="true" /></span>
          <strong>{money(kpi.monthSpend.amount)}</strong>
          <em className="hp-delta is-good"><ArrowUpRight aria-hidden="true" />{kpi.monthSpend.delta}%<i>{copy.kpi.monthSpend.note}</i></em>
          <small className="hp-stat-foot">{copy.kpi.monthSpend.hint} · {kpi.monthSpend.caption}</small>
          <SparkLine values={sparkValues} />
        </div>
        <div className="hp-stat">
          <span>{copy.kpi.todaySuccess.label}<i className="hp-dot is-success" aria-hidden="true" /></span>
          <strong>{money(kpi.todaySuccess.amount)}</strong>
          <em className="hp-delta is-good"><ArrowUpRight aria-hidden="true" />{kpi.todaySuccess.delta}%<i>较昨日</i></em>
          <small className="hp-stat-foot">{copy.kpi.todaySuccess.hint} · {kpi.todaySuccess.count} 笔</small>
        </div>
        <div className="hp-stat">
          <span>{copy.kpi.todayFailed.label}<i className="hp-dot is-danger" aria-hidden="true" /></span>
          <strong>{money(kpi.todayFailed.amount)}</strong>
          <em className={`hp-delta ${kpi.todayFailed.delta <= 0 ? "is-good" : "is-bad"}`}>
            <ArrowDownRight aria-hidden="true" />{Math.abs(kpi.todayFailed.delta)}%<i>较昨日</i>
          </em>
          <small className="hp-stat-foot">{copy.kpi.todayFailed.hint} · {kpi.todayFailed.count} 笔</small>
        </div>
        <div className="hp-stat">
          <span>{copy.kpi.chargebackRate.label}<i className="hp-dot is-warning" aria-hidden="true" /></span>
          <strong>{kpi.chargebackRate.value}<small>%</small></strong>
          <em className={`hp-delta ${kpi.chargebackRate.delta <= 0 ? "is-good" : "is-bad"}`}>
            <ArrowDownRight aria-hidden="true" />{Math.abs(kpi.chargebackRate.delta)}pt<i>较昨日</i>
          </em>
          <small className="hp-stat-foot">失败订单 {kpi.chargebackRate.failed} 笔 · 占全部交易 {kpi.chargebackRate.total} 笔</small>
        </div>
      </div>
    </section>

    {/* 运营：卡片 / 拒付 / 退款 / 卡余额六格 */}
    <section className="hp-block">
      <header className="hp-block-head">
        <div><h2>{copy.opsTitle}</h2><p>{copy.opsHint}</p></div>
        <span className="hp-live-tag"><i />实时</span>
      </header>
      <div className="hp-ops-grid">
        {ops.operations.map((metric) => (
          <div className={`hp-ops-cell ${metric.strong ? "is-strong" : ""}`} key={metric.id} data-tone={metric.tone ?? "neutral"}>
            <span>{metric.label}</span>
            <strong>{metric.value}<small>{metric.unit}</small></strong>
            {metric.note ? <em>{metric.note}</em> : null}
          </div>
        ))}
      </div>
      <p className="hp-note">失败、拒付与退款金额仅统计虚拟卡订单。</p>
    </section>

    {/* 消费金额趋势 */}
    <section className="hp-block">
      <header className="hp-block-head">
        <div><h2>{copy.trendTitle}</h2><p>{copy.trendHint}</p></div>
        <div className="hp-range" role="group" aria-label={copy.rangeLabel}>
          {copy.ranges.map((item) => <button
            key={item.id}
            type="button"
            data-active={range === item.id}
            onClick={() => setRange(item.id)}
          >{item.label}</button>)}
        </div>
      </header>
      <div className="hp-trend">
        <SpendTrendChart points={ops.trend[range]} />
      </div>
    </section>

    {/* 充值 / 消费对比 */}
    <section className="hp-block">
      <header className="hp-block-head">
        <div><h2>{copy.compareTitle}</h2><p>{copy.compareHint}</p></div>
        <span className="hp-legend"><span><i />充值</span><span><i className="is-spend" />消费</span></span>
      </header>
      <div className="hp-compare">
        <RechargeSpendChart points={ops.compare} />
      </div>
    </section>

    {/* 订单状态分布 */}
    <section className="hp-block">
      <header className="hp-block-head">
        <div><h2>{copy.statusTitle}</h2><p>{copy.statusHint}</p></div>
        <span className="hp-total">{orderTotal.toLocaleString("en-US")} 笔</span>
      </header>
      <div className="dash-status-list">
        {ops.orderStatus.map((item) => (
          <div className="dash-status-row" key={item.id} data-tone={item.tone}>
            <div className="dash-status-line">
              <span><i />{item.label}</span>
              <strong>{item.amount}<small>{item.count}</small></strong>
            </div>
            <div className="dash-status-track"><i style={{ width: `${Math.max(item.percent, 1.4)}%` }} /></div>
            <em>{item.percent}%</em>
          </div>
        ))}
      </div>
      <p className="hp-note">状态以订单最终结果为准，处理中订单不计入。</p>
    </section>

    {/* 实时交易动态 */}
    <section className="hp-block">
      <header className="hp-block-head">
        <div><h2>{copy.liveTitle}</h2><p>{copy.liveHint}</p></div>
        <button className="hp-link" type="button" onClick={() => onNavigate("orders")}>{copy.liveAll}<ArrowRight aria-hidden="true" /></button>
      </header>
      <ul className="hp-orders">
        {ops.live.map((item) => <li key={item.id}>
          <span className="hp-order-kind" data-tone={item.tone}>{item.kind}</span>
          <div className="hp-order-main">
            <strong>{item.title}</strong>
            <small>{item.ref} · {item.time}</small>
          </div>
          <b className={item.positive ? "is-positive" : undefined}>{item.amount}</b>
        </li>)}
      </ul>
    </section>

    {/* 快捷入口 */}
    <section className="hp-block">
      <header className="hp-block-head">
        <div><h2>{copy.quickTitle}</h2><p>{copy.quickHint}</p></div>
      </header>
      <div className="hp-quick-grid">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <button key={link.id} type="button" className="hp-quick" onClick={link.onClick}>
              <span className="hp-quick-icon"><Icon aria-hidden="true" /></span>
              <span className="hp-quick-copy">
                <strong>{link.label}</strong>
                <small>{link.note}</small>
              </span>
              <ArrowRight aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>

    {/* 邀请与客服 */}
    <section className="hp-block is-last">
      <header className="hp-block-head">
        <div><h2>{copy.serviceTitle}</h2><p>邀请返佣与售后入口</p></div>
      </header>
      <div className="hp-service">
        <div className="hp-service-block">
          <div className="hp-service-head">
            <span className="hp-quick-icon"><Gift aria-hidden="true" /></span>
            <div><strong>{copy.inviteTitle}</strong><small>{copy.inviteHint}</small></div>
          </div>
          <dl className="hp-service-facts">
            <div><dt>{copy.inviteCode}</dt><dd><code>{data.invite.code}</code></dd></div>
            <div><dt>{copy.invitedUsers}</dt><dd>{data.summary.invitedUsers} 人</dd></div>
            <div><dt>{copy.invitedRewards}</dt><dd>{money(data.summary.totalRewards)}</dd></div>
          </dl>
          <button className="hp-text-action" type="button" onClick={() => onNavigate("invite")}>
            查看邀请记录<ArrowRight aria-hidden="true" />
          </button>
        </div>

        <div className="hp-service-block">
          <div className="hp-service-head">
            <span className="hp-quick-icon"><Headphones aria-hidden="true" /></span>
            <div><strong>{copy.supportTitle}</strong><small>订单、支付与账号问题</small></div>
          </div>
          <dl className="hp-service-facts is-block">
            <div><dt>{copy.supportHours}</dt><dd>{copy.supportHoursValue}</dd></div>
            <div><dt>{copy.supportReply}</dt><dd>{copy.supportReplyValue}</dd></div>
          </dl>
          <button className="hp-text-action" type="button" onClick={() => toast.info("在线客服为 Demo 入口")}>
            {copy.supportAction}<ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  </section>;
}
