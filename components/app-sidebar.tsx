"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { EditableText } from "@/components/editable-text";

/** 二级菜单：点一下直接切到对应子页。 */
export type SidebarChild = {
  id: string;
  label: string;
  onLabelChange?: (value: string) => void;
};

export type SidebarItem = {
  id: string;
  label: string;
  icon: ReactNode;
  /** 编辑模式下改文案 */
  onLabelChange?: (value: string) => void;
  /** 新入口的小圆点 */
  isNew?: boolean;
  /** 有二级菜单时，父项右侧出箭头；默认展开 */
  children?: SidebarChild[];
  /** 点父项本身去哪个页面；缺省落到第一个子项 */
  targetId?: string;
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
  // 二级菜单默认全展开，用户手动收起才记成 closed。
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (id: string) => setClosedGroups((current) => ({ ...current, [id]: !current[id] }));

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
              const children = item.children ?? [];
              const hasChildren = children.length > 0;
              const childActive = children.some((child) => child.id === activeId);
              const isOpen = hasChildren && !closedGroups[item.id];
              const destination = item.targetId ?? children[0]?.id ?? item.id;
              return (
                <div className="sb-item-block" key={item.id}>
                  <div className="sb-item-row">
                    <button
                      className="sb-item"
                      data-active={activeId === item.id}
                      data-child-active={childActive || undefined}
                      data-new={item.isNew || undefined}
                      aria-current={activeId === item.id ? "page" : undefined}
                      type="button"
                      onClick={() => onNavigate(destination)}
                      title={collapsed ? item.label : undefined}
                      style={{ ["--i" as string]: order }}
                    >
                      <span className="sb-item-icon">{item.icon}</span>
                      <span className="sb-item-label">
                        {item.onLabelChange ? (
                          <EditableText active={editMode} value={item.label} onChange={item.onLabelChange} />
                        ) : item.label}
                      </span>
                      {item.isNew && !collapsed ? <span className="sb-item-new">新</span> : null}
                    </button>
                    {hasChildren ? (
                      <button
                        className="sb-caret"
                        type="button"
                        aria-expanded={isOpen}
                        aria-label={isOpen ? `收起${item.label}` : `展开${item.label}`}
                        onClick={() => toggleGroup(item.id)}
                      >
                        <ChevronDown aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                  {hasChildren && isOpen ? (
                    <div className="sb-sub">
                      {children.map((child) => (
                        <button
                          className="sb-subitem"
                          data-active={activeId === child.id}
                          type="button"
                          onClick={() => onNavigate(child.id)}
                          title={collapsed ? child.label : undefined}
                          key={child.id}
                        >
                          <span className="sb-subitem-label">
                            {child.onLabelChange ? (
                              <EditableText active={editMode} value={child.label} onChange={child.onLabelChange} />
                            ) : child.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sb-foot">
        <button
          className="sb-user"
          data-active={activeId === "my"}
          aria-current={activeId === "my" ? "page" : undefined}
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
