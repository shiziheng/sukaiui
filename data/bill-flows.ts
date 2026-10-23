/**
 * 平台账单 · Mock 数据
 *
 * - 账户账单页 = 平台余额的全部变动：平台充值、代充、成品号、退单·返佣、开卡扣费、卡充值、卡退款、销卡退款。
 * - 卡内消费不在其中，归「卡片 → 卡流水」。
 * - balanceAfter 按时间正序连续，最后一条等于账户当前可用余额（$359.96），账单页的期初/期末就靠它对账。
 *
 * 全部为前端演示数据，无真实资金变动。
 */

export type FlowStatus = "success" | "processing" | "failed";

/** 平台余额流水类型：与后台「账户流水」的卡相关类型对齐（开卡/卡充值/卡退款/销卡）。 */
export type PlatformFlowType = "topup" | "card_open" | "card_recharge" | "card_refund" | "card_close";

export type PlatformFlow = {
  id: string;
  time: string;
  type: PlatformFlowType;
  /** 正数入账、负数出账（美元）。 */
  amount: number;
  balanceAfter: number;
  note: string;
  status: FlowStatus;
};

export const platformFlowTypeLabel: Record<PlatformFlowType, string> = {
  topup: "平台充值",
  card_open: "开卡扣费",
  card_recharge: "卡充值",
  card_refund: "卡退款",
  card_close: "销卡退款",
};

export const defaultPlatformFlows: PlatformFlow[] = [
  { id: "PF-88120041", time: "2026-10-13 10:21:05", type: "topup", amount: 150, balanceAfter: 359.96, note: "TRC20 充值到账", status: "success" },
  { id: "PF-88120036", time: "2026-10-12 10:03:11", type: "card_recharge", amount: -50, balanceAfter: 168.46, note: "卡充值 · 尾号 7632", status: "success" },
  { id: "PF-88120030", time: "2026-10-12 09:53:40", type: "card_open", amount: -0.4, balanceAfter: 218.46, note: "开卡费 · BIN-537872 × 1 张", status: "success" },
  { id: "PF-88120024", time: "2026-10-11 20:15:02", type: "card_close", amount: 36.18, balanceAfter: 320.36, note: "销卡退款 · 尾号 9206", status: "success" },
  { id: "PF-88120018", time: "2026-10-11 09:47:33", type: "card_refund", amount: 20, balanceAfter: 239.18, note: "卡退款 · 尾号 1693", status: "success" },
  { id: "PF-88120009", time: "2026-10-10 12:31:20", type: "topup", amount: 100, balanceAfter: 219.18, note: "ERC20 充值到账", status: "success" },
  { id: "PF-88090112", time: "2026-09-08 09:12:30", type: "topup", amount: 200, balanceAfter: 279.18, note: "TRC20 充值到账", status: "success" },
];

/** 账户账单 · 平台其他流水类型。 */
export type BillFlowType = "recharge_service" | "account_service" | "commission";

export type BillFlowItem = {
  id: string;
  time: string;
  type: BillFlowType;
  title: string;
  /** 正数入账、负数出账（美元）。 */
  amount: number;
  balanceAfter: number;
  orderNo: string;
  status: FlowStatus;
};

export const billFlowTypeLabel: Record<BillFlowType, string> = {
  recharge_service: "代充流水",
  account_service: "成品号流水",
  commission: "退单/返佣",
};

export const defaultBillFlows: BillFlowItem[] = [
  { id: "BF-2026101301", time: "2026-10-13 09:40:12", type: "recharge_service", title: "ChatGPT Plus 套餐代充 · 1 个账号", amount: -25, balanceAfter: 209.96, orderNo: "RC-20261013-0082", status: "success" },
  { id: "BF-2026101302", time: "2026-10-13 08:12:44", type: "account_service", title: "成品号购买 · ChatGPT 成品号（年付）", amount: -128, balanceAfter: 234.96, orderNo: "AC-20261013-0031", status: "success" },
  { id: "BF-2026101205", time: "2026-10-12 22:05:19", type: "commission", title: "邀请返佣 · 好友充值返 3%", amount: 7.5, balanceAfter: 362.96, orderNo: "CM-20261012-0117", status: "success" },
  { id: "BF-2026101204", time: "2026-10-12 18:33:57", type: "recharge_service", title: "Claude Pro 套餐代充 · 2 个账号", amount: -46, balanceAfter: 355.46, orderNo: "RC-20261012-0155", status: "success" },
  { id: "BF-2026101203", time: "2026-10-12 15:21:08", type: "commission", title: "代充退单 · 商家超时未完成", amount: 23, balanceAfter: 401.46, orderNo: "RC-20261011-0093", status: "success" },
  { id: "BF-2026101202", time: "2026-10-12 11:02:31", type: "account_service", title: "成品号出售 · Claude 成品号（含余额）", amount: 210, balanceAfter: 378.46, orderNo: "AC-20261012-0007", status: "success" },
  { id: "BF-2026101201", time: "2026-10-12 09:15:40", type: "recharge_service", title: "Google One 代充 · 200GB 方案", amount: -12.5, balanceAfter: 218.86, orderNo: "RC-20261012-0041", status: "processing" },
  { id: "BF-2026101108", time: "2026-10-11 20:44:26", type: "account_service", title: "成品号购买 · Midjourney 成品号", amount: -89, balanceAfter: 231.36, orderNo: "AC-20261011-0066", status: "success" },
  { id: "BF-2026101107", time: "2026-10-11 14:37:52", type: "commission", title: "成品号售后赔付 · 登录异常", amount: 45, balanceAfter: 284.18, orderNo: "AC-20261010-0022", status: "success" },
  { id: "BF-2026092202", time: "2026-09-22 16:05:44", type: "account_service", title: "成品号购买 · Claude 成品号", amount: -100, balanceAfter: 119.18, orderNo: "AC-20260922-0012", status: "success" },
  { id: "BF-2026091503", time: "2026-09-15 14:30:08", type: "recharge_service", title: "ChatGPT Plus 套餐代充 · 1 个账号", amount: -60, balanceAfter: 219.18, orderNo: "RC-20260915-0031", status: "success" },
];
