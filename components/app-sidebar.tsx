"use client";

import { type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EditableText } from "@/components/editable-text";

export type SidebarItem = {
  id: string;
  label: string;
  icon: ReactNode;
  /** 编辑模式下改文案 */
  onLabelChange?: (value: string) => void;
  /** 新入口的小圆点 */
  isNew?: boolean;
};

export type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

export function AppSidebar({
  groups,
  activeId,
  collapsed,
  editMode,
  brandText,
  onBrandChange,
  userInitials,
  userName,
  userMeta,
  onNavigate,
  onHome,
  onToggleCollapse,
}: {
  groups: SidebarGroup[];
  activeId: string;
  collapsed: boolean;
  editMode: boolean;
  brandText: string;
  onBrandChange: (value: string) => void;
  userInitials: string;
  userName: string;
  userMeta: string;
  onNavigate: (id: string) => void;
  onHome: () => void;
  onToggleCollapse: () => void;
}) {
  let index = 0;

  return (
    <aside className="app-sidebar" data-collapsed={collapsed} aria-label="主菜单">
      <div className="sb-brand">
        <button className="sb-brand-button" type="button" onClick={onHome} aria-label="返回首页">
          <span className="logo-mark" aria-hidden="true">S</span>
          <span className="sb-brand-name">
            <EditableText active={editMode} value={brandText} onChange={onBrandChange} />
          </span>
        </button>
        <button className="sb-collapse" type="button" onClick={onToggleCollapse} aria-label={collapsed ? "展开侧栏" : "收起侧栏"}>
          {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
        </button>
      </div>

      <nav className="sb-nav">
        {groups.map((group) => (
          <div className="sb-group" key={group.title || "main"}>
            {group.title ? <p className="sb-group-title">{group.title}</p> : null}
            {group.items.map((item) => {
              const order = index++;
              return (
                <button
                  className="sb-item"
                  data-active={activeId === item.id}
                  data-new={item.isNew || undefined}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  style={{ ["--i" as string]: order }}
                  key={item.id}
                >
                  <span className="sb-item-icon">{item.icon}</span>
                  <span className="sb-item-label">
                    {item.onLabelChange ? (
                      <EditableText active={editMode} value={item.label} onChange={item.onLabelChange} />
                    ) : item.label}
                  </span>
                  {item.isNew && !collapsed ? <span className="sb-item-new">新</span> : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sb-foot">
        <button
          className="sb-user"
          data-active={activeId === "my"}
          type="button"
          onClick={() => onNavigate("my")}
          title={collapsed ? `${userName} · 我的` : undefined}
          aria-label="打开我的"
        >
          <span className="sb-user-avatar" aria-hidden="true">{userInitials}</span>
          <span className="sb-user-text">
            <strong>{userName}</strong>
            <small>{userMeta}</small>
          </span>
          <ChevronRight className="sb-user-chevron" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
