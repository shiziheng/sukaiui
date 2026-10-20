/**
 * 虚拟卡业务 · Mock 数据与类型
 *
 * 业务链路：平台余额 → 开卡（按卡段收费）→ 卡内余额（从平台余额划转）→ 消费。
 * 全部为前端演示数据，无真实上游发卡、无真实扣款。
 *
 * 与知识库对应：卡段 CardBin / 卡片 Card / 流水 Bill / 费率 FeePackage。
 */

export type CardScheme = "visa" | "mastercard" | "discover";
export type CardRegion = "us" | "hk";
/** 与知识库 04 一致：处理中 / 正常 / 冻结（人工）/ 系统冻结（上游或风控）。 */
export type CardStatus = "processing" | "active" | "frozen" | "system_frozen";
/**
 * 卡流水类型（扣费类型口径）：
 * - recharge 充值：平台余额 → 卡余额（入）
 * - consume 消费：卡余额 → 商户（出，扣费主体）
 * - refund 消费退款：商户 → 卡余额（入，上游原路退回）
 * - cashout 转出至平台：卡余额 → 平台余额（出，即"卡退款"动作）
 * - fee 手续费：卡余额扣费（费用外扣模式下常态为 0，类型预留）
 */
export type CardFlowType = "recharge" | "consume" | "refund" | "cashout" | "fee";
export type CardFlowStatus = "success" | "processing" | "failed";

/** 卡段（卡 BIN）：开卡的库存与费率来源。 */
export type CardBinSubscriptionPrice = {
  /** 档位名，如 Plus / 5x / 20x。 */
  label: string;
  price: number;
  /** 快照日期（MM-DD）。 */
  date: string;
};

export type CardBin = {
  id: string;
  bin: string;
  scheme: CardScheme;
  region: CardRegion;
  cardType: string;
  scenes: string[];
  restrictions: string[];
  /** 开卡费（$/张），从平台余额扣除。 */
  openFee: number;
  /** 充值手续费（%），卡片充值按比例收取。 */
  rechargeFeePercent: number;
  /** 消费费率（固定 + 百分比），用于消费结算。 */
  consumeFee: { fixed: number; percent: number };
  /** 可开张数上限；剩余可开 = 上限 − 已持有张数。 */
  stock: number;
  recommended?: boolean;
  /** 小额消费费阈值（$）：低于该金额的按笔收 consumeFee.fixed，否则免。 */
  smallAmountFeeThreshold?: number;
  /** 上游产品码（开卡弹窗透出，mock）。 */
  upstreamProduct?: string;
  /** AI 订阅价格快照（取最近一次抓取），无则不展示。 */
  subscriptionPrices?: CardBinSubscriptionPrice[];
};

/** 开卡时随机持卡人名字池。 */
export const cardHolderPool = [
  "Ava Johnson", "Robert Clark", "Mia Chen", "Lucas Wright",
  "Emma Davis", "Noah Smith", "Olivia Brown", "Ethan Wilson",
  "Sophia Taylor", "Daniel Martinez", "Charlotte Lee", "Henry Zhao",
] as const;

export const randomCardHolder = () => cardHolderPool[Math.floor(Math.random() * cardHolderPool.length)];

/**
 * 开卡弹窗「完整费率标准」行——费项后台配置，前端按固定七项展示（顺序即展示顺序）。
 * 账单项（ARF/RTF/FTF/MTF/DIF）从卡内余额扣收；开卡费、卡片充值费从平台余额额外扣（费用外扣）。
 * 小额管理费（MTF）与卡段自身的小额消费费规则联动。
 */
export type CardFeeScheduleRow = { label: string; code?: string; value: string };

