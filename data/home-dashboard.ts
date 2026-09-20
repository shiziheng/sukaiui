import type { Product } from "./products";

export const homeDashboardCopy = {
  accountCategory: "服务分类 · 成品号",
  accountScenario: "我还没有账号",
  accountTags: ["ChatGPT / Claude", "菲区 / 美区 / 日区"],
  rechargeCategory: "服务分类 · 代充",
  rechargeScenario: "我已经有账号",
  rechargeTags: ["Plus / Pro / Max", "支持单账号与批量办理"],
  popularEyebrow: "POPULAR SERVICES",
  popularTitle: "热门服务",
  popularDescription: "从当前在售商品中快速选择，价格与库存与商品页面保持一致。",
  popularAction: "查看全部",
  activeEyebrow: "ACTIVE ORDER",
  activeTitle: "正在办理",
  activeDescription: "重要进度集中展示，无需反复联系客服。",
  overviewEyebrow: "ACCOUNT OVERVIEW",
  overviewTitle: "账户概览",
  overviewDescription: "余额与订单状态快速查看。",
  progressSteps: ["已下单", "处理中", "已完成"],
  trustItems: [
    { id: "regions", title: "多区域可选", description: "菲区、美区、日区等，以商品库存为准。", icon: "region" },
    { id: "tracking", title: "订单进度可查", description: "支付、处理与交付状态集中查看。", icon: "order" },
    { id: "payment", title: "灵活支付", description: "支持钱包余额及当前开放的支付方式。", icon: "payment" },
    { id: "support", title: "售后支持", description: "异常订单可从订单详情或客服入口处理。", icon: "support" },
  ],
} as const;

const preferredProductIds = [
  "gpt-plus-account",
  "claude-pro-account",
  "gpt-plus-recharge",
  "claude-pro-recharge",
] as const;

export function getHomePopularProducts(products: Product[]) {
  return preferredProductIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product && product.status === "available"));
}
