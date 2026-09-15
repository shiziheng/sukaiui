import type { BrandId } from "./brands";
import type { BusinessType } from "./products";

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  enabled: boolean;
  defaultOpen: boolean;
  linkText?: string;
  linkUrl?: string;
};

export type FAQGroup = {
  id: string;
  businessType: BusinessType;
  brand: BrandId;
  productId?: string;
  items: FAQItem[];
};

export const defaultFaqs: FAQGroup[] = [
  {
    id: "account-chatgpt",
    businessType: "account",
    brand: "chatgpt",
    items: [
      { id: "account-chatgpt-use", question: "ChatGPT成品号购买后如何使用？", answer: "购买完成后，页面会展示账号交付信息。请按交付说明登录，并在首次使用后检查账号状态。", sortOrder: 1, enabled: true, defaultOpen: true },
      { id: "account-chatgpt-password", question: "账号是否支持修改密码？", answer: "支持修改密码的商品会在副标题或交付说明中明确标注，请以对应商品说明为准。", sortOrder: 2, enabled: true, defaultOpen: false },
      { id: "account-chatgpt-region", question: "账号是什么地区？", answer: "账号地区会根据当前库存安排，具体地区信息以购买时的商品说明和最终交付内容为准。", sortOrder: 3, enabled: true, defaultOpen: false },
      { id: "account-chatgpt-login", question: "出现登录问题怎么办？", answer: "请先确认网络环境和账号信息输入正确。如仍无法登录，可准备订单信息联系售后处理。", sortOrder: 4, enabled: true, defaultOpen: false },
      { id: "account-chatgpt-support", question: "是否支持售后？", answer: "支持商品说明范围内的售后服务。不同商品的保障时间可能不同，请以购买页面的说明为准。", sortOrder: 5, enabled: true, defaultOpen: false },
    ],
  },
  {
    id: "account-claude",
    businessType: "account",
    brand: "claude",
    items: [
      { id: "account-claude-login", question: "Claude成品号如何登录？", answer: "购买后按照交付信息中的账号、密码和登录说明操作即可，首次登录建议保持稳定的网络环境。", sortOrder: 1, enabled: true, defaultOpen: true },
      { id: "account-claude-change", question: "是否支持修改邮箱或密码？", answer: "可修改范围会随商品类型变化。支持修改的项目会在商品说明中标注，请勿修改未明确开放的安全信息。", sortOrder: 2, enabled: true, defaultOpen: false },
      { id: "account-claude-plan", question: "Claude账号是什么套餐？", answer: "当前提供 Pro 与 Max 等套餐，实际套餐以商品名称和购买确认弹窗中的信息为准。", sortOrder: 3, enabled: true, defaultOpen: false },
      { id: "account-claude-environment", question: "使用环境有什么要求？", answer: "建议使用稳定且一致的网络环境，并避免短时间内频繁切换设备或登录地区。", sortOrder: 4, enabled: true, defaultOpen: false },
      { id: "account-claude-issue", question: "出现账号异常怎么办？", answer: "请停止重复登录并保存错误提示，然后携带订单信息联系售后，以便尽快核对账号状态。", sortOrder: 5, enabled: true, defaultOpen: false },
    ],
  },
  {
    id: "recharge-chatgpt",
    businessType: "recharge",
    brand: "chatgpt",
    items: [
      { id: "recharge-chatgpt-info", question: "ChatGPT代充需要提供什么信息？", answer: "下单后请按页面提示提供代充所需的账号信息。请勿通过非官方订单渠道发送敏感信息。", sortOrder: 1, enabled: true, defaultOpen: true },
      { id: "recharge-chatgpt-plan", question: "Plus和Pro代充有什么区别？", answer: "两者对应不同的订阅套餐、功能范围和价格，请根据商品名称与说明选择需要的方案。", sortOrder: 2, enabled: true, defaultOpen: false },
      { id: "recharge-chatgpt-time", question: "充值需要多长时间？", answer: "通常会在商品标注的时间范围内完成；高峰期可能略有延迟，订单状态会同步更新。", sortOrder: 3, enabled: true, defaultOpen: false },
      { id: "recharge-chatgpt-code", question: "代充过程中是否需要验证码？", answer: "部分账号可能需要验证码配合。若有需要，页面会在处理过程中给出明确提示。", sortOrder: 4, enabled: true, defaultOpen: false },
      { id: "recharge-chatgpt-failed", question: "充值失败怎么办？", answer: "充值失败后不会重复扣费。请保留订单信息并联系售后，我们会核查原因并继续处理或退款。", sortOrder: 5, enabled: true, defaultOpen: false },
    ],
  },
  {
    id: "recharge-claude",
    businessType: "recharge",
    brand: "claude",
    items: [
      { id: "recharge-claude-info", question: "Claude代充需要提供什么信息？", answer: "请根据下单后的提示提供必要的账号信息。具体所需内容可能因套餐和账号状态而不同。", sortOrder: 1, enabled: true, defaultOpen: true },
      { id: "recharge-claude-plan", question: "支持哪些Claude套餐？", answer: "当前 Demo 展示 Claude Pro 与 Max 相关方案，实际上架范围请以商品列表为准。", sortOrder: 2, enabled: true, defaultOpen: false },
      { id: "recharge-claude-time", question: "代充一般需要多久？", answer: "正常情况下会在商品标注的处理时间内完成，特殊情况会通过订单状态说明。", sortOrder: 3, enabled: true, defaultOpen: false },
      { id: "recharge-claude-login", question: "是否需要登录账号？", answer: "代充通常需要完成账号登录或授权步骤，具体操作以购买后的安全提示为准。", sortOrder: 4, enabled: true, defaultOpen: false },
      { id: "recharge-claude-failed", question: "代充失败如何处理？", answer: "请不要重复下单。保留订单编号并联系售后，我们会确认状态后继续处理或安排退款。", sortOrder: 5, enabled: true, defaultOpen: false },
    ],
  },
];
