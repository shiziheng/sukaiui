"use client";

import { useRef, type ChangeEvent } from "react";
import {
  ChevronRight, Download, Gift, LogOut, Pencil, RotateCcw, ShieldCheck, Upload, UserRound, Wrench,
} from "lucide-react";

import "./my-page.css";

import { EditableText } from "@/components/editable-text";
import { InvitePage } from "@/components/invite-page";
import { ProfilePage } from "@/components/profile-page";
import { SecurityPage } from "@/components/security-page";
import { PageHeading, type CopyUpdater } from "@/components/user-center-shared";
import { accountDashboardMock } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";

export type MyTab = "profile" | "security" | "invite" | "tools";

const TAB_META: Array<{
  id: MyTab;
  labelKey: "myTabProfile" | "myTabSecurity" | "myTabInvite" | "myTabTools";
  group: "account" | "more";
  icon: typeof UserRound;
}> = [
  { id: "profile", labelKey: "myTabProfile", group: "account", icon: UserRound },
  { id: "security", labelKey: "myTabSecurity", group: "account", icon: ShieldCheck },
  { id: "invite", labelKey: "myTabInvite", group: "more", icon: Gift },
  { id: "tools", labelKey: "myTabTools", group: "more", icon: Wrench },
];

export function MyPage({
  content,
  editMode,
  updateContent,
  tab,
  onTabChange,
  onLogout,
  onEnterEdit,
  onReset,
  onExport,
  onImport,
}: {
  content: DemoContent;
  editMode: boolean;
  updateContent: CopyUpdater;
  tab: MyTab;
  onTabChange: (tab: MyTab) => void;
  onLogout: () => void;
  onEnterEdit: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const user = accountDashboardMock.user;
  const importInputRef = useRef<HTMLInputElement>(null);
  const groups = [
    { id: "account" as const, titleKey: "myAccountGroup" as const, tabs: TAB_META.filter((item) => item.group === "account") },
    { id: "more" as const, titleKey: "myMoreGroup" as const, tabs: TAB_META.filter((item) => item.group === "more") },
  ];

  return (
    <section className="user-center-page my-page">
      <PageHeading
        titleKey="myTitle"
        subtitleKey="mySubtitle"
        content={content}
        editMode={editMode}
        updateContent={updateContent}
        icon={<UserRound />}
        aside={<span className="my-status-badge">{user.status}</span>}
      />

      <div className="my-layout">
        <aside className="uc-card my-side" aria-label="我的导航">
          <div className="my-user">
            <span className="my-avatar" aria-hidden="true">{user.initials}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </div>

          {groups.map((group) => (
            <div className="my-nav-group" key={group.id}>
              <span className="my-nav-title">
                <EditableText active={editMode} value={content[group.titleKey]} onChange={(value) => updateContent(group.titleKey, value)} />
              </span>
              <div className="my-nav-items">
                {group.tabs.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      className="my-nav-item"
                      data-active={tab === item.id}
                      type="button"
                      onClick={() => onTabChange(item.id)}
                      key={item.id}
                    >
                      <Icon aria-hidden="true" />
                      <span>
                        <EditableText active={editMode} value={content[item.labelKey]} onChange={(value) => updateContent(item.labelKey, value)} />
                      </span>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button className="my-logout" type="button" onClick={onLogout}>
            <LogOut aria-hidden="true" />
            <EditableText active={editMode} value={content.logout} onChange={(value) => updateContent("logout", value)} />
          </button>
        </aside>

        <div className="my-panel">
          {tab === "profile" ? <ProfilePage content={content} editMode={editMode} updateContent={updateContent} embedded /> : null}
          {tab === "security" ? <SecurityPage content={content} editMode={editMode} updateContent={updateContent} embedded /> : null}
          {tab === "invite" ? <InvitePage content={content} editMode={editMode} updateContent={updateContent} embedded /> : null}
          {tab === "tools" ? (
            <section className="uc-card my-tools">
              <header className="my-tools-heading">
                <span className="my-tools-icon" aria-hidden="true"><Wrench /></span>
                <div>
                  <h2>
                    <EditableText active={editMode} value={content.demoToolsTitle} onChange={(value) => updateContent("demoToolsTitle", value)} />
                  </h2>
                  <p>
                    <EditableText active={editMode} value={content.demoToolsHint} onChange={(value) => updateContent("demoToolsHint", value)} />
                  </p>
                </div>
              </header>

              <div className="my-tool-grid">
                <button className="my-tool" data-active={editMode} type="button" onClick={onEnterEdit}>
                  <span className="my-tool-icon"><Pencil aria-hidden="true" /></span>
                  <span><strong>{content.editCopy}</strong><small>直接在页面上修改文案</small></span>
                  {editMode ? <em className="my-tool-state">{content.editingNow}</em> : <ChevronRight aria-hidden="true" />}
                </button>
                <button className="my-tool" type="button" onClick={onExport}>
                  <span className="my-tool-icon"><Download aria-hidden="true" /></span>
                  <span><strong>{content.exportConfig}</strong><small>导出当前文案与商品配置</small></span>
                  <ChevronRight aria-hidden="true" />
                </button>
                <button className="my-tool" type="button" onClick={() => importInputRef.current?.click()}>
                  <span className="my-tool-icon"><Upload aria-hidden="true" /></span>
                  <span><strong>{content.importConfig}</strong><small>从 JSON 文件恢复一套配置</small></span>
                  <ChevronRight aria-hidden="true" />
                </button>
                <input ref={importInputRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
                <button className="my-tool is-danger" type="button" onClick={onReset}>
                  <span className="my-tool-icon"><RotateCcw aria-hidden="true" /></span>
                  <span><strong>{content.resetDefaults}</strong><small>清除本地修改，恢复演示默认值</small></span>
                  <ChevronRight aria-hidden="true" />
                </button>
              </div>

              <p className="my-tools-footnote">正式客户演示时保持默认隐藏，需要改文案时再从这里进入。</p>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}
