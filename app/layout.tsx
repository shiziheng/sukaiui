import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SUKAI AI 账号商城 Demo",
  description: "AI 账号与订阅服务商城高保真前端交互 Demo。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
