export type HelpCategoryIcon = "package" | "zap" | "order" | "wallet" | "shield" | "support";

export type HelpCategory = {
  id: string;
  name: string;
  description: string;
  icon: HelpCategoryIcon;
  order: number;
  enabled: boolean;
};

export type HelpContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "notice"; tone: "info" | "warning"; text: string };

export type HelpArticle = {
  id: string;
  slug: string;
  categoryId: string;
  title: string;
  summary: string;
  readingTime: string;
  updatedAt: string;
  keywords: string[];
  blocks: HelpContentBlock[];
  order: number;
  enabled: boolean;
  featured?: boolean;
};

export const helpCategories: HelpCategory[] = [
  { id: "accounts", name: "购买账号", description: "账号选择、区域与交付说明", icon: "package", order: 1, enabled: true },
  { id: "recharge", name: "套餐升级", description: "已有账号的套餐办理指南", icon: "zap", order: 2, enabled: true },
  { id: "orders", name: "支付与订单", description: "支付方式与订单状态查询", icon: "order", order: 3, enabled: true },
  { id: "wallet", name: "钱包与充值", description: "余额充值与资金记录", icon: "wallet", order: 4, enabled: true },
  { id: "security", name: "账号与安全", description: "账号信息和安全注意事项", icon: "shield", order: 5, enabled: true },
  { id: "support", name: "售后帮助", description: "售后范围与客服联系方式", icon: "support", order: 6, enabled: true },
];

