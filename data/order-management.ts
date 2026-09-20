export type ManagedOrderKind = "account" | "recharge";

export type AccountOrderStatus =
  | "account_pending"
  | "account_stocking"
  | "account_delivered"
  | "account_completed"
  | "account_cancelled";

export type RechargeOrderStatus =
  | "recharge_pending"
  | "recharge_processing"
  | "recharge_partial"
  | "recharge_success"
  | "recharge_failed";

export type ManagedOrderStatus = AccountOrderStatus | RechargeOrderStatus;
export type UnifiedOrderStatus = "processing" | "completed" | "error" | "cancelled";
export type OrderStatusTone = "pending" | "processing" | "delivered" | "completed" | "failed" | "cancelled";

export type AccountOrderDetails = {
  credentialAvailable: boolean;
  account?: string;
  password?: string;
  deliveredAt?: string;
  completedAt?: string;
};

export type RechargeOrderDetails = {
  email: string;
  currentPlan: string;
  targetPlan: string;
  quoteAmount: number;
  actualAmount: number | null;
  completedAt?: string;
  failureReason?: string;
};

export type BatchOrderDetails = {
  taskId: string;
  accountCount: number;
  taskStatus: "processing" | "partial" | "completed";
  items: Array<{
    id: string;
    email: string;
    targetPlan: string;
    status: "processing" | "success" | "failed";
    result: string;
  }>;
};

export type ManagedOrder = {
  id: string;
  kind: ManagedOrderKind;
  productName: string;
  productMeta: string;
  amount: number;
  currency: "USD";
  status: ManagedOrderStatus;
  createdAt: string;
  accountDetails?: AccountOrderDetails;
  rechargeDetails?: RechargeOrderDetails;
  batchDetails?: BatchOrderDetails;
};

export type OrderActionId = "cancel" | "progress" | "credentials" | "download" | "details";
export type OrderActionDescriptor = { id: OrderActionId; placement: "primary" | "overflow"; variant?: "danger" };

export const managedStatusDisplay: Record<ManagedOrderStatus, { label: string; tone: OrderStatusTone; unified: UnifiedOrderStatus }> = {
  account_pending: { label: "待确认", tone: "pending", unified: "processing" },
  account_stocking: { label: "备货中", tone: "processing", unified: "processing" },
  account_delivered: { label: "已交付", tone: "delivered", unified: "processing" },
  account_completed: { label: "已完成", tone: "completed", unified: "completed" },
  account_cancelled: { label: "已取消", tone: "cancelled", unified: "cancelled" },
  recharge_pending: { label: "待处理", tone: "pending", unified: "processing" },
  recharge_processing: { label: "处理中", tone: "processing", unified: "processing" },
  recharge_partial: { label: "部分完成", tone: "failed", unified: "processing" },
  recharge_success: { label: "成功", tone: "completed", unified: "completed" },
  recharge_failed: { label: "失败", tone: "failed", unified: "error" },
};

export const unifiedStatusOptions: Array<{ value: "all" | UnifiedOrderStatus; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "processing", label: "进行中" },
  { value: "completed", label: "已完成" },
  { value: "error", label: "异常" },
  { value: "cancelled", label: "已取消" },
];

export const accountStatusOptions: Array<{ value: "all" | AccountOrderStatus; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "account_pending", label: "待确认" },
  { value: "account_stocking", label: "备货中" },
  { value: "account_delivered", label: "已交付" },
  { value: "account_completed", label: "已完成" },
  { value: "account_cancelled", label: "已取消" },
];

export const rechargeStatusOptions: Array<{ value: "all" | RechargeOrderStatus; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "recharge_pending", label: "待处理" },
  { value: "recharge_processing", label: "处理中" },
  { value: "recharge_partial", label: "部分完成" },
  { value: "recharge_success", label: "成功" },
  { value: "recharge_failed", label: "失败" },
];

export function getUnifiedStatus(order: ManagedOrder): UnifiedOrderStatus {
  return managedStatusDisplay[order.status].unified;
}

