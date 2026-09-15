"use client";

import { Check, Copy, KeyRound, PackageCheck, ReceiptText, Route, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { EditableText } from "@/components/editable-text";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatMoney, type CopyUpdater } from "@/components/user-center-shared";
import { getOrderActions, managedStatusDisplay, type ManagedOrder, type OrderActionId } from "@/data/order-management";
import { type DemoContent } from "@/data/content";

export type OrderDrawerFocus = "summary" | "progress" | "credentials";

const accountTimeline = [
  { status: "account_pending", label: "已下单" },
  { status: "account_stocking", label: "已确认" },
  { status: "account_stocking", label: "备货中" },
  { status: "account_delivered", label: "已交付" },
  { status: "account_completed", label: "已完成" },
] as const;

const accountProgressIndex: Record<string, number> = {
  account_pending: 0,
  account_stocking: 2,
  account_delivered: 3,
  account_completed: 4,
  account_cancelled: 0,
};

function actionLabel(id: OrderActionId, content: DemoContent) {
  if (id === "cancel") return content.cancelOrder;
  if (id === "progress") return content.queryProgress;
  if (id === "credentials") return content.viewCredentials;
  if (id === "download") return content.downloadAction;
  return content.viewDetails;
}

export function ManagedStatusTag({ order }: { order: ManagedOrder }) {
  const display = managedStatusDisplay[order.status];
  return <span className={`order-status-tag is-${display.tone}`}><i aria-hidden="true" />{display.label}</span>;
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <dl className="order-detail-grid">{children}</dl>;
}

function DetailItem({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? "is-wide" : ""}><dt>{label}</dt><dd>{value}</dd></div>;
}

export function OrderDetailDrawer({
  order,
  open,
  focus,
  content,
  editMode,
  updateContent,
  onOpenChange,
  onAction,
}: {
  order: ManagedOrder | null;
  open: boolean;
  focus: OrderDrawerFocus;
  content: DemoContent;
  editMode: boolean;
  updateContent: CopyUpdater;
  onOpenChange: (open: boolean) => void;
  onAction: (id: OrderActionId, order: ManagedOrder) => void;
}) {
  if (!order) return null;

  const display = managedStatusDisplay[order.status];
  const actions = getOrderActions(order).filter((action) => action.id !== "details");
  const copyMock = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label}已复制 · Demo Data`);
    } catch {
      toast.info(`${label}复制为 Demo 交互`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="order-detail-drawer">
        <SheetHeader className="order-drawer-header">
          <span className="order-drawer-kicker"><ReceiptText aria-hidden="true" /><EditableText active={editMode} value={content.orderDetailTitle} onChange={(value) => updateContent("orderDetailTitle", value)} /></span>
          <SheetTitle>{order.productName}</SheetTitle>
          <SheetDescription><span className={`uc-kind-tag is-${order.kind}`}>{order.kind === "account" ? "成品号" : "代充"}</span><code>{order.id}</code></SheetDescription>
        </SheetHeader>

        <div className="order-drawer-body">
          <section className="order-drawer-section">
            <div className="order-drawer-section-title"><ReceiptText aria-hidden="true" /><h3>订单信息</h3></div>
            <DetailGrid>
              <DetailItem label="商品名称" value={order.productName} wide />
              <DetailItem label={content.orderAmount} value={formatMoney(order.amount)} />
              <DetailItem label={content.orderStatusColumn} value={<ManagedStatusTag order={order} />} />
              <DetailItem label="创建时间" value={order.createdAt} wide />
            </DetailGrid>
          </section>

          {order.kind === "account" ? (
            <>
              <section className={`order-drawer-section order-progress-section ${focus === "progress" ? "is-focused" : ""}`}>
                <div className="order-drawer-section-title"><Route aria-hidden="true" /><h3><EditableText active={editMode} value={content.orderProgressTitle} onChange={(value) => updateContent("orderProgressTitle", value)} /></h3></div>
                {order.status === "account_cancelled" ? <div className="order-cancelled-note"><i aria-hidden="true" />订单已取消，处理流程已停止。</div> : (
                  <ol className="order-timeline">
                    {accountTimeline.map((step, index) => {
                      const complete = index <= accountProgressIndex[order.status];
                      const current = index === accountProgressIndex[order.status];
                      return <li className={`${complete ? "is-complete" : ""} ${current ? "is-current" : ""}`} key={`${step.status}-${step.label}`}><span>{complete ? <Check aria-hidden="true" /> : null}</span><div><strong>{step.label}</strong><small>{current ? display.label : complete ? "已完成" : "待处理"}</small></div></li>;
                    })}
                  </ol>
                )}
              </section>

              {order.accountDetails?.credentialAvailable ? (
                <section className={`order-drawer-section credential-section ${focus === "credentials" ? "is-focused" : ""}`}>
                  <div className="order-drawer-section-title"><KeyRound aria-hidden="true" /><h3>凭据信息</h3><span>DEMO DATA</span></div>
                  <div className="credential-row"><div><span>账号</span><strong>{order.accountDetails.account}</strong></div><button type="button" onClick={() => copyMock(order.accountDetails?.account ?? "", content.copyAccount)}><Copy aria-hidden="true" />{content.copyAccount}</button></div>
                  <div className="credential-row"><div><span>密码</span><strong>{order.accountDetails.password}</strong></div><button type="button" onClick={() => copyMock(order.accountDetails?.password ?? "", content.copyPassword)}><Copy aria-hidden="true" />{content.copyPassword}</button></div>
                </section>
              ) : null}
            </>
          ) : (
            <>
              <section className="order-drawer-section">
                <div className="order-drawer-section-title"><PackageCheck aria-hidden="true" /><h3>充值信息</h3></div>
                <DetailGrid>
                  <DetailItem label="充值账号" value={order.rechargeDetails?.email ?? "—"} wide />
                  <DetailItem label="当前套餐" value={order.rechargeDetails?.currentPlan ?? "—"} />
                  <DetailItem label="目标套餐" value={order.rechargeDetails?.targetPlan ?? "—"} />
                </DetailGrid>
              </section>
              <section className="order-drawer-section">
                <div className="order-drawer-section-title"><WalletCards aria-hidden="true" /><h3>金额与结果</h3></div>
                <DetailGrid>
                  <DetailItem label="报价" value={formatMoney(order.rechargeDetails?.quoteAmount ?? order.amount)} />
                  <DetailItem label="实际扣款" value={order.rechargeDetails?.actualAmount === null ? "—" : formatMoney(order.rechargeDetails?.actualAmount ?? order.amount)} />
                  {order.rechargeDetails?.completedAt ? <DetailItem label="完成时间" value={order.rechargeDetails.completedAt} wide /> : null}
                  {order.rechargeDetails?.failureReason ? <DetailItem label="失败原因" value={<span className="order-failure-reason">{order.rechargeDetails.failureReason}</span>} wide /> : null}
                </DetailGrid>
              </section>
            </>
          )}
        </div>

        {actions.length ? <SheetFooter className="order-drawer-footer"><span>订单操作</span><div>{actions.map((action) => <Button key={action.id} variant={action.variant === "danger" ? "outline" : "default"} className={action.variant === "danger" ? "is-danger" : ""} onClick={() => onAction(action.id, order)}>{actionLabel(action.id, content)}</Button>)}</div></SheetFooter> : null}
      </SheetContent>
    </Sheet>
  );
}
