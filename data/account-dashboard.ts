export type DashboardDestination = "home" | "wallet" | "account" | "recharge" | "orders" | "invite" | "profile" | "security" | "help";
export type OrderKind = "account" | "recharge";
export type OrderStatus = "completed" | "processing" | "pending" | "failed";

export type DashboardOrder = {
  id: string;
  kind: OrderKind;
  product: string;
  snapshot: string;
  amount: number;
  quotedAmount?: number;
  chargedAmount?: number;
  status: OrderStatus;
  statusLabel: string;
  createdAt: string;
  failureReason?: string;
};

export const accountDashboardMock = {
  user: { name: "Heman123", email: "shizheng134@gmail.com", initials: "H", status: "邮箱已验证" },
  summary: {
    totalBalance: 556.96, availableBalance: 359.96, frozenBalance: 197, points: 171,
    totalOrders: 10, accountOrders: 6, rechargeOrders: 4, completedOrders: 7,
    totalSpent: 1688, invitedUsers: 2, totalRewards: 1.71,
  },
  invite: { code: "SHI-0001", link: "https://sukai.ai/login?invite=SHI-0001", rate: "好友每笔消费返佣 1%" },
  balanceRecords: [
    { id: "BAL-240914", title: "ChatGPT Plus 成品号", amount: -18, time: "2026-09-14 14:32", status: "交易完成" },
    { id: "BAL-240912", title: "邀请消费返佣", amount: 1.53, time: "2026-09-12 19:46", status: "已到账" },
    { id: "BAL-240910", title: "余额充值 · USDT", amount: 300, time: "2026-09-10 10:18", status: "已到账" },
  ],
  rechargeRecords: [
    { id: "RCG-240910", title: "余额充值 · USDT", amount: 300, time: "2026-09-10 10:18", status: "已到账" },
    { id: "RCG-240901", title: "余额充值 · USDT", amount: 500, time: "2026-09-01 09:05", status: "已到账" },
  ],
  walletRecords: [
    { id: "WAL-0914", time: "2026-09-14 14:32", type: "成品号消费", amount: -18, balance: 359.96, orderId: "M0202609140018", note: "订单金额已冻结" },
    { id: "WAL-0912", time: "2026-09-12 19:46", type: "邀请奖励", amount: 1.53, balance: 377.96, orderId: "D0202609120026", note: "好友消费返佣" },
    { id: "WAL-0910", time: "2026-09-10 10:18", type: "充值到账", amount: 300, balance: 376.43, orderId: "—", note: "TRC20 USDT" },
  ],
  topUpRecords: [
    { id: "R020260910001", amount: 300, method: "TRC20 USDT", status: "已完成", purpose: "钱包充值", orderId: "—", createdAt: "2026-09-10 10:02", completedAt: "2026-09-10 10:18" },
    { id: "R020260901004", amount: 500, method: "ERC20 USDT", status: "已完成", purpose: "钱包充值", orderId: "—", createdAt: "2026-09-01 08:51", completedAt: "2026-09-01 09:05" },
    { id: "R020260830012", amount: 100, method: "TRC20 USDT", status: "待支付", purpose: "钱包充值", orderId: "—", createdAt: "2026-08-30 12:20", completedAt: "—" },
  ],
  frozenRecords: [
    { id: "FRZ-0914", time: "2026-09-14 14:32", amount: 18, reason: "成品号订单冻结", orderId: "M0202609140018", status: "冻结中" },
    { id: "FRZ-0913", time: "2026-09-13 20:14", amount: 59.9, reason: "代充订单冻结", orderId: "D0202609130011", status: "冻结中" },
    { id: "FRZ-0908", time: "2026-09-08 11:20", amount: 19.9, reason: "订单资金解冻", orderId: "M0202609080009", status: "已释放" },
  ],
  orders: [
    { id: "M0202609140018", kind: "account", product: "ChatGPT Plus 菲区", snapshot: "独享成品号 · Plus · 菲区", amount: 18, status: "processing", statusLabel: "备货中", createdAt: "2026-09-14 14:32" },
    { id: "D0202609130011", kind: "recharge", product: "ChatGPT Pro 代充", snapshot: "Pro 套餐 · 1个月", amount: 59.9, quotedAmount: 59.9, chargedAmount: 59.9, status: "processing", statusLabel: "处理中", createdAt: "2026-09-13 20:14" },
    { id: "D0202609120026", kind: "recharge", product: "ChatGPT Go 菲区", snapshot: "Go 套餐 · 1个月", amount: 4.8, quotedAmount: 4.8, chargedAmount: 4.8, status: "completed", statusLabel: "成功", createdAt: "2026-09-12 19:46" },
    { id: "M0202609080009", kind: "account", product: "Claude Pro 成品号", snapshot: "独享成品号 · Pro", amount: 19.9, status: "completed", statusLabel: "已完成", createdAt: "2026-09-08 11:20" },
    { id: "M0202609030004", kind: "account", product: "ChatGPT Pro 成品号", snapshot: "独享成品号 · Pro", amount: 49.9, status: "pending", statusLabel: "待确认", createdAt: "2026-09-03 16:08" },
    { id: "D0202608290017", kind: "recharge", product: "ChatGPT Plus 代充", snapshot: "Plus 套餐 · 1个月", amount: 13.5, quotedAmount: 13.5, chargedAmount: 0, status: "failed", statusLabel: "失败", createdAt: "2026-08-29 09:35", failureReason: "上游下单失败：当前账号目标套餐有效期未到。" },
    { id: "M0202608200008", kind: "account", product: "Gemini Pro 成品号", snapshot: "独享成品号 · Pro", amount: 12.9, status: "completed", statusLabel: "已完成", createdAt: "2026-08-20 18:02" },
  ] satisfies DashboardOrder[],
  inviteTemplates: [
    { id: "friend", title: "给朋友", content: "AI 订阅官方直充，注册立享优惠：\nhttps://sukai.ai/login?invite=SHI-0001" },
    { id: "moments", title: "朋友圈", content: "推荐 SUKAI AI 服务：流程清晰、交付透明，注册还有优惠。" },
    { id: "short", title: "简单一句", content: "用我的邀请码 SHI-0001 注册，你我都有优惠。" },
  ],
  invitedUserRecords: [
    { id: "USR-0912", user: "L***@gmail.com", registeredAt: "2026-09-12 18:20", status: "已生效", spending: 153, reward: 1.53 },
    { id: "USR-0905", user: "M***@outlook.com", registeredAt: "2026-09-05 10:21", status: "已注册", spending: 18, reward: 0.18 },
  ],
  inviteRecords: [
    { id: "INV-0912", time: "2026-09-12 19:46", type: "消费返佣", amount: 1.53, orderId: "D0202609120026", note: "好友完成代充订单" },
    { id: "INV-0905", time: "2026-09-05 10:21", type: "注册奖励", amount: 0.18, orderId: "—", note: "好友完成注册" },
  ],
  exchangeRecords: [
    { id: "EXC-0828", time: "2026-08-28 16:20", points: 24, amount: 0.24, status: "已批准", note: "已兑换至平台余额" },
    { id: "EXC-0811", time: "2026-08-11 09:12", points: 100, amount: 1, status: "已批准", note: "已兑换至平台余额" },
  ],
};
