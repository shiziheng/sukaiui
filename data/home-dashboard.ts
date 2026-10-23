export const homeDashboardCopy = {
  accountCategory: "服务分类 · 成品号",
  accountScenario: "我还没有账号",
  accountTags: ["ChatGPT / Claude", "菲区 / 美区 / 日区"],
  rechargeCategory: "服务分类 · 代充",
  rechargeScenario: "我已经有账号",
  rechargeTags: ["Plus / Pro / Max", "支持单账号与批量办理"],
  overviewEyebrow: "ACCOUNT OVERVIEW",
  overviewTitle: "账户概览",
  overviewDescription: "余额与订单状态快速查看。",
  trustItems: [
    { id: "regions", title: "多区域可选", description: "菲区、美区、日区等，以商品库存为准。", icon: "region" },
    { id: "tracking", title: "订单进度可查", description: "支付、处理与交付状态集中查看。", icon: "order" },
    { id: "payment", title: "灵活支付", description: "支持钱包余额及当前开放的支付方式。", icon: "payment" },
    { id: "support", title: "售后支持", description: "异常订单可从订单详情或客服入口处理。", icon: "support" },
  ],
} as const;

export const homeOpsCopy = {
  eyebrow: "OPERATIONS CENTER",
  title: "数据总览",
  subtitle: "账号、代充与虚拟卡业务的实时经营数据，每 5 分钟自动更新。",
  monthCaption: "10 月 01 日 - 10 月 20 日",
  updatedPrefix: "最后更新",
  refresh: "刷新数据",
  rangeLabel: "统计范围",
  ranges: [
    { id: "today", label: "今日" },
    { id: "week", label: "近 7 天" },
    { id: "month", label: "近 30 天" },
  ],
  openRecharge: "去充值",
  kpi: {
    monthSpend: { label: "本月消费金额", hint: "成功与失败订单合计", note: "较上月同期" },
    todaySuccess: { label: "今日成功金额", hint: "完成支付并已交付的订单" },
    todayFailed: { label: "今日失败金额", hint: "支付失败或交付失败的订单" },
    chargebackRate: { label: "拒付率", hint: "失败订单 ÷ 总订单，占比变动按日统计" },
  },
  trendTitle: "消费金额趋势",
  trendHint: "按日聚合，单位 USD",
  compareTitle: "充值 / 消费对比",
  compareHint: "近 7 天资金流向，单位 USD",
  opsTitle: "运营",
  opsHint: "虚拟卡业务实时指标",
  statusTitle: "订单状态",
  statusHint: "全部订单的最终状态分布",
  liveTitle: "实时交易动态",
  liveHint: "最近 8 笔交易",
  liveAll: "查看交易记录",
  quickTitle: "快捷入口",
  quickHint: "常用业务与账户入口",
  serviceTitle: "邀请与客服",
  inviteTitle: "邀请好友",
  inviteHint: "好友每笔消费返佣 1%",
  inviteCode: "邀请码",
  invitedUsers: "已邀请",
  invitedRewards: "累计奖励",
  supportTitle: "客服信息",
  supportHours: "在线时间",
  supportHoursValue: "09:00 - 24:00（UTC+8）",
  supportReply: "平均响应",
  supportReplyValue: "3 分钟内",
  supportAction: "联系在线客服",
} as const;

export type DashboardRange = "today" | "week" | "month";
export type HomeOpsTone = "success" | "danger" | "warning" | "neutral";

export type TrendPoint = { label: string; value: number };
export type ComparePoint = { label: string; recharge: number; spend: number };
export type OpsMetric = { id: string; label: string; value: string; unit?: string; note?: string; tone?: HomeOpsTone; strong?: boolean };
export type OrderStatusItem = { id: string; label: string; count: string; amount: string; percent: number; tone: HomeOpsTone };
export type LiveTransaction = {
  id: string;
  kind: "消费" | "充值" | "退款" | "拒付";
  title: string;
  ref: string;
  time: string;
  amount: string;
  positive?: boolean;
  tone: HomeOpsTone;
};

const spendTrend30: TrendPoint[] = [
  { label: "09/21", value: 1180 },
  { label: "09/22", value: 960 },
  { label: "09/23", value: 1420 },
  { label: "09/24", value: 1080 },
  { label: "09/25", value: 1560 },
  { label: "09/26", value: 1240 },
  { label: "09/27", value: 1680 },
  { label: "09/28", value: 1320 },
  { label: "09/29", value: 1490 },
  { label: "09/30", value: 1120 },
  { label: "10/01", value: 1180 },
  { label: "10/02", value: 980 },
  { label: "10/03", value: 1320 },
  { label: "10/04", value: 1120 },
  { label: "10/05", value: 1400 },
  { label: "10/06", value: 1180 },
  { label: "10/07", value: 1420 },
  { label: "10/08", value: 1300 },
  { label: "10/09", value: 1280 },
  { label: "10/10", value: 1360 },
  { label: "10/11", value: 1500 },
  { label: "10/12", value: 1480 },
  { label: "10/13", value: 1460 },
  { label: "10/14", value: 1180 },
  { label: "10/15", value: 1320 },
  { label: "10/16", value: 1260 },
  { label: "10/17", value: 1540 },
  { label: "10/18", value: 1660 },
  { label: "10/19", value: 1720 },
  { label: "10/20", value: 2186 },
];

/**
 * 首页「消费趋势」用单账户口径，和 accountDashboardMock 的累计消费（约 $1,688）对得上。
 * 运营大盘的 homeOpsMock.trend 是平台级金额，放在个人首页会跟「累计订单 10 笔」打架。
 */
