import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SUKAI 速开｜AI 账号与订阅服务平台",
  description: "AI 成品号购买、套餐代充、批量办理与订单追踪，一站式办理 AI 账号与订阅服务。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
