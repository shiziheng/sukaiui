"use client";

import { useState } from "react";
import { CreditCard, LockKeyhole, Sparkles, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { EditableText } from "@/components/editable-text";
import { PageHeading, formatMoney, type CopyUpdater } from "@/components/user-center-shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { accountDashboardMock } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";

type WalletTab = "flow" | "recharge" | "frozen";

export function WalletPage({ content, editMode, updateContent }: { content: DemoContent; editMode: boolean; updateContent: CopyUpdater }) {
  const [tab, setTab] = useState<WalletTab>("flow");
  const data = accountDashboardMock;
  return <section className="user-center-page wallet-page">
    <PageHeading titleKey="walletTitle" subtitleKey="walletSubtitle" content={content} editMode={editMode} updateContent={updateContent} aside={<Button className="wallet-recharge-button" onClick={() => { setTab("recharge"); toast.info("已进入充值记录，充值面板为 Demo"); }}><CreditCard /><EditableText active={editMode} value={content.walletRecharge} onChange={(value) => updateContent("walletRecharge", value)} /></Button>} />
    <div className="uc-light-stats wallet-stats"><div><WalletCards /><span><EditableText active={editMode} value={content.availableBalance} onChange={(value) => updateContent("availableBalance", value)} /></span><strong>{formatMoney(data.summary.availableBalance)}</strong></div><div><LockKeyhole /><span><EditableText active={editMode} value={content.frozenAmount} onChange={(value) => updateContent("frozenAmount", value)} /></span><strong>{formatMoney(data.summary.frozenBalance)}</strong></div><div><Sparkles /><span><EditableText active={editMode} value={content.currentPoints} onChange={(value) => updateContent("currentPoints", value)} /></span><strong>{data.summary.points}</strong></div></div>
    <section className="uc-card uc-detail-panel wallet-records-card">
      <div className="uc-filter-bar"><Tabs value={tab} onValueChange={(value) => setTab(value as WalletTab)}><TabsList className="uc-tabs-list"><TabsTrigger value="flow"><EditableText active={editMode} value={content.accountFlowTab} onChange={(value) => updateContent("accountFlowTab", value)} /></TabsTrigger><TabsTrigger value="recharge"><EditableText active={editMode} value={content.rechargeRecordTab} onChange={(value) => updateContent("rechargeRecordTab", value)} /></TabsTrigger><TabsTrigger value="frozen"><EditableText active={editMode} value={content.frozenDetailTab} onChange={(value) => updateContent("frozenDetailTab", value)} /></TabsTrigger></TabsList></Tabs></div>
      <div className="uc-table-wrap"><table className="uc-table wallet-table"><thead><tr>{tab === "flow" ? <><th>时间</th><th>类型</th><th>金额</th><th>变动后余额</th><th>关联订单</th><th>备注</th></> : tab === "recharge" ? <><th>充值单号</th><th>充值金额</th><th>支付方式</th><th>状态</th><th>创建时间</th><th>完成时间</th><th>操作</th></> : <><th>时间</th><th>金额</th><th>原因</th><th>关联订单</th><th>状态</th></>}</tr></thead><tbody>{tab === "flow" ? data.walletRecords.map((item) => <tr key={item.id}><td>{item.time}</td><td><strong>{item.type}</strong></td><td className={item.amount > 0 ? "is-income" : ""}>{item.amount > 0 ? "+" : "−"}{formatMoney(Math.abs(item.amount))}</td><td>{formatMoney(item.balance)}</td><td><code>{item.orderId}</code></td><td>{item.note}</td></tr>) : tab === "recharge" ? data.topUpRecords.map((item) => <tr key={item.id}><td><code>{item.id}</code></td><td>{formatMoney(item.amount)}</td><td>{item.method}</td><td><span className={`uc-status ${item.status === "已完成" ? "is-completed" : "is-pending"}`}>{item.status}</span></td><td>{item.createdAt}</td><td>{item.completedAt}</td><td><button className="uc-link-button" type="button" onClick={() => toast.info("充值详情为 Demo 交互")}>详情</button></td></tr>) : data.frozenRecords.map((item) => <tr key={item.id}><td>{item.time}</td><td>{formatMoney(item.amount)}</td><td><strong>{item.reason}</strong></td><td><code>{item.orderId}</code></td><td><span className={`uc-status ${item.status === "已释放" ? "is-completed" : "is-processing"}`}>{item.status}</span></td></tr>)}</tbody></table></div>
    </section>
  </section>;
}
