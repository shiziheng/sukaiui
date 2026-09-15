import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SUKAI AI 服务 Demo",
  description: "AI 成品号与订阅代充服务高保真前端交互 Demo。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