const personalSpend30: TrendPoint[] = [
  { label: "09/21", value: 42 }, { label: "09/22", value: 38 }, { label: "09/23", value: 55 },
  { label: "09/24", value: 60 }, { label: "09/25", value: 47 }, { label: "09/26", value: 52 },
  { label: "09/27", value: 66 }, { label: "09/28", value: 58 }, { label: "09/29", value: 44 },
  { label: "09/30", value: 71 }, { label: "10/01", value: 63 }, { label: "10/02", value: 49 },
  { label: "10/03", value: 57 }, { label: "10/04", value: 82 }, { label: "10/05", value: 68 },
  { label: "10/06", value: 54 }, { label: "10/07", value: 46 }, { label: "10/08", value: 61 },
  { label: "10/09", value: 73 }, { label: "10/10", value: 59 }, { label: "10/11", value: 48 },
  { label: "10/12", value: 65 }, { label: "10/13", value: 77 }, { label: "10/14", value: 56 },
  { label: "10/15", value: 43 }, { label: "10/16", value: 69 }, { label: "10/17", value: 58 },
  { label: "10/18", value: 52 }, { label: "10/19", value: 64 }, { label: "10/20", value: 77.9 },
];

export const personalSpendTrend: Record<DashboardRange, TrendPoint[]> = {
  month: personalSpend30,
  week: personalSpend30.slice(-7),
  today: [
    { label: "00:00", value: 3 },
    { label: "03:00", value: 6 },
    { label: "06:00", value: 9 },
    { label: "09:00", value: 12 },
    { label: "12:00", value: 18 },
    { label: "15:00", value: 21 },
    { label: "18:00", value: 8.9 },
  ],
};

export const homeOpsMock = {
  updatedAt: "10:42",
  kpi: {
    monthSpend: { amount: 28496.8, delta: 18.6, caption: "10 月 01 日 - 10 月 20 日" },
    todaySuccess: { amount: 2186.4, count: 186, delta: 12.4 },
    todayFailed: { amount: 186.4, count: 7, delta: -22.8 },
    chargebackRate: { value: 1.84, delta: -0.42, failed: 7, total: 381 },
  },
  trend: {
    month: spendTrend30,
    week: spendTrend30.slice(-7).map((point) => ({ label: point.label, value: point.value })),
    today: [
      { label: "00:00", value: 96 },
      { label: "03:00", value: 142 },
      { label: "06:00", value: 268 },
      { label: "09:00", value: 486 },
      { label: "12:00", value: 612 },
      { label: "15:00", value: 398 },
      { label: "18:00", value: 184 },
    ],
  } as Record<DashboardRange, TrendPoint[]>,
  compare: [
    { label: "10/14", recharge: 2380, spend: 1590 },
    { label: "10/15", recharge: 1980, spend: 1740 },
    { label: "10/16", recharge: 2640, spend: 1820 },
    { label: "10/17", recharge: 2210, spend: 1760 },
    { label: "10/18", recharge: 3120, spend: 1890 },
    { label: "10/19", recharge: 2450, spend: 2010 },
    { label: "10/20", recharge: 2860, spend: 2186 },
  ] satisfies ComparePoint[],
  operations: [
    { id: "active-cards", label: "已激活卡片", value: "428", unit: "张" },
    { id: "today-chargeback", label: "今日拒付订单", value: "8", unit: "笔", tone: "danger" },
    { id: "today-refund", label: "今日退款订单", value: "6", unit: "笔", tone: "warning" },
    { id: "card-balance", label: "卡余额", value: "8,426.90", unit: "USD", strong: true },
    { id: "total-chargeback", label: "累计拒付订单", value: "61", unit: "笔", note: "占比 1.81%" },
    { id: "total-refund", label: "累计退款订单", value: "43", unit: "笔", note: "占比 1.28%" },
  ] satisfies OpsMetric[],
  orderStatus: [
    { id: "success", label: "成功", count: "3,250 笔", amount: "$28,496.80", percent: 96.4, tone: "success" },
    { id: "chargeback", label: "拒付", count: "61 笔", amount: "$1,286.40", percent: 1.81, tone: "danger" },
    { id: "refund", label: "退款", count: "43 笔", amount: "$742.60", percent: 1.28, tone: "warning" },
  ] satisfies OrderStatusItem[],
  live: [
    { id: "t1", kind: "消费", title: "Claude Pro 代充 · 1 个月", ref: "D20261020018", time: "2 分钟前", amount: "-$19.90", tone: "success" },
    { id: "t2", kind: "消费", title: "ChatGPT Plus 成品号 · 菲区", ref: "M20261020017", time: "5 分钟前", amount: "-$18.00", tone: "success" },
    { id: "t3", kind: "充值", title: "钱包充值 · TRC20 USDT", ref: "R20261020009", time: "11 分钟前", amount: "+$500.00", positive: true, tone: "success" },
    { id: "t4", kind: "拒付", title: "ChatGPT Pro 代充 · 1 个月", ref: "D20261020016", time: "18 分钟前", amount: "-$59.90", tone: "danger" },
    { id: "t5", kind: "退款", title: "Claude Max 成品号", ref: "M20261020015", time: "26 分钟前", amount: "+$49.90", positive: true, tone: "warning" },
    { id: "t6", kind: "消费", title: "虚拟卡开卡 · Visa", ref: "C20261020004", time: "34 分钟前", amount: "-$2.00", tone: "success" },
    { id: "t7", kind: "消费", title: "ChatGPT Go 代充 · 1 个月", ref: "D20261020014", time: "41 分钟前", amount: "-$4.80", tone: "success" },
    { id: "t8", kind: "充值", title: "钱包充值 · ERC20 USDT", ref: "R20261020008", time: "58 分钟前", amount: "+$300.00", positive: true, tone: "success" },
  ] satisfies LiveTransaction[],
};
