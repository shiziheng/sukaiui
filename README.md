# SUKAI UI Demo

## 项目性质

仅前端 UI / 交互 Demo，用于确认 SUKAI AI 账号商城、用户中心、商品卡片、文案编辑模式、FAQ 和 ChatGPT 代充办理流程。

本项目不是正式业务系统。

## 技术栈

- React 19
- TypeScript 5.9
- Vinext 1.0 Beta
- Vite 8
- Tailwind CSS 4
- Radix UI / shadcn 风格组件
- Lucide React 图标
- Sonner 消息提示

Node.js 版本要求：`>= 22.13.0`

## 安装

```bash
npm install
```

## 启动开发环境

```bash
npm run dev
```

默认开发地址：`http://localhost:5173/`

使用 5174 端口并允许局域网访问：

```bash
npm run dev -- --port 5174 --hostname 0.0.0.0
```

## 构建

```bash
npm run build
```

## Demo 说明

- Session 解析目前为纯前端 Mock，不会验证、登录或访问真实账号。
- 商品、品牌、FAQ、账号套餐、库存、用户中心、订单和邀请数据目前均为 Mock Data。
- 支付流程目前为 Mock，不会扣除平台余额，也不会发起 ERC20 或 TRC20 链上交易。
- 项目没有真实业务后台或数据库。
- 项目没有真实支付、钱包连接、收款地址或支付回调。
- 项目没有真实 Session 接口，不会上传或持久化用户输入的 Session。
- 文案编辑模式的数据仅保存在当前浏览器的 `localStorage` 中。

## 主要目录

- `app/`：页面入口与全局样式
- `components/`：页面及交互组件
- `data/`：品牌、商品、FAQ 和办理流程 Mock 配置
- `public/`：静态资源
- `lib/`、`hooks/`：共享工具与 Hooks
- `scripts/`、`build/`：本地开发与构建脚本

## 交付注意事项

- 请勿在源码中写入 API Key、Token、Cookie、真实 Session 或账号凭据。
- `node_modules/`、`dist/`、本地缓存、日志和 `.env` 文件不属于源码交付内容。
- 重新安装依赖后即可通过上述命令运行和构建项目。
