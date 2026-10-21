"use client";

import type { ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, LayoutTemplate, Sparkles, X } from "lucide-react";
import { EditableText } from "@/components/editable-text";

export type SidebarLayout = "collapsible" | "expanded" | "rail";

export type SidebarItem = {
  id: string;
  label: string;
  icon: ReactNode;
  /** 编辑模式下改文案 */
  onLabelChange?: (value: string) => void;
  /** 新提到一级的入口，给个荧光点 */
  isNew?: boolean;
};

export type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

const LAYOUT_OPTIONS: Array<{ id: SidebarLayout; name: string; desc: string }> = [
  { id: "collapsible", name: "随手收起", desc: "默认展开，点箭头变图标轨" },
  { id: "expanded", name: "一直展开", desc: "244px，功能名全露出来" },
  { id: "rail", name: "只留图标", desc: "72px，鼠标悬停出名字" },
];

export function AppSidebar({
  groups,
  activeId,
  collapsed,
  layout,
  layoutOpen,
  editMode,
  brandText,
  onBrandChange,
  userInitials,
  userName,
  userMeta,
  introVisible,
  onNavigate,
  onHome,
  onToggleCollapse,
  onToggleLayout,
  onPickLayout,
  onDismissIntro,
}: {
  groups: SidebarGroup[];
  activeId: string;
  collapsed: boolean;
  layout: SidebarLayout;
  layoutOpen: boolean;
  editMode: boolean;
  brandText: string;
  onBrandChange: (value: string) => void;
  userInitials: string;
  userName: string;
  userMeta: string;
  introVisible: boolean;
  onNavigate: (id: string) => void;
  onHome: () => void;
  onToggleCollapse: () => void;
  onToggleLayout: () => void;
  onPickLayout: (layout: SidebarLayout) => void;
  onDismissIntro: () => void;
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
        {layout === "collapsible" ? (
          <button className="sb-collapse" type="button" onClick={onToggleCollapse} aria-label={collapsed ? "展开侧栏" : "收起侧栏"}>
            {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
          </button>
        ) : null}
      </div>

      {introVisible && !collapsed ? (
        <div className="sb-intro" role="status">
          <Sparkles aria-hidden="true" />
          <div>
            <strong>常用功能已经挪到左边了</strong>
            <p>钱包流水、邀请奖励、账号安全现在是直接入口，不用再点头像里找。</p>
          </div>
          <button type="button" onClick={onDismissIntro} aria-label="关闭提示"><X aria-hidden="true" /></button>
        </div>
      ) : null}

      <nav className="sb-nav">
        {groups.map((group) => (
          <div className="sb-group" key={group.title}>
            <p className="sb-group-title">{group.title}</p>
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
        <div className="sb-user">
          <span className="sb-user-avatar" aria-hidden="true">{userInitials}</span>
          <span className="sb-user-text">
            <strong>{userName}</strong>
            <small>{userMeta}</small>
          </span>
        </div>
        <div className="sb-layout-wrap">
          <button className="sb-layout-button" type="button" onClick={onToggleLayout} aria-expanded={layoutOpen} title="版式设置">
            <LayoutTemplate aria-hidden="true" />
            <span>版式</span>
          </button>
          {layoutOpen ? (
            <div className="sb-layout-pop" role="menu">
              <p>侧栏怎么显示</p>
              {LAYOUT_OPTIONS.map((option) => (
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={layout === option.id}
                  data-on={layout === option.id}
                  onClick={() => onPickLayout(option.id)}
                  key={option.id}
                >
                  <span>
                    {option.name}
                    <small>{option.desc}</small>
                  </span>
                  {layout === option.id ? <Check aria-hidden="true" /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
