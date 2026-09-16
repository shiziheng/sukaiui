import type { BrandId } from "./brands";

export type BusinessType = "account" | "recharge";
export type ProductStatus = "available" | "soldout";
export type ProductFulfillment = "instant" | "preorder";

export type Product = {
  id: string;
  businessType: BusinessType;
  brand: BrandId;
  name: string;
  subtitle: string;
  tags: string[];
  price: number;
  priceSuffix?: string;
  discountLabel?: string;
  features: string[];
  stock?: number;
  stockText: string;
  status: ProductStatus;
  fulfillment?: ProductFulfillment;
  maxQuantity?: number;
  credentialFormatDescription?: string;
  afterSalesDescription?: string;
  highlight?: boolean;
  highlightLabel?: string;
};

export const defaultProducts: Product[] = [
  {
    id: "gpt-plus-account", businessType: "account", brand: "chatgpt",
    name: "ChatGPT Plus 成品号", subtitle: "独享账号 · 支持改密", tags: ["Plus", "独享"],
    price: 129, priceSuffix: "/账号", features: ["已开通Plus套餐", "独享账号", "支持修改密码", "即买即用", "支持网页端使用"],
    stock: 36, stockText: "库存 36", status: "available", fulfillment: "instant", maxQuantity: 9,
    credentialFormatDescription: "凭据内容可能包含邮箱账号、密码、2FA 或 Session 等，具体以商品说明为准。",
    afterSalesDescription: "交付后提供30天售后保障，具体范围以商品说明与服务条款为准。",
    highlight: false, highlightLabel: "",
  },
  {
    id: "gpt-pro-account", businessType: "account", brand: "chatgpt",
    name: "ChatGPT Pro 成品号", subtitle: "Pro套餐 · 独享账号", tags: ["Pro", "独享"],
    price: 499, priceSuffix: "/账号", discountLabel: "高阶套餐", features: ["已开通Pro套餐", "更高模型使用额度", "支持高级模型", "独享账号", "即买即用"],
    stock: 8, stockText: "库存 8", status: "available", fulfillment: "instant", maxQuantity: 8,
    credentialFormatDescription: "凭据内容可能包含邮箱账号、密码、2FA 或 Session 等，具体以商品说明为准。",
    afterSalesDescription: "交付后提供30天售后保障，具体范围以商品说明与服务条款为准。",
    highlight: true, highlightLabel: "推荐",
  },
  {
    id: "gpt-sale-account", businessType: "account", brand: "chatgpt",
    name: "ChatGPT Plus 标准账号", subtitle: "Plus 套餐 · 即买即用", tags: ["Plus", "独享"],
    price: 99, priceSuffix: "/账号", features: ["已开通Plus套餐", "独享账号", "即买即用", "支持网页端使用"],
    stock: 3, stockText: "仅剩 3 个", status: "available", fulfillment: "instant", maxQuantity: 3,
    credentialFormatDescription: "凭据内容可能包含邮箱账号、密码、2FA 或 Session 等，具体以商品说明为准。",
    afterSalesDescription: "交付后提供30天售后保障，具体范围以商品说明与服务条款为准。",
    highlight: false, highlightLabel: "",
  },
  {
    id: "claude-pro-account", businessType: "account", brand: "claude",
    name: "Claude Pro 成品号", subtitle: "独享账号 · Pro套餐", tags: ["Claude Pro", "独享"],
    price: 199, priceSuffix: "/账号", features: ["Claude Pro套餐", "独享账号", "即买即用", "支持网页端使用", "稳定使用环境"],
    stock: 18, stockText: "库存 18", status: "available", fulfillment: "instant", maxQuantity: 9,
    credentialFormatDescription: "凭据内容包含登录账号、密码与必要的验证信息，具体以商品说明为准。",
    afterSalesDescription: "交付后提供30天售后保障，具体范围以商品说明与服务条款为准。",
    highlight: false, highlightLabel: "",
  },
  {
    id: "claude-max-account", businessType: "account", brand: "claude",
    name: "Claude Max 成品号", subtitle: "Claude Max订阅账号", tags: ["Max", "独享"],
    price: 599, priceSuffix: "/账号", discountLabel: "高额度方案", features: ["Claude Max套餐", "更高使用额度", "独享账号", "即买即用", "支持网页端使用"],
    stock: 0, stockText: "暂时缺货 · 支持预定", status: "available", fulfillment: "preorder", maxQuantity: 3,
    credentialFormatDescription: "凭据内容包含登录账号、密码与必要的验证信息，具体以商品说明为准。",
    afterSalesDescription: "交付后提供30天售后保障，具体范围以商品说明与服务条款为准。",
    highlight: true, highlightLabel: "推荐",
  },
  {
    id: "gpt-plus-recharge", businessType: "recharge", brand: "chatgpt",
    name: "ChatGPT Plus 代充", subtitle: "官方套餐代充值", tags: ["Plus", "代充"],
    price: 135, priceSuffix: "/月", features: ["官方Plus套餐充值", "支持GPT-5.6", "支持绘图 / Canvas", "充值完成即可使用"],
    stock: 20, stockText: "库存充足", status: "available", highlight: false, highlightLabel: "",
  },
  {
    id: "gpt-pro-recharge", businessType: "recharge", brand: "chatgpt",
    name: "ChatGPT Pro 代充", subtitle: "Pro套餐代充值", tags: ["Pro", "代充"],
    price: 599, priceSuffix: "/月", discountLabel: "适合高频用户", features: ["官方Pro套餐充值", "更高模型使用额度", "支持高级模型", "充值完成即可使用"],
    stock: 12, stockText: "库存充足", status: "available", highlight: true, highlightLabel: "推荐",
  },
  {
    id: "claude-pro-recharge", businessType: "recharge", brand: "claude",
    name: "Claude Pro 代充", subtitle: "Claude Pro套餐充值", tags: ["Claude Pro", "代充"],
    price: 209, priceSuffix: "/月", features: ["官方Claude Pro套餐", "支持长文本处理", "支持网页端使用", "充值完成即可使用"],
    stockText: "库存充足", status: "available", highlight: false, highlightLabel: "",
  },
  {
    id: "claude-max-recharge", businessType: "recharge", brand: "claude",
    name: "Claude Max 代充", subtitle: "Claude Max套餐充值", tags: ["Max", "代充"],
    price: 629, priceSuffix: "/月", discountLabel: "高额度方案", features: ["官方Claude Max套餐", "更高模型使用额度", "适合高频使用", "充值完成即可使用"],
    stockText: "库存充足", status: "available", highlight: true, highlightLabel: "推荐",
  },
];
