"use client";

import { ArrowRight, Plus, WalletCards } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import "./wallet-drawer.css";

export type WalletDrawerRecord = {
  id: string;
  time: string;
  type: string;
  amount: number;
  balance: number;
  orderId: string;
  note: string;
};

function money(value: number, digits = 2) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function WalletDrawer({
  open,
  onOpenChange,
  balance,
  frozenBalance,
  records,
  onRecharge,
  onViewAll,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
  frozenBalance: number;
  records: WalletDrawerRecord[];
  onRecharge: () => void;
  onViewAll: () => void;
}) {
  const recent = records.slice(0, 5);

  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent id="wallet-drawer" className="wallet-drawer" side="bottom">
      <SheetTitle className="wallet-drawer-title">钱包</SheetTitle>
      <SheetDescription className="wallet-drawer-desc">平台余额与最近流水，充值不跳页。</SheetDescription>

      <div className="wd-balance">
        <span className="wd-balance-label"><WalletCards aria-hidden="true" />平台可用余额</span>
        <strong>{money(balance)}</strong>
        <div className="wd-balance-meta">
          <span>冻结 {money(frozenBalance)}</span>
          <span>充值实时到账</span>
        </div>
        <button className="wd-recharge" type="button" onClick={onRecharge}>
          <Plus aria-hidden="true" />充值
        </button>
      </div>

      <div className="wd-section-head">
        <strong>最近流水</strong>
        <button type="button" onClick={onViewAll}>全部流水<ArrowRight aria-hidden="true" /></button>
      </div>

      <ul className="wd-list">
        {recent.length ? recent.map((item) => <li key={item.id}>
          <div className="wd-row-main">
            <span className="wd-row-type">{item.type}</span>
            <em className={item.amount >= 0 ? "is-income" : "is-expense"}>
              {item.amount >= 0 ? "+" : "−"}{money(Math.abs(item.amount))}
            </em>
          </div>
          <div className="wd-row-meta">
            <time>{item.time}</time>
            <span>余额 {money(item.balance)}</span>
          </div>
        </li>) : <li className="wd-empty">还没有流水记录。</li>}
      </ul>

      <p className="wd-note">充值到账、开卡扣费、买商品，都会记进这里。</p>
    </SheetContent>
  </Sheet>;
}
