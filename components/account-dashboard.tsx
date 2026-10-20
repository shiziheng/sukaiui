"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Clock3, Gift, Headphones,
  LayoutDashboard, ReceiptText, RefreshCw, Sparkles, WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { RechargeSpendChart, SparkLine, SpendTrendChart } from "@/components/dashboard-charts";
import { EditableText } from "@/components/editable-text";
import { formatMoney, type CopyUpdater } from "@/components/user-center-shared";
import { accountDashboardMock, type DashboardDestination } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";
import { homeOpsCopy, homeOpsMock, type DashboardRange } from "@/data/home-dashboard";

const money2 = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const orderTotal = homeOpsMock.orderStatus.reduce((sum, item) => sum + Number(item.count.replace(/[^\d]/g, "")), 0);

export function AccountDashboard({ onNavigate, onOpenRecharge, availableBalance, content, editMode, updateContent }: {
  onNavigate: (destination: DashboardDestination) => void;
  onOpenRecharge: () => void;
  availableBalance: number;
  content: DemoContent;
  editMode: boolean;
  updateContent: CopyUpdater;
}) {
  const data = accountDashboardMock;
  const ops = homeOpsMock;
  const copy = homeOpsCopy;
  const [range, setRange] = useState<DashboardRange>("week");
  const [updatedAt, setUpdatedAt] = useState(ops.updatedAt);
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const pending = data.orders.filter((order) => order.status === "pending" || order.status === "processing").length;
  const rangeLabel = copy.ranges.find((item) => item.id === range)?.label ?? "";
  const monthCap = ops.kpi.monthSpend;
  const todaySuccess = ops.kpi.todaySuccess;
  const todayFailed = ops.kpi.todayFailed;
  const chargeback = ops.kpi.chargebackRate;
  const sparkValues = ops.trend.month.slice(-14).map((point) => point.value);

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    timer.current = window.setTimeout(() => {
      setUpdatedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }));
      setRefreshing(false);
      toast.success("数据已刷新");
    }, 600);
  };

  const quickLinks: Array<{ id: string; icon: typeof Sparkles; label: string; editableKey?: keyof DemoContent; note: string; onClick: () => void }> = [
    { id: "recharge", icon: Sparkles, label: "套餐代充", note: "单账号 / 批量", onClick: () => onNavigate("recharge") },
    { id: "wallet", icon: WalletCards, label: content.availableBalance, editableKey: "availableBalance", note: money2(availableBalance), onClick: () => onNavigate("wallet") },
    { id: "orders", icon: ReceiptText, label: "交易记录", note: `${data.orders.length} 笔 · 待处理 ${pending}`, onClick: () => onNavigate("orders") },
    { id: "invite", icon: Gift, label: content.navInvite, editableKey: "navInvite", note: `已邀请 ${data.summary.invitedUsers} 人`, onClick: () => onNavigate("invite") },
    { id: "support", icon: Headphones, label: content.supportNav, editableKey: "supportNav", note: "3 分钟内响应", onClick: () => toast.info("在线客服为 Demo 入口") },
  ];

  return (
    <section className="user-center-page business-dashboard home-ops-dashboard">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <span className="dash-hero-icon" aria-hidden="true"><LayoutDashboard /></span>
          <div>
            <span className="dash-hero-eyebrow">{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}<em>{copy.updatedPrefix} {updatedAt}</em></p>
          </div>
        </div>
        <div className="dash-hero-actions">
          <div className="dash-range" role="group" aria-label={copy.rangeLabel}>
            {copy.ranges.map((item) => (
              <button key={item.id} type="button" data-active={range === item.id} onClick={() => setRange(item.id as DashboardRange)}>{item.label}</button>
            ))}
          </div>
          <button className="dash-refresh" type="button" onClick={refresh} data-loading={refreshing}>
            <RefreshCw aria-hidden="true" />{copy.refresh}
          </button>
          <button className="dash-cta" type="button" onClick={onOpenRecharge}>
            {copy.openRecharge}<ArrowRight aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="dash-kpi-grid" aria-label="核心指标">
        <article className="dash-kpi is-hero">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">{copy.kpi.monthSpend.label}</span>
            <span className="dash-dot is-brand" aria-hidden="true" />
          </div>
          <strong className="dash-kpi-value">{money2(monthCap.amount)}</strong>
          <div className="dash-kpi-foot">
            <em className="is-good"><ArrowUpRight aria-hidden="true" />{monthCap.delta}%</em>
            <span>{copy.kpi.monthSpend.note}</span>
          </div>
          <p className="dash-kpi-hint">{copy.kpi.monthSpend.hint}</p>
          <SparkLine values={sparkValues} />
        </article>

        <article className="dash-kpi">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">{copy.kpi.todaySuccess.label}</span>
            <span className="dash-dot is-success" aria-hidden="true" />
          </div>
          <strong className="dash-kpi-value">{money2(todaySuccess.amount)}</strong>
          <div className="dash-kpi-foot">
            <em className="is-good"><ArrowUpRight aria-hidden="true" />{todaySuccess.delta}%</em>
            <span>较昨日</span>
          </div>
          <p className="dash-kpi-hint">{copy.kpi.todaySuccess.hint} · {todaySuccess.count} 笔</p>
        </article>

        <article className="dash-kpi">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">{copy.kpi.todayFailed.label}</span>
            <span className="dash-dot is-danger" aria-hidden="true" />
          </div>
          <strong className="dash-kpi-value">{money2(todayFailed.amount)}</strong>
          <div className="dash-kpi-foot">
            <em className={todayFailed.delta <= 0 ? "is-good" : "is-bad"}>
              <ArrowDownRight aria-hidden="true" />{Math.abs(todayFailed.delta)}%
            </em>
            <span>较昨日</span>
          </div>
          <p className="dash-kpi-hint">{copy.kpi.todayFailed.hint} · {todayFailed.count} 笔</p>
        </article>

        <article className="dash-kpi">
          <div className="dash-kpi-top">
            <span className="dash-kpi-label">{copy.kpi.chargebackRate.label}</span>
            <span className="dash-dot is-warning" aria-hidden="true" />
          </div>
          <strong className="dash-kpi-value">{chargeback.value}<small>%</small></strong>
          <div className="dash-kpi-foot">
            <em className={chargeback.delta <= 0 ? "is-good" : "is-bad"}>
              <ArrowDownRight aria-hidden="true" />{Math.abs(chargeback.delta)}pt
            </em>
            <span>较昨日</span>
          </div>
          <p className="dash-kpi-hint">{copy.kpi.chargebackRate.hint} · {chargeback.failed} / {chargeback.total} 笔</p>
        </article>
      </section>

      <section className="dash-grid is-main">
        <article className="uc-card dash-panel dash-panel-trend">
          <header className="dash-panel-head">
            <div>
              <h2>{copy.trendTitle}</h2>
              <p>{copy.trendHint} · {rangeLabel}</p>
            </div>
            <span className="dash-legend"><i className="is-line" />消费金额</span>
          </header>
          <SpendTrendChart points={ops.trend[range]} />
        </article>

        <article className="uc-card dash-panel dash-panel-ops">
          <header className="dash-panel-head">
            <div>
              <h2>{copy.opsTitle}</h2>
              <p>{copy.opsHint}</p>
            </div>
            <span className="dash-live-tag"><i />实时</span>
          </header>
          <div className="dash-ops-grid">
            {ops.operations.map((metric) => (
              <div className="dash-ops-cell" key={metric.id} data-tone={metric.tone ?? "neutral"}>
                <span>{metric.label}</span>
                <strong className={metric.strong ? "is-strong" : undefined}>{metric.value}<small>{metric.unit}</small></strong>
                {metric.note ? <em>{metric.note}</em> : null}
              </div>
            ))}
          </div>
          <p className="dash-panel-note">失败、拒付与退款金额仅统计虚拟卡订单。</p>
        </article>
      </section>

      <section className="dash-grid is-split">
        <article className="uc-card dash-panel dash-panel-compare">
          <header className="dash-panel-head">
            <div>
              <h2>{copy.compareTitle}</h2>
              <p>{copy.compareHint}</p>
            </div>
            <div className="dash-legend is-pair">
              <span><i className="is-recharge" />充值</span>
              <span><i className="is-spend" />消费</span>
            </div>
          </header>
          <RechargeSpendChart points={ops.compare} />
        </article>

        <article className="uc-card dash-panel dash-panel-status">
          <header className="dash-panel-head">
            <div>
              <h2>{copy.statusTitle}</h2>
              <p>{copy.statusHint}</p>
            </div>
            <span className="dash-total">{orderTotal.toLocaleString("en-US")} 笔</span>
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
          <p className="dash-panel-note">状态以订单最终结果为准，处理中订单不计入。</p>
        </article>
      </section>

      <section className="dash-grid is-bottom">
        <article className="uc-card dash-panel dash-panel-live">
          <header className="dash-panel-head">
            <div>
              <h2>{copy.liveTitle}</h2>
              <p>{copy.liveHint}</p>
            </div>
            <button className="uc-secondary-action" type="button" onClick={() => onNavigate("orders")}>
              {copy.liveAll}<ArrowRight aria-hidden="true" />
            </button>
          </header>
          <div className="dash-live-list">
            {ops.live.map((item) => (
              <div className="dash-live-row" key={item.id} data-tone={item.tone}>
                <span className="dash-live-kind">{item.kind}</span>
                <div className="dash-live-main">
                  <strong>{item.title}</strong>
                  <span>{item.ref} · {item.time}</span>
                </div>
                <strong className={`dash-live-amount ${item.positive ? "is-positive" : ""}`}>{item.amount}</strong>
              </div>
            ))}
          </div>
        </article>

        <aside className="dash-side">
          <article className="uc-card dash-panel dash-panel-quick">
            <header className="dash-panel-head">
              <div>
                <h2>{copy.quickTitle}</h2>
                <p>{copy.quickHint}</p>
              </div>
            </header>
            <div className="dash-quick-grid">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button key={link.id} type="button" className="dash-quick" onClick={link.onClick}>
                    <span className="dash-quick-icon"><Icon aria-hidden="true" /></span>
                    <span className="dash-quick-copy">
                      <strong>
                        {link.editableKey
                          ? <EditableText active={editMode} value={content[link.editableKey] as string} onChange={(value) => updateContent(link.editableKey as keyof DemoContent, value as never)} />
                          : link.label}
                      </strong>
                      <small>{link.note}</small>
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </article>

          <article className="uc-card dash-panel dash-panel-service">
            <div className="dash-service-block">
              <div className="dash-service-head">
                <span className="dash-quick-icon"><Gift aria-hidden="true" /></span>
                <div><strong>{copy.inviteTitle}</strong><small>{copy.inviteHint}</small></div>
              </div>
              <dl className="dash-service-facts">
                <div><dt>{copy.inviteCode}</dt><dd><code>{data.invite.code}</code></dd></div>
                <div><dt>{copy.invitedUsers}</dt><dd>{data.summary.invitedUsers} 人</dd></div>
                <div><dt>{copy.invitedRewards}</dt><dd>{formatMoney(data.summary.totalRewards)}</dd></div>
              </dl>
              <button className="dash-text-action" type="button" onClick={() => onNavigate("invite")}>
                {content.viewInviteActivity}<ArrowRight aria-hidden="true" />
              </button>
            </div>

            <div className="dash-service-block is-support">
              <div className="dash-service-head">
                <span className="dash-quick-icon"><Headphones aria-hidden="true" /></span>
                <div><strong>{copy.supportTitle}</strong><small>订单、支付与账号问题</small></div>
              </div>
              <dl className="dash-service-facts is-block">
                <div><dt><Clock3 aria-hidden="true" />{copy.supportHours}</dt><dd>{copy.supportHoursValue}</dd></div>
                <div><dt>{copy.supportReply}</dt><dd>{copy.supportReplyValue}</dd></div>
              </dl>
              <button className="dash-text-action is-strong" type="button" onClick={() => toast.info("在线客服为 Demo 入口")}>
                {copy.supportAction}<ArrowRight aria-hidden="true" />
              </button>
            </div>
          </article>
        </aside>
      </section>
    </section>
  );
}
