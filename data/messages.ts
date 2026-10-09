// 站内信（演示用 Mock 数据）—— 纯前端 Demo，无后端。
//
// 字段说明：
// - scope: "global" 全局消息；"personal" 按邮箱匹配的专属消息（需 email 命中）
// - forced: 是否强制弹出（仅对未读用户弹出，确认已读后不再重复）
// - status: "active" 上架 / "off" 下架 / "expired" 过期
// - expiresAt: 过期时间戳（不填 = 不过期）；过期或下架的消息不可见、不弹窗、不计未读

export type MessageScope = "global" | "personal";
export type MessageStatus = "active" | "off" | "expired";

export interface SiteMessage {
  id: string;
  scope: MessageScope;
  email?: string;
  title: string;
  content: string;
  forced: boolean;
  status: MessageStatus;
  expiresAt?: number;
  createdAt: number;
}

const DAY = 86_400_000;
const now = Date.now();

/** 演示用的专属消息邮箱，方便在 Demo 里直接试。 */
export const DEMO_EMAILS = ["vip@example.com", "test@sukai.com"];

export const siteMessages: SiteMessage[] = [
  {
    id: "m-global-1",
    scope: "global",
    title: "国庆期间代充通道调整通知",
    content:
      "10 月 1 日 – 10 月 7 日部分上游卡源维护，代充办理时长可能延长 2–4 小时，建议提前安排。给您带来不便敬请谅解。",
    forced: true,
    status: "active",
    createdAt: now - 2 * DAY,
  },
  {
    id: "m-global-2",
    scope: "global",
    title: "新版成品号页已上线",
    content: "购买账号流程已简化为单步弹窗，支持余额直付，欢迎体验。",
    forced: false,
    status: "active",
    createdAt: now - 5 * DAY,
  },
  {
    id: "m-global-3",
    scope: "global",
    title: "邀请有礼活动进行中",
    content: "邀请好友注册并完成首单，双方各得 ¥30 现金奖励，活动长期有效。",
    forced: false,
    status: "active",
    createdAt: now - 9 * DAY,
  },
  {
    id: "m-personal-1",
    scope: "personal",
    email: "vip@example.com",
    title: "您的专属套餐已到账",
    content: "尊敬的 VIP 用户，您订阅的 Claude Pro 专属套餐已成功开通，可前往「套餐升级」立即使用。",
    forced: true,
    status: "active",
    createdAt: now - 1 * DAY,
  },
  {
    id: "m-personal-2",
    scope: "personal",
    email: "vip@example.com",
    title: "续费提醒",
    content: "您的成品号将于 7 天后到期，建议提前续费，以免影响正常使用。",
    forced: false,
    status: "active",
    createdAt: now - 3 * DAY,
  },
  {
    id: "m-personal-3",
    scope: "personal",
    email: "test@sukai.com",
    title: "新用户欢迎礼",
    content: "欢迎加入 SUKAI，首单代充立减 ¥20，记得在结算时使用。",
    forced: false,
    status: "active",
    createdAt: now - 4 * DAY,
  },
  // 下架消息：不可见、不弹窗、不计未读
  {
    id: "m-global-off",
    scope: "global",
    title: "已下线公告（演示：下架不显示）",
    content: "该消息已被运营下架。",
    forced: false,
    status: "off",
    createdAt: now - 20 * DAY,
  },
  // 过期消息：不可见、不弹窗、不计未读
  {
    id: "m-global-exp",
    scope: "global",
    title: "已过期活动（演示：过期不显示）",
    content: "该活动已结束。",
    forced: true,
    status: "active",
    expiresAt: now - 1 * DAY,
    createdAt: now - 30 * DAY,
  },
];

/** 返回某邮箱当前可见的消息（已按创建时间倒序），用于未读计数与列表展示。 */
export function getVisibleMessages(email: string): SiteMessage[] {
  const lower = email.trim().toLowerCase();
  return siteMessages
    .filter((message) => {
      if (message.status !== "active") return false;
      if (message.expiresAt !== undefined && message.expiresAt < Date.now()) return false;
      if (message.scope === "personal") {
        if (!lower) return false;
        return message.email?.toLowerCase() === lower;
      }
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}
