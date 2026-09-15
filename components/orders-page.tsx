"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, PackageCheck, ReceiptText, ShoppingBag } from "lucide-react";

import { EditableText } from "@/components/editable-text";
import { OrderTable, PageHeading, type CopyUpdater } from "@/components/user-center-shared";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { accountDashboardMock, type OrderKind, type OrderStatus } from "@/data/account-dashboard";
import { type DemoContent } from "@/data/content";

type OrderTab = "all" | OrderKind;
type StatusFilter = "all" | OrderStatus;

export function OrdersPage({ content, editMode, updateContent }: { content: DemoContent; editMode: boolean; updateContent: CopyUpdater }) {
  const [tab, setTab] = useState<OrderTab>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const data = accountDashboardMock;
  const orders = useMemo(() => data.orders.filter((order) => (tab === "all" || order.kind === tab) && (status === "all" || order.status === status)), [tab, status, data.orders]);

  return (
    <section className="user-center-page orders-page">
      <PageHeading titleKey="ordersPageTitle" subtitleKey="ordersPageSubtitle" content={content} editMode={editMode} updateContent={updateContent} icon={<ReceiptText />} />
      <div className="uc-light-stats" aria-label="订单统计">
        <div><ReceiptText /><span><EditableText active={editMode} value={content.allOrdersTab} onChange={(value) => updateContent("allOrdersTab", value)} /></span><strong>{data.summary.totalOrders}</strong></div>
        <div><ShoppingBag /><span><EditableText active={editMode} value={content.accountOrdersTab} onChange={(value) => updateContent("accountOrdersTab", value)} /></span><strong>{data.summary.accountOrders}</strong></div>
        <div><PackageCheck /><span><EditableText active={editMode} value={content.rechargeOrdersTab} onChange={(value) => updateContent("rechargeOrdersTab", value)} /></span><strong>{data.summary.rechargeOrders}</strong></div>
        <div><CheckCircle2 /><span><EditableText active={editMode} value={content.completedOrders} onChange={(value) => updateContent("completedOrders", value)} /></span><strong>{data.summary.completedOrders}</strong></div>
      </div>
      <section className="uc-card uc-detail-panel">
        <div className="uc-filter-bar">
          <Tabs value={tab} onValueChange={(value) => setTab(value as OrderTab)}>
            <TabsList className="uc-tabs-list">
              <TabsTrigger value="all"><EditableText active={editMode} value={content.allOrdersTab} onChange={(value) => updateContent("allOrdersTab", value)} /></TabsTrigger>
              <TabsTrigger value="account"><EditableText active={editMode} value={content.accountOrdersTab} onChange={(value) => updateContent("accountOrdersTab", value)} /></TabsTrigger>
              <TabsTrigger value="recharge"><EditableText active={editMode} value={content.rechargeOrdersTab} onChange={(value) => updateContent("rechargeOrdersTab", value)} /></TabsTrigger>
            </TabsList>
          </Tabs>
          <label className="uc-status-filter"><span>订单状态</span><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}><option value="all">{content.allStatus}</option><option value="completed">成功 / 已完成</option><option value="processing">处理中 / 备货中</option><option value="pending">待确认</option><option value="failed">失败</option></select></label>
        </div>
        {orders.length ? <OrderTable orders={orders} mode={tab} content={content} editMode={editMode} updateContent={updateContent} /> : <div className="uc-empty"><ReceiptText /><strong>暂无订单</strong><p>当前筛选条件下没有消费记录。</p></div>}
      </section>
    </section>
  );
}
