"use client";

import { useMemo, useState } from "react";
import { Copy, Download, Gift, QrCode, Sparkles, Users, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { EditableText } from "@/components/editable-text";
import { PageHeading, formatMoney, type CopyUpdater } from "@/components/user-center-shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { accountDashboardMock } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";

type DetailTab = "invite" | "exchange";

export function InvitePage({ content, editMode, updateContent }: { content: DemoContent; editMode: boolean; updateContent: CopyUpdater }) {
  const data = accountDashboardMock;
  const [tab, setTab] = useState<DetailTab>("invite");
  const [points, setPoints] = useState("100");
  const estimated = useMemo(() => Math.max(0, Number(points) || 0) / 100, [points]);
  const copy = async (value: string, label = "内容") => {
    try { await navigator.clipboard.writeText(value); toast.success(`${label}已复制`); }
    catch { toast.info(`${label}（Demo）`, { description: value }); }
  };

  return (
    <section className="user-center-page invite-page">
      <PageHeading titleKey="invitePageTitle" subtitleKey="invitePageSubtitle" content={content} editMode={editMode} updateContent={updateContent} aside={<span className="uc-rate-badge">{data.invite.rate}</span>} />

      <section className="uc-card invite-core-card">
        <div className="invite-core-copy">
          <div className="uc-section-heading"><div><h2>专属邀请信息</h2><p>将你的邀请链接分享给好友</p></div></div>
          <label><EditableText active={editMode} value={content.inviteCode} onChange={(value) => updateContent("inviteCode", value)} /></label>
          <div className="invite-value-row"><strong>{data.invite.code}</strong><button type="button" onClick={() => copy(data.invite.code, "邀请码")} aria-label="复制邀请码"><Copy /></button></div>
          <label><EditableText active={editMode} value={content.inviteLink} onChange={(value) => updateContent("inviteLink", value)} /></label>
          <div className="invite-value-row is-link"><span>{data.invite.link}</span><button type="button" onClick={() => copy(data.invite.link, "邀请链接")}><Copy /><EditableText active={editMode} value={content.copyLink} onChange={(value) => updateContent("copyLink", value)} /></button></div>
        </div>
        <div className="invite-core-qr"><div className="qr-demo"><QrCode /><span>SUKAI</span></div><button type="button" onClick={() => toast.success("二维码已准备下载（Demo）")}><Download /><EditableText active={editMode} value={content.downloadQr} onChange={(value) => updateContent("downloadQr", value)} /></button></div>
      </section>

      <div className="uc-light-stats invite-stats">
        <div><Users /><span><EditableText active={editMode} value={content.invitedUsers} onChange={(value) => updateContent("invitedUsers", value)} /></span><strong>{data.summary.invitedUsers}</strong><small>人</small></div>
        <div><Gift /><span>累计奖励</span><strong>{formatMoney(data.summary.totalRewards)}</strong><small>已计入账户</small></div>
        <div><Sparkles /><span><EditableText active={editMode} value={content.currentPoints} onChange={(value) => updateContent("currentPoints", value)} /></span><strong>{data.summary.points}</strong><small>积分</small></div>
      </div>

      <section className="uc-invite-workspace">
        <div className="uc-card share-templates-card">
          <div className="uc-section-heading"><div><h2><EditableText active={editMode} value={content.shareTemplates} onChange={(value) => updateContent("shareTemplates", value)} /></h2><p>选择适合的文案并一键复制</p></div></div>
          <div className="share-template-list">{data.inviteTemplates.map((template) => <article key={template.id}><div><strong>{template.title}</strong><p>{template.content}</p></div><button type="button" onClick={() => copy(template.content, template.title)}><Copy /><EditableText active={editMode} value={content.copyAction} onChange={(value) => updateContent("copyAction", value)} /></button></article>)}</div>
        </div>
        <div className="uc-card points-exchange-card">
          <div className="uc-section-heading"><div><h2><EditableText active={editMode} value={content.exchangePoints} onChange={(value) => updateContent("exchangePoints", value)} /></h2><p>将积分兑换到平台余额</p></div></div>
          <div className="points-balance"><span><EditableText active={editMode} value={content.currentPoints} onChange={(value) => updateContent("currentPoints", value)} /></span><strong>{data.summary.points}</strong><small><EditableText active={editMode} value={content.pointsRatio} onChange={(value) => updateContent("pointsRatio", value)} /></small></div>
          <label className="points-input"><span><EditableText active={editMode} value={content.exchangeInput} onChange={(value) => updateContent("exchangeInput", value)} /></span><input type="number" min="0" max={data.summary.points} value={points} onChange={(event) => setPoints(event.target.value)} /></label>
          <div className="points-estimate"><span><EditableText active={editMode} value={content.expectedCredit} onChange={(value) => updateContent("expectedCredit", value)} /></span><strong>{formatMoney(estimated)}</strong></div>
          <Button disabled={!estimated || Number(points) > data.summary.points} onClick={() => toast.success("兑换申请已提交（Demo）")}><WalletCards /><EditableText active={editMode} value={content.exchangeToBalance} onChange={(value) => updateContent("exchangeToBalance", value)} /></Button>
        </div>
      </section>

      <section className="uc-card uc-detail-panel invite-records-card">
        <div className="uc-filter-bar">
          <Tabs value={tab} onValueChange={(value) => setTab(value as DetailTab)}><TabsList className="uc-tabs-list"><TabsTrigger value="invite"><EditableText active={editMode} value={content.inviteDetails} onChange={(value) => updateContent("inviteDetails", value)} /></TabsTrigger><TabsTrigger value="exchange"><EditableText active={editMode} value={content.exchangeRecordsTitle} onChange={(value) => updateContent("exchangeRecordsTitle", value)} /></TabsTrigger></TabsList></Tabs>
        </div>
        <div className="uc-table-wrap"><table className="uc-table"><thead><tr>{tab === "invite" ? <><th>时间</th><th>类型</th><th>金额</th><th>来源订单号</th><th>备注</th></> : <><th>申请时间</th><th>积分</th><th>到账金额</th><th>状态</th><th>备注</th></>}</tr></thead><tbody>{tab === "invite" ? data.inviteRecords.map((record) => <tr key={record.id}><td>{record.time}</td><td><strong>{record.type}</strong></td><td className="is-income">+{formatMoney(record.amount)}</td><td><code>{record.orderId}</code></td><td>{record.note}</td></tr>) : data.exchangeRecords.map((record) => <tr key={record.id}><td>{record.time}</td><td>{record.points}</td><td>{formatMoney(record.amount)}</td><td><span className="uc-status is-completed">{record.status}</span></td><td>{record.note}</td></tr>)}</tbody></table></div>
      </section>
    </section>
  );
}