export const helpArticles: HelpArticle[] = [
  {
    id: "help-no-account", slug: "choose-service-without-account", categoryId: "accounts",
    title: "我没有账号，应该选择什么服务？", summary: "了解购买账号与套餐升级的区别，快速选择正确入口。",
    readingTime: "约 1 分钟", updatedAt: "2026-09-17", keywords: ["没有账号", "成品号", "购买账号", "ChatGPT", "Claude"], order: 1, enabled: true, featured: true,
    blocks: [
      { type: "paragraph", text: "如果你还没有可用的 ChatGPT 或 Claude 账号，请选择“购买账号”。该入口展示当前可售的品牌、套餐、区域和库存。" },
      { type: "heading", text: "如何选择" },
      { type: "list", items: ["先选择 ChatGPT 或 Claude", "查看商品套餐与可售区域", "确认商品说明、库存和售后范围", "完成购买后在“我的订单”查看交付信息"] },
      { type: "notice", tone: "info", text: "“成品号”是平台内部的服务分类，表示已经配置完成并按商品说明交付的账号商品。" },
    ],
  },
  {
    id: "help-account-region", slug: "account-regions", categoryId: "accounts",
    title: "ChatGPT / Claude 账号有哪些区域？", summary: "查看菲区、美区、日区等账号区域的选择说明。",
    readingTime: "约 1 分钟", updatedAt: "2026-09-17", keywords: ["区域", "菲区", "美区", "日区"], order: 2, enabled: true, featured: true,
    blocks: [
      { type: "paragraph", text: "当前页面会根据实际上架情况展示菲区、美区、日区等账号商品。不同时间的可售区域和库存可能不同。" },
      { type: "list", items: ["进入“购买账号”页面", "选择 ChatGPT 或 Claude", "查看商品名称、标签和区域说明", "以下单时显示的商品信息为准"] },
      { type: "notice", tone: "warning", text: "区域仅用于说明商品属性，不代表固定库存、固定价格或额外权益。" },
    ],
  },
  {
    id: "help-delivery", slug: "view-account-delivery", categoryId: "accounts",
    title: "购买后在哪里查看交付信息？", summary: "完成购买后，在订单详情中查看账号交付状态。",
    readingTime: "约 1 分钟", updatedAt: "2026-09-17", keywords: ["交付", "凭据", "订单", "购买后"], order: 3, enabled: true,
    blocks: [
      { type: "paragraph", text: "登录后进入“我的订单”，找到对应的账号订单，即可查看处理状态和交付信息。" },
      { type: "list", items: ["打开“我的订单”", "选择“成品号订单”或搜索订单编号", "进入订单详情", "订单完成后按页面提示查看交付内容"] },
      { type: "notice", tone: "warning", text: "请勿向非官方客服渠道发送密码、Token、Cookie 或其他账号凭据。" },
    ],
  },
  {
    id: "help-existing-account", slug: "upgrade-existing-account", categoryId: "recharge",
    title: "已有账号，如何办理套餐升级？", summary: "为现有 ChatGPT 或 Claude 账号选择并办理目标套餐。",
    readingTime: "约 2 分钟", updatedAt: "2026-09-17", keywords: ["已有账号", "套餐升级", "代充", "Plus", "Pro", "Max"], order: 1, enabled: true, featured: true,
    blocks: [
      { type: "paragraph", text: "如果你已经拥有账号，请进入“套餐升级”，选择对应品牌和目标套餐，再按照当前商品页面的步骤办理。" },
      { type: "list", items: ["选择 ChatGPT 或 Claude", "选择 Plus、Pro、Max 等当前在售套餐", "阅读商品要求并提交所需资料", "确认订单并完成支付", "在“我的订单”查看办理进度"] },
      { type: "notice", tone: "info", text: "不同品牌和套餐的办理要求可能不同，请以当前商品页面的说明为准。" },
    ],
  },
  {
    id: "help-recharge-progress", slug: "recharge-progress", categoryId: "recharge",
    title: "如何查看套餐办理进度？", summary: "在订单详情中查看待处理、处理中、完成或失败状态。",
    readingTime: "约 1 分钟", updatedAt: "2026-09-17", keywords: ["办理进度", "处理中", "代充订单"], order: 2, enabled: true,
    blocks: [
      { type: "paragraph", text: "提交套餐升级订单后，可在“我的订单”中查看当前状态。订单详情会展示对应的处理进度。" },
      { type: "list", items: ["待处理：订单已提交，等待开始办理", "处理中：订单正在办理", "已完成：套餐办理完成", "失败：页面会显示失败原因或后续提示"] },
    ],
  },
  {
    id: "help-payment", slug: "payment-methods", categoryId: "orders",
    title: "支持哪些支付方式？", summary: "了解钱包余额与 USDT 支付方式。",
    readingTime: "约 1 分钟", updatedAt: "2026-09-17", keywords: ["支付", "USDT", "TRC20", "ERC20", "余额"], order: 1, enabled: true, featured: true,
    blocks: [
      { type: "paragraph", text: "当前系统展示钱包余额和 USDT 支付能力，部分场景支持余额抵扣后使用 USDT 补足差额。" },
      { type: "list", items: ["平台钱包余额", "TRC20 USDT", "ERC20 USDT"] },
      { type: "notice", tone: "warning", text: "实际可用方式、网络和到账要求以结账页面为准。转账前请再次核对网络与金额。" },
    ],
  },
  {
    id: "help-order-status", slug: "view-order-status", categoryId: "orders",
    title: "如何查看订单状态？", summary: "通过订单列表和详情页查询购买与套餐订单。",
    readingTime: "约 1 分钟", updatedAt: "2026-09-17", keywords: ["订单状态", "订单查询", "订单编号"], order: 2, enabled: true,
    blocks: [
      { type: "paragraph", text: "登录后进入“我的订单”，可以统一查看账号购买和套餐升级订单。" },
      { type: "list", items: ["使用订单类型筛选账号或套餐订单", "按订单状态和时间范围筛选", "通过订单编号或商品名称搜索", "进入详情查看进度和金额信息"] },
    ],
  },
  {
    id: "help-wallet-topup", slug: "wallet-topup", categoryId: "wallet",
    title: "如何充值钱包余额？", summary: "从钱包页面进入充值流程并查看到账记录。",
    readingTime: "约 1 分钟", updatedAt: "2026-09-17", keywords: ["钱包", "充值", "余额", "到账"], order: 1, enabled: true,
    blocks: [
      { type: "paragraph", text: "登录后打开“我的钱包”，点击充值并按页面提示选择金额和支付网络。" },
      { type: "list", items: ["确认充值金额", "选择页面当前支持的网络", "按提示完成支付", "在充值记录中查看状态"] },
      { type: "notice", tone: "info", text: "当前项目为 UI Demo，钱包充值和到账流程均为 Mock 演示。" },
    ],
  },
  {
    id: "help-security", slug: "protect-account-information", categoryId: "security",
    title: "如何保护账号信息？", summary: "提交办理资料和接收交付信息时的安全注意事项。",
    readingTime: "约 2 分钟", updatedAt: "2026-09-17", keywords: ["安全", "密码", "Token", "Cookie", "Session"], order: 1, enabled: true,
    blocks: [
      { type: "list", items: ["只在对应订单页面按明确提示提交资料", "不要通过陌生聊天或非官方渠道发送敏感信息", "妥善保管订单交付内容", "发现异常时及时联系在线客服"] },
      { type: "notice", tone: "warning", text: "请勿在公开页面、群聊或不明表单中粘贴密码、Token、Cookie、Session 等敏感信息。" },
    ],
  },
  {
    id: "help-contact-support", slug: "contact-support", categoryId: "support",
    title: "如何联系在线客服？", summary: "订单或支付遇到问题时，准备订单编号并联系官方客服。",
    readingTime: "约 1 分钟", updatedAt: "2026-09-17", keywords: ["客服", "售后", "订单问题", "联系"], order: 1, enabled: true, featured: true,
    blocks: [
      { type: "paragraph", text: "点击网站顶部或页面右下角的“在线客服”，即可查看当前客服联系方式。" },
      { type: "heading", text: "联系前建议准备" },
      { type: "list", items: ["订单编号", "遇到问题的页面和状态", "必要的错误提示截图", "请勿发送与问题无关的敏感账号信息"] },
      { type: "notice", tone: "info", text: "售后处理范围以对应商品说明、订单状态和实际售后政策为准。" },
    ],
  },
];
