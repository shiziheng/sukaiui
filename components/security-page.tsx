"use client";

import { useState } from "react";
import { BadgeCheck, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { EditableText } from "@/components/editable-text";
import { PageHeading, type CopyUpdater } from "@/components/user-center-shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { accountDashboardMock } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";

export function SecurityPage({ content, editMode, updateContent }: { content: DemoContent; editMode: boolean; updateContent: CopyUpdater }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const save = () => { toast.success("密码已更新（Demo）"); setOpen(false); setForm({ current: "", next: "", confirm: "" }); };
  return <section className="user-center-page compact-account-page">
    <PageHeading titleKey="securityTitle" subtitleKey="securitySubtitle" content={content} editMode={editMode} updateContent={updateContent} icon={<ShieldCheck />} />
    <section className="uc-card security-list">
      <div><span className="security-icon"><Mail /></span><div><span><EditableText active={editMode} value={content.loginEmail} onChange={(value) => updateContent("loginEmail", value)} /></span><strong>{accountDashboardMock.user.email}</strong></div><span className="security-verified"><BadgeCheck />已验证</span></div>
      <div><span className="security-icon"><KeyRound /></span><div><span><EditableText active={editMode} value={content.loginPassword} onChange={(value) => updateContent("loginPassword", value)} /></span><strong>••••••••••••</strong></div><Button variant="outline" onClick={() => setOpen(true)}><EditableText active={editMode} value={content.modifyPassword} onChange={(value) => updateContent("modifyPassword", value)} /></Button></div>
    </section>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="password-dialog"><DialogHeader><DialogTitle><EditableText active={editMode} value={content.modifyPassword} onChange={(value) => updateContent("modifyPassword", value)} /></DialogTitle><DialogDescription>本次仅演示表单交互，不会修改真实账户密码。</DialogDescription></DialogHeader><div className="password-form">{(["currentPassword", "newPassword", "confirmNewPassword"] as const).map((key, index) => { const field = index === 0 ? "current" : index === 1 ? "next" : "confirm"; return <label key={key}><span><EditableText active={editMode} value={content[key]} onChange={(value) => updateContent(key, value)} /></span><input type="password" value={form[field]} onChange={(event) => setForm((state) => ({ ...state, [field]: event.target.value }))} /></label>; })}</div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>{content.cancel}</Button><Button className="dialog-confirm" disabled={!form.current || !form.next || form.next !== form.confirm} onClick={save}><EditableText active={editMode} value={content.saveNewPassword} onChange={(value) => updateContent("saveNewPassword", value)} /></Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
