# AGENTS.md — 项目规矩与上手指南

> 本文件是本项目的**唯一规矩来源**。无论是人类开发还是 AI（Claude / Codex / 其他大模型），接手前先读完这份文件，30 秒知道这个项目是什么、能做什么、不能做什么。

---

## 1. 这个项目是什么

**SUKAI UI Demo** —— 纯前端的 AI 账号商城界面演示：

- 成品号购买（已登录用户的账号集市 + 弹窗购买）
- 套餐代充（单账号 + 批量向导）
- 钱包充值（USDT 扫码支付演示）
- 站内信（铃铛 + 强制弹窗）
- 用户中心（余额、订单、流水）

**所有数据都是 Mock，写死在 `data/*.ts` 里。没有后端、没有真实支付、没有真实登录。**

## 2. 三条铁律（改代码前必读）

1. **只做前端页面展示，不写后台接口。** 本项目的工作模式是：前端做好 → 交付给后端同学集成。不要在这里写 API 层、不要接真实接口、不要自造登录/支付逻辑。Mock 数据可以改。
2. **高风险删除操作必须先审核。** 删除整个组件/页面/大段共享 CSS、重构共享资产之前，必须先向项目负责人说明影响范围，得到确认才能动手。普通的单文件小改动不需要。
3. **交付只走 GitHub。** 后端直接访问 GitHub 仓库拿最新代码，不再发 zip。每次版本更新必须 push，并按第 4 节写变更说明。

## 3. 技术栈与常用命令

- React 19 + TypeScript 5.9 + Vinext（Next 兼容层，跑在 Vite 8 上）+ Tailwind 4 + shadcn/Radix
- Node >= 22.13.0

| 命令 | 用途 |
|---|---|
| `node scripts/run-framework.mjs dev --hostname 0.0.0.0` | 启动开发服务器，端口 5173（本机一键脚本：`start-dev.cmd` / `stop-dev.cmd`） |
| `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` | **类型检查门禁。必须 0 错误才允许提交。** 注意：`npm run build` 不查类型，别拿它当门禁 |
| `node scripts/run-framework.mjs build` | 构建（**构建前必须停掉 dev server**，否则会挂起） |

## 4. 版本与提交规范

- **提交信息**：语义化前缀 + 中文说明。格式：`feat: xxx` / `fix: xxx` / `docs: xxx` / `chore: xxx` / `refactor: xxx`。
- **版本号**：`package.json` 的 `version` 字段。前端 demo 用 `0.x.y`：小功能 +0.1，修 bug +0.0.1，大改版升 1.0.0（等接上真后端再说）。
- **Tag**：每次发版本打一个 tag，格式 `v0.9.0`，推到 GitHub。
- **CHANGELOG**：每次版本更新**必须**在 `CHANGELOG.md` 顶部加一节，写清楚「这次改了什么」。用户看得懂的话来写，别堆术语。
- **产品变更说明**：CHANGELOG 就是给用户/后端看的产品变更说明，不用另写文档。

## 5. 文档索引（都在哪找什么）

| 文档 | 内容 | 什么时候看 |
|---|---|---|
| `docs/产品说明书.md` | 页面地图、功能块说明、Mock 边界 | 了解网站有什么功能 |
| `docs/核心业务流程.md` | 四条业务流程的状态机 + 关键文件 + 已知雷区 | 改业务逻辑前**必读**，里面有「改了会炸」清单 |
| `docs/后端接入指南.md` | 后端同学怎么从 GitHub 拿代码、跑起来、看什么 | 后端接入时发给他 |
| `docs/接口契约梳理.md` | 前后端接口契约（唯一对接文档） | 后端设计接口时 |
| `CHANGELOG.md` | 版本变更历史 | 想知道某版本改了什么 |

## 6. 给 AI 的特别说明（每次会话先看这里）

- **路由只有 `/`**：所有"页面"是 `app/page.tsx` 里的 `selectedMenu` 状态切换出来的，不是 URL 路由。改导航/页面跳转时记住这一点，别去找 react-router。
- **主内容渲染是一条长三元链**（`selectedMenu === "xxx" ? ... :`）。沉浸式子视图必须用 `selectedMenu === "xxx" && localState` 的形式挂上去，不能局部状态短路。
- **共享资产别乱动**：`components/payment-experience.tsx` 被三处复用；`app/globals.css` 的两个窄屏 `@media` 块是共享的。细节见 `docs/核心业务流程.md` 的雷区清单。
- **localStorage 文案迁移是单跳的**：改已有 key 的默认值必须补链式迁移，否则老用户的旧文案永远刷不掉。
- **提交前三件事**：tsc 0 错误 → 更新 CHANGELOG → 语义化 commit。