export function cardFeeSchedule(bin: CardBin): CardFeeScheduleRow[] {
  return [
    { label: "账单撤销费", code: "ARF", value: "1%" },
    { label: "账单退款手续费", code: "RTF", value: "1%" },
    { label: "跨境手续费", code: "FTF", value: "$0" },
    {
      label: "小额管理费",
      code: "MTF",
      value: bin.consumeFee.fixed > 0
        ? `$${bin.consumeFee.fixed.toFixed(2)}/笔${bin.smallAmountFeeThreshold ? `（低于 $${bin.smallAmountFeeThreshold.toFixed(2)}）` : ""}`
        : "$0",
    },
    { label: "拒付费", code: "DIF", value: "$0.30" },
    { label: "开卡费", value: `$${bin.openFee.toFixed(2)}/张` },
    { label: "卡片充值费", value: `${bin.rechargeFeePercent}%` },
  ];
}

export type BillingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type VirtualCard = {
  id: string;
  cardNo: string;
  binId: string;
  bin: string;
  scheme: CardScheme;
  region: CardRegion;
  holder: string;
  expMonth: number;
  expYear: number;
  cvv: string;
  balance: number;
  currency: "USD";
  status: CardStatus;
  createdAt: string;
  remark: string;
  /** 系统备注：上游/风控写入的说明（Mock 字段，正式环境需后台接口）。 */
  systemRemark?: string;
  /** 订阅更新快照：这张卡最近的订阅扣费计划（Mock 字段，正式环境需上游查询接口）。 */
  subscriptionUpdates?: CardSubscriptionUpdate[];
  billingAddress: BillingAddress;
};

/** 订阅更新快照单条：某订阅计划最近一次扣费。 */
export type CardSubscriptionUpdate = {
  brand: string;
  plan: string;
  amount: number;
  time: string;
};

/** 卡流水：一张卡上的余额变动（充值 / 消费 / 退款 / 手续费）。 */
export type CardFlowItem = {
  id: string;
  cardId: string;
  time: string;
  type: CardFlowType;
  /** 正数入账、负数出账。 */
  amount: number;
  balanceAfter: number;
  merchant: string;
  /** 消费类流水才有：交易金额 / 结算金额（含手续费）。 */
  tradeAmount?: number;
  settleAmount?: number;
  status: CardFlowStatus;
  txNo: string;
};

/* ------------------------------------------------------------------ */
/* 文案与格式化                                                        */
/* ------------------------------------------------------------------ */

const schemeNames: Record<CardScheme, string> = {
  visa: "Visa",
  mastercard: "MasterCard",
  discover: "Discover",
};

const regionNames: Record<CardRegion, string> = {
  us: "美国",
  hk: "中国香港",
};

export function schemeLabel(scheme: CardScheme) {
  return schemeNames[scheme];
}

export function regionLabel(region: CardRegion) {
  return regionNames[region];
}

export function binTitle(bin: { bin: string }) {
  return `卡BIN-${bin.bin}`;
}

export function money(value: number, digits = 2) {
  return `$${value.toFixed(digits)}`;
}

export function formatCardNumber(cardNo: string) {
  return cardNo.replace(/(.{4})/g, "$1 ").trim();
}

/** 列表场景默认脱敏：只保留前 4 位与后 4 位。 */
export function maskCardNumber(cardNo: string) {
  const grouped = formatCardNumber(cardNo).split(" ");
  if (grouped.length < 4) return formatCardNumber(cardNo);
  return `${grouped[0]} •••• •••• ${grouped[grouped.length - 1]}`;
}

export function cardTail(cardNo: string) {
  return cardNo.slice(-4);
}

export const cardStatusMeta: Record<CardStatus, { label: string; tone: "completed" | "processing" | "pending" | "failed" }> = {
  processing: { label: "开卡中", tone: "processing" },
  active: { label: "已激活", tone: "completed" },
  frozen: { label: "已冻结", tone: "pending" },
  system_frozen: { label: "系统冻结", tone: "failed" },
};

export const cardFlowTypeLabel: Record<CardFlowType, string> = {
  recharge: "充值",
  consume: "消费",
  refund: "消费退款",
  cashout: "转出至平台",
  fee: "手续费",
};

export const cardFlowStatusLabel: Record<CardFlowStatus, string> = {
  success: "消费完成",
  processing: "处理中",
  failed: "失败",
};

