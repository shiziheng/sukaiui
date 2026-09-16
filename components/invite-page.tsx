"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Copy, Download, Gift, QrCode, Sparkles, Users, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { EditableText } from "@/components/editable-text";
import { PageHeading, type CopyUpdater } from "@/components/user-center-shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { accountDashboardMock } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";

type DetailTab = "invites" | "rewards" | "exchange";

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function InviteEmpty({ icon, title }: { icon: ReactNode; title: string }) {
  return <div className="uc-empty invite-empty">{icon}<strong>{title}</strong><p>相关邀请与奖励记录会显示在这里。</p></div>;
}

export function InvitePage({ content, editMode, updateContent }: { content: DemoContent; editMode: boolean; updateContent: CopyUpdater }) {
  const data = accountDashboardMock;
  const [tab, setTab] = useState<DetailTab>("invites");
  const [points, setPoints] = useState("100");
  const estimated = useMemo(() => Math.max(0, Number(points) || 0) / 100, [points]);
  const copy = async (value: string, label = "内容") => {
    try { await navigator.clipboard.writeText(value); toast.success(`${label}已复制`); }
    catch { toast.info(`${label}（Demo）`, { description: value }); }
  };
  const count = tab === "invites" ? data.invitedUserRecords.length : tab === "rewards" ? data.inviteRecords.length : data.exchangeRecords.length;

  return (
    <section className="user-center-page invite-page">
      <PageHeading titleKey="invitePageTitle" subtitleKey="invitePageSubtitle" content={content} editMode={editMode} updateContent={updateContent} icon={<Gift />} aside={<span className="uc-rate-badge">{data.invite.rate}</span>} />

      <section className="uc-card invite-core-card">
        <div className="invite-core-copy">
          <div className="uc-section-heading"><div><h2>邀请工具</h2><p>复制邀请码或链接，邀请好友加入 SUKAI</p></div></div>
          <label><EditableText active={editMode} value={content.inviteCode} onChange={(value) => updateContent("inviteCode", value)} /></label>
          <div className="invite-value-row is-code"><strong>{data.invite.code}</strong><button type="button" onClick={() => copy(data.invite.code, "邀请码")} aria-label="复制邀请码"><Copy />复制</button></div>
          <label><EditableText active={editMode} value={content.inviteLink} onChange={(value) => updateContent("inviteLink", value)} /></label>
          <div className="invite-value-row is-link"><span>{data.invite.link}</span><button type="button" onClick={() => copy(data.invite.link, "邀请链接")}><Copy /><EditableText active={editMode} value={content.copyLink} onChange={(value) => updateContent("copyLink", value)} /></button></div>
        </div>
        <div className="invite-core-qr"><div className="qr-demo"><QrCode /><span>SUKAI</span></div><p>扫码注册自动绑定邀请关系</p><button type="button" onClick={() => toast.success("二维码已准备下载（Demo）")}><Download /><EditableText active={editMode} value={content.downloadQr} onChange={(value) => updateContent("downloadQr", value)} /></button></div>
      </section>

      <section className="ds-stat-grid invite-stats" aria-label="邀请统计">
        <article className="ds-stat-card"><span className="ds-icon-box"><Users /></span><div><span><EditableText active={editMode} value={content.invitedUsers} onChange={(value) => updateContent("invitedUsers", value)} /></span><strong>{data.summary.invitedUsers}<small>人</small></strong><p>已通过你的链接注册</p></div></article>
        <article className="ds-stat-card"><span className="ds-icon-box"><Gift /></span><div><span>累计奖励</span><strong>{formatMoney(data.summary.totalRewards)}</strong><p>已计入账户奖励</p></div></article>
        <article className="ds-stat-card"><span className="ds-icon-box"><Sparkles /></span><div><span><EditableText active={editMode} value={content.currentPoints} onChange={(value) => updateContent("currentPoints", value)} /></span><strong>{data.summary.points}</strong><p>可兑换平台余额</p></div></article>
      </section>

      <section className="uc-invite-workspace">
        <div className="uc-card share-templates-card">
          <div className="uc-section-heading"><div><h2><EditableText active={editMode} value={content.shareTemplates} onChange={(value) => updateContent("shareTemplates", value)} /></h2><p>选择合适的文案分享给好友</p></div></div>
          <div className="share-template-grid">{data.inviteTemplates.map((template) => <article key={template.id}><div><strong>{template.title}</strong><p>{template.content}</p></div><button type="button" onClick={() => copy(template.content, template.title)}><Copy /><EditableText active={editMode} value={content.copyAction} onChange={(value) => updateContent("copyAction", value)} /></button></article>)}</div>
        </div>
        <div className="uc-card points-exchange-card">
          <div className="uc-section-heading"><div><h2><EditableText active={editMode} value={content.exchangePoints} onChange={(value) => updateContent("exchangePoints", value)} /></h2><p>将积分兑换到平台余额</p></div></div>
          <div className="points-balance"><span><EditableText active={editMode} value={content.currentPoints} onChange={(value) => updateContent("currentPoints", value)} /></span><strong>{data.summary.points}</strong><small><EditableText active={editMode} value={content.pointsRatio} onChange={(value) => updateContent("pointsRatio", value)} /></small></div>
          <label className="points-input"><span><EditableText active={editMode} value={content.exchangeInput} onChange={(value) => updateContent("exchangeInput", value)} /></span><input type="number" min="0" max={data.summary.points} value={points} onChange={(event) => setPoints(event.target.value)} /></label>
          <div className="points-estimate"><span><EditableText active={editMode} value={content.expectedCredit} onChange={(value) => updateContent("expectedCredit", value)} /></span><strong>{formatMoney(estimated)}</strong></div>
          <Button disabled={!estimated || Number(points) > data.summary.points} onClick={() => toast.success("兑换申请已提交（Demo）")}><WalletCards /><EditableText active={editMode} value={content.exchangeToBalance} onChange={(value) => updateContent("exchangeToBalance", value)} /></Button>
        </div>
      </section>

      <section className="uc-card invite-records-card">
        <div className="invite-tabs-row">
          <Tabs value={tab} onValueChange={(value) => setTab(value as DetailTab)}><TabsList className="uc-tabs-list invite-tabs-list"><TabsTrigger value="invites"><EditableText active={editMode} value={content.inviteDetails} onChange={(value) => updateContent("inviteDetails", value)} /></TabsTrigger><TabsTrigger value="rewards"><EditableText active={editMode} value={content.rewardRecordsTitle} onChange={(value) => updateContent("rewardRecordsTitle", value)} /></TabsTrigger><TabsTrigger value="exchange"><EditableText active={editMode} value={content.exchangeRecordsTitle} onChange={(value) => updateContent("exchangeRecordsTitle", value)} /></TabsTrigger></TabsList></Tabs>
          <span className="invite-result-count">{count} 条记录</span>
        </div>
        {tab === "invites" ? data.invitedUserRecords.length ? <div className="uc-table-wrap invite-table-wrap"><table className="uc-table invite-table"><thead><tr><th>邀请用户</th><th>注册时间</th><th>状态</th><th>累计消费</th><th>我的奖励</th></tr></thead><tbody>{data.invitedUserRecords.map((record) => <tr key={record.id}><td><strong>{record.user}</strong></td><td><time>{record.registeredAt}</time></td><td><span className="uc-status is-completed"><i />{record.status}</span></td><td>{formatMoney(record.spending)}</td><td className="is-income">+{formatMoney(record.reward)}</td></tr>)}</tbody></table></div> : <InviteEmpty icon={<Users />} title="暂无邀请记录" />
          : tab === "rewards" ? data.inviteRecords.length ? <div className="uc-table-wrap invite-table-wrap"><table className="uc-table invite-table"><thead><tr><th>时间</th><th>类型</th><th>奖励金额</th><th>来源订单</th><th>备注</th></tr></thead><tbody>{data.inviteRecords.map((record) => <tr key={record.id}><td><time>{record.time}</time></td><td><strong>{record.type}</strong></td><td className="is-income">+{formatMoney(record.amount)}</td><td><code>{record.orderId}</code></td><td>{record.note}</td></tr>)}</tbody></table></div> : <InviteEmpty icon={<Gift />} title="暂无奖励记录" />
            : data.exchangeRecords.length ? <div className="uc-table-wrap invite-table-wrap"><table className="uc-table invite-table"><thead><tr><th>申请时间</th><th>积分</th><th>到账金额</th><th>状态</th><th>备注</th></tr></thead><tbody>{data.exchangeRecords.map((record) => <tr key={record.id}><td><time>{record.time}</time></td><td>{record.points}</td><td>{formatMoney(record.amount)}</td><td><span className="uc-status is-completed"><i />{record.status}</span></td><td>{record.note}</td></tr>)}</tbody></table></div> : <InviteEmpty icon={<Sparkles />} title="暂无兑换记录" />}
      </section>
    </section>
  );
}
