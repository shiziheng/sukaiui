"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Coins,
  CreditCard,
  FileText,
  Gift,
  List,
  LockKeyhole,
  PackageOpen,
  PlusCircle,
  ReceiptText,
  RotateCcw,
  Snowflake,
  Sparkles,
  WalletCards,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { EditableText } from "@/components/editable-text";
import { PageHeading, type CopyUpdater } from "@/components/user-center-shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { accountDashboardMock, type DashboardDestination } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";

type WalletTab = "flow" | "recharge" | "frozen";

function formatWalletMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function WalletEmpty({ icon, title }: { icon: ReactNode; title: string }) {
  return <div className="uc-empty wallet-empty">{icon}<strong>{title}</strong><p>相关资金记录会显示在这里。</p></div>;
}

function FlowIcon({ type }: { type: string }) {
  if (type.includes("充值")) return <ArrowDownLeft />;
  if (type.includes("邀请")) return <Gift />;
  if (type.includes("冻结")) return <Snowflake />;
  if (type.includes("退款") || type.includes("解冻")) return <RotateCcw />;
  if (type.includes("积分")) return <Coins />;
  return <ArrowUpRight />;
}

export function WalletPage({
  content,
  editMode,
  updateContent,
  onNavigate,
}: {
  content: DemoContent;
  editMode: boolean;
  updateContent: CopyUpdater;
  onNavigate: (destination: DashboardDestination) => void;
}) {
  const [tab, setTab] = useState<WalletTab>("flow");
  const data = accountDashboardMock;

  const openRecharge = () => {
    setTab("recharge");
    toast.info("已进入充值记录，充值面板为 Demo");
  };

  return <section className="user-center-page wallet-page">
    <PageHeading
      titleKey="walletTitle"
      subtitleKey="walletSubtitle"
      content={content}
      editMode={editMode}
      updateContent={updateContent}
      icon={<WalletCards />}
      aside={<Button className="wallet-recharge-button" onClick={openRecharge}><PlusCircle /><EditableText active={editMode} value={content.walletRecharge} onChange={(value) => updateContent("walletRecharge", value)} /></Button>}
    />

    <section className="wallet-overview" aria-label="资金概览">
      <article className="wallet-balance-card is-primary">
        <span className="wallet-stat-icon"><WalletCards /></span>
        <div><span><EditableText active={editMode} value={content.availableBalance} onChange={(value) => updateContent("availableBalance", value)} /></span><strong>{formatWalletMoney(data.summary.availableBalance)}</strong><small>可用于下单与代充</small></div>
      </article>
      <article className="wallet-balance-card">
        <span className="wallet-stat-icon"><LockKeyhole /></span>
        <div><span><EditableText active={editMode} value={content.frozenAmount} onChange={(value) => updateContent("frozenAmount", value)} /></span><strong>{formatWalletMoney(data.summary.frozenBalance)}</strong><small>订单处理中暂时冻结</small></div>
      </article>
      <article className="wallet-balance-card">
        <span className="wallet-stat-icon"><Coins /></span>
        <div><span><EditableText active={editMode} value={content.currentPoints} onChange={(value) => updateContent("currentPoints", value)} /></span><strong>{data.summary.points}</strong><small>可兑换平台余额</small></div>
      </article>
    </section>

    <section className="wallet-quick-strip uc-card" aria-label="快捷操作">
      <div className="wallet-quick-copy"><span className="section-title-icon"><Sparkles /></span><div><h2>快捷操作</h2><p>选择你要办理的服务</p></div></div>
      <div className="wallet-quick-actions">
        <button className="is-primary" type="button" onClick={openRecharge}><PlusCircle />充值</button>
        <button type="button" onClick={() => onNavigate("account")}><PackageOpen />购买成品号<ArrowRight /></button>
        <button type="button" onClick={() => onNavigate("recharge")}><Zap />开始代充<ArrowRight /></button>
      </div>
    </section>

    <section className="uc-card wallet-records-card">
      <div className="wallet-tabs-row">
        <Tabs value={tab} onValueChange={(value) => setTab(value as WalletTab)}>
          <TabsList className="uc-tabs-list wallet-tabs-list">
            <TabsTrigger value="flow"><List /><EditableText active={editMode} value={content.accountFlowTab} onChange={(value) => updateContent("accountFlowTab", value)} /></TabsTrigger>
            <TabsTrigger value="recharge"><ReceiptText /><EditableText active={editMode} value={content.rechargeRecordTab} onChange={(value) => updateContent("rechargeRecordTab", value)} /></TabsTrigger>
            <TabsTrigger value="frozen"><LockKeyhole /><EditableText active={editMode} value={content.frozenDetailTab} onChange={(value) => updateContent("frozenDetailTab", value)} /></TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="wallet-result-count">{tab === "flow" ? data.walletRecords.length : tab === "recharge" ? data.topUpRecords.length : data.frozenRecords.length} 条记录</span>
      </div>

      {tab === "flow" ? data.walletRecords.length ? <div className="uc-table-wrap wallet-table-wrap"><table className="uc-table wallet-table"><thead><tr><th>时间</th><th>类型</th><th>金额</th><th>变动后余额</th><th>关联订单</th><th>备注</th></tr></thead><tbody>{data.walletRecords.map((item) => <tr key={item.id}><td><time>{item.time}</time></td><td><span className="wallet-flow-type"><i><FlowIcon type={item.type} /></i><strong>{item.type}</strong></span></td><td className={`wallet-amount ${item.amount > 0 ? "is-income" : "is-expense"}`}>{item.amount > 0 ? "+" : "−"}{formatWalletMoney(Math.abs(item.amount))}</td><td className="wallet-balance-after">{formatWalletMoney(item.balance)}</td><td><code>{item.orderId}</code></td><td>{item.note}</td></tr>)}</tbody></table></div> : <WalletEmpty icon={<List />} title="暂无账户流水" />
        : tab === "recharge" ? data.topUpRecords.length ? <div className="uc-table-wrap wallet-table-wrap"><table className="uc-table wallet-table is-recharge-table"><thead><tr><th>充值单号</th><th>充值金额</th><th>支付方式</th><th>状态</th><th>创建时间</th><th>完成时间</th><th>操作</th></tr></thead><tbody>{data.topUpRecords.map((item) => <tr key={item.id}><td><code>{item.id}</code></td><td className="wallet-amount">{formatWalletMoney(item.amount)}</td><td><span className="wallet-payment-method"><CreditCard />{item.method}</span></td><td><span className={`wallet-status ${item.status === "已完成" ? "is-completed" : "is-pending"}`}><i />{item.status}</span></td><td><time>{item.createdAt}</time></td><td><time>{item.completedAt}</time></td><td><button className="uc-link-button" type="button" onClick={() => toast.info("充值详情为 Demo 交互")}>详情</button></td></tr>)}</tbody></table></div> : <WalletEmpty icon={<ReceiptText />} title="暂无充值记录" />
          : data.frozenRecords.length ? <div className="uc-table-wrap wallet-table-wrap"><table className="uc-table wallet-table is-frozen-table"><thead><tr><th>时间</th><th>冻结金额</th><th>原因</th><th>关联订单</th><th>状态</th></tr></thead><tbody>{data.frozenRecords.map((item) => <tr key={item.id}><td><time>{item.time}</time></td><td className="wallet-amount">{formatWalletMoney(item.amount)}</td><td><span className="wallet-flow-type"><i><Snowflake /></i><strong>{item.reason}</strong></span></td><td><code>{item.orderId}</code></td><td><span className={`wallet-status ${item.status === "已释放" ? "is-completed" : "is-processing"}`}><i />{item.status}</span></td></tr>)}</tbody></table></div> : <WalletEmpty icon={<FileText />} title="暂无冻结记录" />}
    </section>
  </section>;
}