/** 卡段剩余的评估口径：可开上限 − 已持有张数。 */
export function remainingStock(bin: CardBin, owned: number) {
  return Math.max(0, bin.stock - owned);
}

/** 全部卡段加总的剩余可开张数（开卡中心顶部展示）。 */
export function totalRemainingStock(bins: CardBin[], ownedCounts: Record<string, number>) {
  return bins.reduce((sum, bin) => sum + remainingStock(bin, ownedCounts[bin.id] ?? 0), 0);
}

/** 前端 Demo 的 CSV 导出：生成文件并触发下载。 */
export function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = "\uFEFF" + [header, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Mock：卡段                                                            */
/* ------------------------------------------------------------------ */

export const defaultCardBins: CardBin[] = [
  {
    id: "bin-537872", bin: "537872", scheme: "mastercard", region: "us", cardType: "通用卡",
    scenes: ["OpenAI · ChatGPT 订阅", "常规线上消费"], restrictions: [],
    openFee: 0.1, rechargeFeePercent: 0, consumeFee: { fixed: 0, percent: 0 }, stock: 500, recommended: true,
    upstreamProduct: "HNMQPO",
    subscriptionPrices: [
      { label: "Plus", price: 15.63, date: "10-19" },
      { label: "5x", price: 92.17, date: "10-19" },
      { label: "20x", price: 141.71, date: "10-08" },
    ],
  },
  {
    id: "bin-486555", bin: "486555", scheme: "visa", region: "us", cardType: "常规卡",
    scenes: ["OpenAI · ChatGPT 订阅"], restrictions: ["禁止 Claude 相关消费"],
    openFee: 0.4, rechargeFeePercent: 0, consumeFee: { fixed: 0, percent: 0 }, stock: 300,
    upstreamProduct: "VQ8T2K",
    subscriptionPrices: [
      { label: "Plus", price: 15.63, date: "10-17" },
      { label: "5x", price: 92.17, date: "10-09" },
    ],
  },
  {
    id: "bin-446602", bin: "446602", scheme: "visa", region: "us", cardType: "常规卡",
    scenes: ["OpenAI · ChatGPT 订阅"], restrictions: ["禁止 Claude 相关消费"],
    openFee: 0.4, rechargeFeePercent: 0, consumeFee: { fixed: 0, percent: 0 }, stock: 260,
    upstreamProduct: "VQ3M7D",
  },
  {
    id: "bin-428852", bin: "428852", scheme: "visa", region: "us", cardType: "常规卡",
    scenes: ["AI 订阅", "广告投放", "通用消费"], restrictions: [],
    openFee: 0.4, rechargeFeePercent: 0, consumeFee: { fixed: 0, percent: 0 }, stock: 120,
    upstreamProduct: "VQ9X4L",
  },
  {
    id: "bin-474613", bin: "474613", scheme: "visa", region: "us", cardType: "申请制专用卡",
    scenes: ["通用消费"], restrictions: ["可充 Claude，但不建议开通 GPT Pro", "退款将封卡，请谨慎操作"],
    openFee: 0.4, rechargeFeePercent: 0, consumeFee: { fixed: 0.4, percent: 0 }, stock: 80,
    upstreamProduct: "VQ5C8N",
    smallAmountFeeThreshold: 50,
  },
  {
    id: "bin-4416405", bin: "4416405", scheme: "visa", region: "us", cardType: "申请制专用卡",
    scenes: ["AI 订阅", "广告投放", "通用消费"], restrictions: ["禁止 Claude 相关消费"],
    openFee: 0.4, rechargeFeePercent: 0, consumeFee: { fixed: 0, percent: 0 }, stock: 60,
    upstreamProduct: "VQ2K6P",
  },
  {
    id: "bin-545020", bin: "545020", scheme: "mastercard", region: "hk", cardType: "香港常规卡",
    scenes: ["谷歌等线上消费", "广告投放"], restrictions: ["取消订阅可能触发冻结，请按需充值"],
    openFee: 0.2, rechargeFeePercent: 0, consumeFee: { fixed: 0, percent: 0 }, stock: 400,
    upstreamProduct: "MC7R3S",
  },
  {
    id: "bin-558325", bin: "558325", scheme: "mastercard", region: "hk", cardType: "香港常规卡",
    scenes: ["谷歌等线上消费", "广告投放"], restrictions: ["取消订阅可能触发冻结，请按需充值"],
    openFee: 0.2, rechargeFeePercent: 0, consumeFee: { fixed: 0, percent: 0 }, stock: 350,
    upstreamProduct: "MC4W9T",
  },
];

/* ------------------------------------------------------------------ */
/* Mock：卡片                                                            */
/* ------------------------------------------------------------------ */

const defaultBilling: BillingAddress = {
  line1: "Street -",
  city: "City -",
  state: "State -",
  zip: "Zip Code -",
  country: "United States",
};

export const defaultVirtualCards: VirtualCard[] = [
  {
    id: "VC-20261012001", cardNo: "5556597907237632", binId: "bin-537872", bin: "537872",
    scheme: "mastercard", region: "us", holder: "Ava Johnson", expMonth: 10, expYear: 28, cvv: "431",
    balance: 150, currency: "USD", status: "active", createdAt: "2026-10-12 09:53:13",
    remark: "OpenAI 订阅专用", billingAddress: defaultBilling,
    subscriptionUpdates: [
      { brand: "OpenAI", plan: "Plus", amount: 15.63, time: "2026-10-13 09:31" },
      { brand: "OpenAI", plan: "Pro 5x", amount: 92.14, time: "2026-10-13 09:12" },
      { brand: "OpenAI", plan: "Pro 20x", amount: 141.84, time: "2026-10-12 22:40" },
    ],
  },
  {
    id: "VC-20261012007", cardNo: "5556597907160727", binId: "bin-537872", bin: "537872",
    scheme: "mastercard", region: "us", holder: "Ava Johnson", expMonth: 10, expYear: 28, cvv: "512",
    balance: 56.11, currency: "USD", status: "active", createdAt: "2026-10-12 10:02:20",
    remark: "", billingAddress: defaultBilling,
  },
  {
    id: "VC-20261011012", cardNo: "5450201099209206", binId: "bin-545020", bin: "545020",
    scheme: "mastercard", region: "hk", holder: "Ava Johnson", expMonth: 10, expYear: 28, cvv: "733",
    balance: 36.18, currency: "USD", status: "active", createdAt: "2026-10-11 20:14:02",
    remark: "谷歌广告投放", systemRemark: "广告类商户风控观察中", billingAddress: { ...defaultBilling, country: "Hong Kong, China" },
  },
  {
    id: "VC-20261010009", cardNo: "4865557007891693", binId: "bin-486555", bin: "486555",
    scheme: "visa", region: "us", holder: "Ava Johnson", expMonth: 10, expYear: 28, cvv: "219",
    balance: 128.62, currency: "USD", status: "frozen", createdAt: "2026-10-10 12:30:44",
    remark: "手动冻结，待排查异常消费", billingAddress: defaultBilling,
  },
  {
    id: "VC-20261009004", cardNo: "4466027004132943", binId: "bin-446602", bin: "446602",
    scheme: "visa", region: "us", holder: "Ava Johnson", expMonth: 10, expYear: 28, cvv: "884",
    balance: 44.07, currency: "USD", status: "system_frozen", createdAt: "2026-10-09 15:22:10",
    remark: "上游风控触发，请联系客服", billingAddress: defaultBilling,
  },
  {
    id: "VC-20261013002", cardNo: "4416405011228890", binId: "bin-4416405", bin: "4416405",
    scheme: "visa", region: "us", holder: "Ava Johnson", expMonth: 10, expYear: 28, cvv: "601",
    balance: 0, currency: "USD", status: "processing", createdAt: "2026-10-13 09:12:33",
    remark: "上游发卡处理中", billingAddress: defaultBilling,
  },
];

/* ------------------------------------------------------------------ */
/* Mock：卡流水                                                          */
/* ------------------------------------------------------------------ */

export const defaultCardFlows: CardFlowItem[] = [
  // VC-…001
  { id: "CF-1069447121", cardId: "VC-20261012001", time: "2026-10-13 09:31:10", type: "consume", amount: -12.53, balanceAfter: 150, merchant: "OpenAI · ChatGPT 订阅", tradeAmount: 12.53, settleAmount: 12.53, status: "success", txNo: "1069447121" },
  { id: "CF-1069447106", cardId: "VC-20261012001", time: "2026-10-13 09:12:43", type: "consume", amount: -6, balanceAfter: 162.53, merchant: "OpenAI · ChatGPT 订阅", tradeAmount: 6, settleAmount: 6, status: "success", txNo: "1069447106" },
  { id: "CF-1069447106-R", cardId: "VC-20261012001", time: "2026-10-13 11:02:18", type: "refund", amount: 6, balanceAfter: 156, merchant: "OpenAI · ChatGPT 订阅（原路退回）", status: "success", txNo: "1069447106R" },
  { id: "CF-KC-000018", cardId: "VC-20261012001", time: "2026-10-12 10:19:21", type: "recharge", amount: 50, balanceAfter: 168.53, merchant: "平台余额划转", status: "success", txNo: "—" },
  { id: "CF-1069441487", cardId: "VC-20261012001", time: "2026-10-12 09:55:41", type: "consume", amount: -1.47, balanceAfter: 118.53, merchant: "OpenAI", tradeAmount: 1.47, settleAmount: 1.47, status: "success", txNo: "1069441487" },
  { id: "CF-KC-000001", cardId: "VC-20261012001", time: "2026-10-12 09:53:13", type: "recharge", amount: 120, balanceAfter: 120, merchant: "开卡初始充值", status: "success", txNo: "—" },

  // VC-…007
  { id: "CF-1069435482", cardId: "VC-20261012007", time: "2026-10-13 08:04:12", type: "consume", amount: -3.9, balanceAfter: 56.11, merchant: "OpenAI · ChatGPT 订阅", tradeAmount: 3.9, settleAmount: 3.9, status: "success", txNo: "1069435482" },
  { id: "CF-1069433476", cardId: "VC-20261012007", time: "2026-10-12 22:36:55", type: "consume", amount: -9.99, balanceAfter: 60.01, merchant: "OpenAI · ChatGPT 订阅", tradeAmount: 9.99, settleAmount: 9.99, status: "success", txNo: "1069433476" },
  { id: "CF-KC-000090", cardId: "VC-20261012007", time: "2026-10-12 23:20:08", type: "cashout", amount: -20, balanceAfter: 70.01, merchant: "转出至平台余额", status: "success", txNo: "—" },
  { id: "CF-KC-000009", cardId: "VC-20261012007", time: "2026-10-12 10:02:20", type: "recharge", amount: 70, balanceAfter: 70, merchant: "开卡初始充值", status: "success", txNo: "—" },

  // VC-…012（中国香港卡）
  { id: "CF-1069421980", cardId: "VC-20261011012", time: "2026-10-13 07:22:31", type: "consume", amount: -8.42, balanceAfter: 36.18, merchant: "Google Ads", tradeAmount: 8.42, settleAmount: 8.42, status: "success", txNo: "1069421980" },
  { id: "CF-1069411764", cardId: "VC-20261011012", time: "2026-10-12 21:10:02", type: "consume", amount: -5.4, balanceAfter: 44.6, merchant: "Google Ads", tradeAmount: 5.4, settleAmount: 5.4, status: "processing", txNo: "1069411764" },
  { id: "CF-KC-000031", cardId: "VC-20261011012", time: "2026-10-11 20:14:02", type: "recharge", amount: 50, balanceAfter: 50, merchant: "开卡初始充值", status: "success", txNo: "—" },

  // VC-…009（已冻结）
  { id: "CF-1069409871", cardId: "VC-20261010009", time: "2026-10-13 03:00:44", type: "consume", amount: -3.69, balanceAfter: 128.62, merchant: "OpenAI · ChatGPT 订阅", tradeAmount: 3.69, settleAmount: 3.69, status: "success", txNo: "1069409871" },
  { id: "CF-1069403210", cardId: "VC-20261010009", time: "2026-10-12 23:45:37", type: "consume", amount: -12, balanceAfter: 132.31, merchant: "OpenAI · ChatGPT 订阅", tradeAmount: 12, settleAmount: 12, status: "success", txNo: "1069403210" },
  { id: "CF-1069398746", cardId: "VC-20261010009", time: "2026-10-12 09:33:33", type: "consume", amount: -15.69, balanceAfter: 144.31, merchant: "OpenAI · ChatGPT 订阅", tradeAmount: 15.69, settleAmount: 15.69, status: "success", txNo: "1069398746" },
  { id: "CF-KC-000044", cardId: "VC-20261010009", time: "2026-10-10 12:30:44", type: "recharge", amount: 160, balanceAfter: 160, merchant: "开卡初始充值", status: "success", txNo: "—" },

  // VC-…004（系统冻结）
  { id: "CF-1069392430", cardId: "VC-20261009004", time: "2026-10-12 09:44:39", type: "consume", amount: -14.44, balanceAfter: 44.07, merchant: "OpenAI · ChatGPT 订阅", tradeAmount: 14.44, settleAmount: 14.44, status: "success", txNo: "1069392430" },
  { id: "CF-1069387762", cardId: "VC-20261009004", time: "2026-10-12 00:29:20", type: "consume", amount: -19, balanceAfter: 58.51, merchant: "OpenAI · ChatGPT 订阅", tradeAmount: 19, settleAmount: 19, status: "failed", txNo: "1069387762" },
  { id: "CF-KC-000058", cardId: "VC-20261009004", time: "2026-10-09 15:22:10", type: "recharge", amount: 77.51, balanceAfter: 77.51, merchant: "开卡初始充值", status: "success", txNo: "—" },
];

/** 卡片财务口径：从流水聚合，避免展示值与流水对不上。口径详见回复与功能文档（待审核）。 */
export function buildCardFinance(card: VirtualCard, flows: CardFlowItem[]) {
  const own = flows.filter((flow) => flow.cardId === card.id);
  const consumed = own.filter((flow) => flow.type === "consume");
  // 消费只计成功与处理中（失败不占用余额）；退款/转出只计成功。
  const rechargeTotal = own.filter((f) => f.type === "recharge").reduce((sum, f) => sum + f.amount, 0);
  const consumeTotal = consumed
    .filter((f) => f.status === "success" || f.status === "processing")
    .reduce((sum, f) => sum + Math.abs(f.amount), 0);
  const refundTotal = own.filter((f) => f.type === "refund" && f.status === "success").reduce((sum, f) => sum + f.amount, 0);
  const cashoutTotal = own.filter((f) => f.type === "cashout" && f.status === "success").reduce((sum, f) => sum + Math.abs(f.amount), 0);
  const feeTotal = own.filter((f) => f.type === "fee").reduce((sum, f) => sum + Math.abs(f.amount), 0);
  const doneCount = consumed.filter((f) => f.status === "success").length;
  const failedCount = consumed.filter((f) => f.status === "failed").length;
  const settledCount = doneCount + failedCount;
  return {
    balance: card.balance,
    rechargeTotal,
    consumeTotal,
    refundTotal,
    cashoutTotal,
    feeTotal,
    consumeCount: consumed.length,
    doneCount,
    failedCount,
    successRate: settledCount ? Math.round((doneCount / settledCount) * 100) : 100,
    asOf: own.reduce<string>((latest, f) => (f.time > latest ? f.time : latest), ""),
  };
}
