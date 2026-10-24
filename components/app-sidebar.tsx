"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, WalletCards } from "lucide-react";
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
  onNavigate,
  onHome,
  onToggleCollapse,
  walletBalance,
  walletOpen,
  onOpenWallet,
}: {
  groups: SidebarGroup[];
  activeId: string;
  collapsed: boolean;
  editMode: boolean;
  brandText: string;
  onBrandChange: (value: string) => void;
  onNavigate: (id: string) => void;
  onHome: () => void;
  onToggleCollapse: () => void;
  walletBalance: number;
  walletOpen: boolean;
  onOpenWallet: () => void;
}) {
  // 二级菜单默认全展开，用户手动收起才记成 closed。
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (id: string) => setClosedGroups((current) => ({ ...current, [id]: !current[id] }));
  const openGroup = (id: string) => setClosedGroups((current) => (current[id] ? { ...current, [id]: false } : current));

  // 从别处（首页快捷入口、顶栏、页面内的按钮）跳到某个子页时，把它所在的父项展开，
  // 别出现「当前在卡流水，菜单里却看不到卡流水」的情况。只跟 activeId 变化，手动收起不会被弹回来。
  useEffect(() => {
    const owner = groups.find((group) => group.items.some((item) => item.children?.some((child) => child.id === activeId)));
    const parent = owner?.items.find((item) => item.children?.some((child) => child.id === activeId));
    if (parent) setClosedGroups((current) => (current[parent.id] ? { ...current, [parent.id]: false } : current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

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
                      aria-expanded={hasChildren && !collapsed ? isOpen : undefined}
                      type="button"
                      onClick={() => {
                        if (!hasChildren) {
                          onNavigate(item.id);
                          return;
                        }
                        // 图标轨（收起态）看不到二级菜单，点了就直接进第一个子页。
                        if (collapsed) {
                          onNavigate(destination);
                          return;
                        }
                        // 已经在这个分组里，再点一次父项 = 收起二级菜单，页面不动。
                        if (isOpen && childActive) {
                          toggleGroup(item.id);
                          return;
                        }
                        // 其余情况：展开并落到第一个子页。
                        openGroup(item.id);
                        onNavigate(destination);
                      }}
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
          className="sb-balance"
          type="button"
          onClick={onOpenWallet}
          title={`平台余额 $${walletBalance.toFixed(2)} · 点击查看钱包`}
          aria-label={`查看平台余额，${walletBalance.toFixed(2)} 美元`}
          aria-expanded={walletOpen}
          aria-controls="wallet-drawer"
        >
          <span className="sb-balance-copy">
            <span className="sb-balance-label">平台余额</span>
            <span className="sb-balance-amount"><span className="cur">$</span>{walletBalance.toFixed(2)}</span>
            <span className="sb-balance-hint">查看钱包与充值</span>
          </span>
          <span className="sb-balance-icon-wrap" aria-hidden="true">
            <WalletCards className="sb-balance-icon" />
          </span>
        </button>
      </div>
    </aside>
  );
}
