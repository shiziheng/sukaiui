"use client";

import { BadgeCheck, CalendarDays, Mail, Pencil, UserRound } from "lucide-react";
import { toast } from "sonner";

import { EditableText } from "@/components/editable-text";
import { PageHeading, type CopyUpdater } from "@/components/user-center-shared";
import { Button } from "@/components/ui/button";
import { accountDashboardMock } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";

export function ProfilePage({ content, editMode, updateContent }: { content: DemoContent; editMode: boolean; updateContent: CopyUpdater }) {
  const user = accountDashboardMock.user;
  return <section className="user-center-page compact-account-page">
    <PageHeading titleKey="profileTitle" subtitleKey="profileSubtitle" content={content} editMode={editMode} updateContent={updateContent} />
    <section className="uc-card profile-detail-card">
      <div className="profile-detail-top"><div className="uc-avatar">{user.initials}</div><div><h2>{user.name}</h2><p>{user.email}</p><span><BadgeCheck />{user.status}</span></div><Button variant="outline" onClick={() => toast.info("编辑资料为 Demo 交互")}><Pencil /><EditableText active={editMode} value={content.editProfile} onChange={(value) => updateContent("editProfile", value)} /></Button></div>
      <div className="profile-detail-grid"><div><UserRound /><span>用户名</span><strong>{user.name}</strong></div><div><Mail /><span>登录邮箱</span><strong>{user.email}</strong></div><div><BadgeCheck /><span>账户状态</span><strong>{user.status}</strong></div><div><CalendarDays /><span><EditableText active={editMode} value={content.registeredAt} onChange={(value) => updateContent("registeredAt", value)} /></span><strong>2026-08-18</strong></div></div>
    </section>
  </section>;
}
