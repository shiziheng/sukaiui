"use client";

import { type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

import { EditableText } from "@/components/editable-text";
import { type DashboardOrder, type OrderKind } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";

export type CopyUpdater = <K extends keyof DemoContent>(key: K, value: DemoContent[K]) => void;

export function formatMoney(value: number) {
  return `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`;
}

export function PageHeading({
  titleKey, subtitleKey, content, editMode, updateContent, aside, icon,
}: {
  titleKey: keyof DemoContent;
  subtitleKey: keyof DemoContent;
  content: DemoContent;
  editMode: boolean;
  updateContent: CopyUpdater;
  aside?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <header className="uc-page-heading">
      <div className="uc-page-heading-copy">
        {icon ? <span className="uc-page-heading-icon" aria-hidden="true">{icon}</span> : null}
        <div>
        <h1><EditableText active={editMode} value={content[titleKey]} onChange={(value) => updateContent(titleKey, value)} /></h1>
        <p><EditableText active={editMode} value={content[subtitleKey]} onChange={(value) => updateContent(subtitleKey, value)} /></p>
        </div>
      </div>
      {aside}
    </header>
  );
}

export function StatusTag({ order }: { order: DashboardOrder }) {
  return <span className={`uc-status is-${order.status}`}>{order.statusLabel}</span>;
}

export function KindTag({ kind }: { kind: OrderKind }) {
  return <span className={`uc-kind-tag is-${kind}`}>{kind === "account" ? "成品号" : "代充"}</span>;
}

export function OrderTable({
  orders, mode, content, editMode, updateContent, compact = false,
}: {
  orders: DashboardOrder[];
  mode: "all" | OrderKind;
  content: DemoContent;
  editMode: boolean;
  updateContent: CopyUpdater;
  compact?: boolean;
}) {
  const action = (label: string) => toast.info(`${label}为 Demo 交互`);
  return (
    <div className="uc-table-wrap">
      <table className={`uc-table ${compact ? "is-compact" : ""}`}>
        <thead><tr>
          <th>订单号</th>
          {mode === "all" ? <><th>订单类型</th><th>产品名称</th></> : <th>{mode === "account" ? "商品快照" : "产品快照"}</th>}
          {mode === "recharge" ? <th>报价</th> : null}
          <th>{mode === "recharge" ? "实扣" : "金额"}</th><th>状态</th><th>时间</th><th>操作</th>
        </tr></thead>
        <tbody>{orders.map((order) => (
          <tr key={order.id}>
            <td><code>{order.id}</code></td>
            {mode === "all" ? <><td><KindTag kind={order.kind} /></td><td><strong>{order.product}</strong>{order.failureReason ? <small className="uc-failure">{order.failureReason}</small> : null}</td></>
              : <td><strong>{order.product}</strong><small>{order.snapshot}</small>{order.failureReason ? <small className="uc-failure">{order.failureReason}</small> : null}</td>}
            {mode === "recharge" ? <td>{formatMoney(order.quotedAmount ?? order.amount)}</td> : null}
            <td>{formatMoney(mode === "recharge" ? order.chargedAmount ?? order.amount : order.amount)}</td>
            <td><StatusTag order={order} /></td><td>{order.createdAt}</td>
            <td>{mode === "account" && order.status === "pending" ? (
              <button className="uc-link-button is-danger" type="button" onClick={() => action(content.cancelOrder)}><EditableText active={editMode} value={content.cancelOrder} onChange={(value) => updateContent("cancelOrder", value)} /></button>
            ) : mode === "account" && order.status === "completed" ? (
              <span className="uc-row-actions"><button className="uc-link-button" type="button" onClick={() => action(content.viewCredentials)}><EditableText active={editMode} value={content.viewCredentials} onChange={(value) => updateContent("viewCredentials", value)} /></button><button className="uc-link-button" type="button" onClick={() => action(content.downloadAction)}><EditableText active={editMode} value={content.downloadAction} onChange={(value) => updateContent("downloadAction", value)} /></button></span>
            ) : (
              <button className="uc-link-button" type="button" onClick={() => action(content.viewDetails)}><EditableText active={editMode} value={content.viewDetails} onChange={(value) => updateContent("viewDetails", value)} /><ArrowUpRight /></button>
            )}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