export function getOrderActions(order: ManagedOrder): OrderActionDescriptor[] {
  if (order.kind === "recharge") return [{ id: "details", placement: "primary" }];

  switch (order.status) {
    case "account_pending":
      return [{ id: "cancel", placement: "primary", variant: "danger" }, { id: "details", placement: "overflow" }];
    case "account_stocking":
      return [{ id: "progress", placement: "primary" }, { id: "details", placement: "overflow" }];
    case "account_delivered":
    case "account_completed":
      return [{ id: "credentials", placement: "primary" }, { id: "download", placement: "overflow" }, { id: "details", placement: "overflow" }];
    case "account_cancelled":
      return [{ id: "details", placement: "primary" }];
    default:
      return [{ id: "details", placement: "primary" }];
  }
}

export const orderManagementMock: ManagedOrder[] = [
  { id: "MO202609140018", kind: "account", productName: "ChatGPT Plus 菲区", productMeta: "独享成品号 · Plus · 菲区", amount: 18, currency: "USD", status: "account_stocking", createdAt: "2026-09-14 14:32", accountDetails: { credentialAvailable: false } },
  { id: "DO202609130011", kind: "recharge", productName: "ChatGPT Pro 代充", productMeta: "目标套餐：Pro · 1个月", amount: 59.9, currency: "USD", status: "recharge_processing", createdAt: "2026-09-13 20:14", rechargeDetails: { email: "demo-pro@example.com", currentPlan: "Free", targetPlan: "Pro", quoteAmount: 59.9, actualAmount: null } },
  { id: "MO202609120026", kind: "account", productName: "ChatGPT Plus 成品号", productMeta: "独享成品号 · Plus", amount: 19.9, currency: "USD", status: "account_delivered", createdAt: "2026-09-12 19:46", accountDetails: { credentialAvailable: true, account: "demo@example.com", password: "••••••••", deliveredAt: "2026-09-12 20:08" } },
  { id: "DO202609110021", kind: "recharge", productName: "ChatGPT Plus 代充", productMeta: "目标套餐：Plus · 1个月", amount: 13.5, currency: "USD", status: "recharge_pending", createdAt: "2026-09-11 11:26", rechargeDetails: { email: "demo-plus@example.com", currentPlan: "Free", targetPlan: "Plus", quoteAmount: 13.5, actualAmount: null } },
  { id: "MO202609080009", kind: "account", productName: "Claude Pro 成品号", productMeta: "独享成品号 · Pro", amount: 19.9, currency: "USD", status: "account_completed", createdAt: "2026-09-08 11:20", accountDetails: { credentialAvailable: true, account: "claude-demo@example.com", password: "••••••••", deliveredAt: "2026-09-08 11:41", completedAt: "2026-09-08 12:03" } },
  { id: "MO202609030004", kind: "account", productName: "ChatGPT Pro 成品号", productMeta: "独享成品号 · Pro", amount: 49.9, currency: "USD", status: "account_pending", createdAt: "2026-09-03 16:08", accountDetails: { credentialAvailable: false } },
  { id: "DO202608290017", kind: "recharge", productName: "ChatGPT Plus 代充", productMeta: "目标套餐：Plus · 1个月", amount: 13.5, currency: "USD", status: "recharge_failed", createdAt: "2026-08-29 09:35", rechargeDetails: { email: "demo-failed@example.com", currentPlan: "Plus", targetPlan: "Plus", quoteAmount: 13.5, actualAmount: 0, failureReason: "上游下单失败：当前账号目标套餐有效期未到。" } },
  { id: "MO202608260012", kind: "account", productName: "Gemini Pro 成品号", productMeta: "独享成品号 · Pro", amount: 12.9, currency: "USD", status: "account_cancelled", createdAt: "2026-08-26 18:02", accountDetails: { credentialAvailable: false } },
  { id: "DO202608240006", kind: "recharge", productName: "ChatGPT Go 菲区", productMeta: "目标套餐：Go · 1个月", amount: 4.8, currency: "USD", status: "recharge_success", createdAt: "2026-08-24 10:18", rechargeDetails: { email: "demo-go@example.com", currentPlan: "Free", targetPlan: "Go", quoteAmount: 4.8, actualAmount: 4.8, completedAt: "2026-08-24 10:31" } },
  { id: "MO202608200008", kind: "account", productName: "ChatGPT Plus 美区", productMeta: "独享成品号 · Plus · 美区", amount: 18, currency: "USD", status: "account_completed", createdAt: "2026-08-20 18:02", accountDetails: { credentialAvailable: true, account: "us-demo@example.com", password: "••••••••", deliveredAt: "2026-08-20 18:24", completedAt: "2026-08-20 18:55" } },
];
