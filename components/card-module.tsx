"use client";

import "./card.css";
import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import { CreditCard, X } from "lucide-react";
import { toast } from "sonner";

import { CardList, CardDetail } from "@/components/card-wallet";
import { CardMarket } from "@/components/card-market";
import { CardTransactions } from "@/components/card-transactions";
import { CardOpenDialog } from "@/components/card-open-dialog";
import { CardRechargeDialog } from "@/components/card-recharge-dialog";
import { CardRefundDialog } from "@/components/card-refund-dialog";
import { EditableText } from "@/components/editable-text";
import { PageHeading } from "@/components/user-center-shared";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type PlatformFlowType } from "@/data/bill-flows";
import {
  binTitle, money, type CardBin, type CardFlowItem, type VirtualCard,
} from "@/data/card-business";
import { type DemoContent } from "@/data/content";

type Editable = (key: keyof DemoContent, value: string) => void;
type CardTab = "cards" | "transactions";
export type ClosedCardRecord = { card: VirtualCard; closedAt: string };
/** 平台余额流水上报：开卡扣费 / 卡充值 / 卡退款 / 销卡退款，由父级写入余额流水。 */
export type PlatformFlowInput = { type: PlatformFlowType; amount: number; balanceAfter: number; note: string };

export function CardModule({
  tab, initialMarketOpen = false,
  cards, setCards, flows, setFlows, bins, platformBalance, setPlatformBalance,
  content, editMode, updateContent, onGoTopup, onPlatformFlow,
}: {
  /** 页签由父级（左侧二级菜单）控制，模块内不再自持状态。 */
  tab: CardTab;
  /** 未登录在公开卡页点「开卡」后，登录进来直接弹开卡中心。 */
  initialMarketOpen?: boolean;
  cards: VirtualCard[];
  setCards: Dispatch<SetStateAction<VirtualCard[]>>;
  flows: CardFlowItem[];
  setFlows: Dispatch<SetStateAction<CardFlowItem[]>>;
  bins: CardBin[];
  platformBalance: number;
  setPlatformBalance: Dispatch<SetStateAction<number>>;
  content: DemoContent;
  editMode: boolean;
  updateContent: Editable;
  onGoTopup: () => void;
  onPlatformFlow: (flow: PlatformFlowInput) => void;
}) {
  const [detailCard, setDetailCard] = useState<VirtualCard | null>(null);
  // 开卡中心不再是独立页签/菜单，改成列表里点「开卡」时弹出来。
  const [marketOpen, setMarketOpen] = useState(initialMarketOpen);
  const [openBin, setOpenBin] = useState<CardBin | null>(null);
  const [fundCard, setFundCard] = useState<VirtualCard | null>(null);
  const [freezeTarget, setFreezeTarget] = useState<VirtualCard | null>(null);
  const [freezing, setFreezing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VirtualCard | null>(null);
  const [refundTarget, setRefundTarget] = useState<VirtualCard | null>(null);
  const [noteTarget, setNoteTarget] = useState<VirtualCard | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [closedRecords, setClosedRecords] = useState<ClosedCardRecord[]>([]);

  const editable = (key: keyof DemoContent) => (
    <EditableText active={editMode} value={content[key]} onChange={(value) => updateContent(key, value)} />
  );

  const ownedCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const card of cards) map[card.binId] = (map[card.binId] ?? 0) + 1;
    return map;
  }, [cards]);

  const now = () => new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");

  const handleOpenComplete = (bin: CardBin, quantity: number, holder: string, remark: string, topupAmount: number) => {
    const feeTotal = Number((bin.openFee * quantity).toFixed(2));
    const topupTotal = Number((topupAmount * quantity).toFixed(2));
    const total = Number((feeTotal + topupTotal).toFixed(2));
    const newBalance = Number((platformBalance - total).toFixed(2));
    setPlatformBalance(newBalance);
    onPlatformFlow({
      type: "card_open",
      amount: -feeTotal,
      balanceAfter: newBalance,
      note: `开卡费 · ${binTitle(bin)} × ${quantity} 张${topupTotal ? `（含开卡充值 ${money(topupTotal)}）` : ""}`,
    });
    if (topupTotal) {
      onPlatformFlow({ type: "card_recharge", amount: -topupTotal, balanceAfter: newBalance, note: `开卡充值 · ${binTitle(bin)} × ${quantity} 张` });
    }
    const stamp = now();
    const prefix = bin.bin.replace(/\D/g, "");
    const restDigits = Math.max(16 - prefix.length, 0);
    const created: VirtualCard[] = [];
    for (let i = 0; i < quantity; i++) {
      const rest = String(Math.floor(Math.random() * Math.pow(10, restDigits))).padStart(restDigits, "0");
      created.push({
        id: `VC-${stamp.replace(/[^0-9]/g, "")}${String(i).padStart(2, "0")}`,
        cardNo: (prefix + rest).slice(0, 16),
        binId: bin.id,
        bin: bin.bin,
        scheme: bin.scheme,
        region: bin.region,
        holder,
        expMonth: 10,
        expYear: 28,
        cvv: String(Math.floor(Math.random() * 900) + 100),
        balance: topupAmount,
        currency: "USD",
        status: "active",
        createdAt: stamp,
        remark,
        billingAddress: {
          line1: "Street -", city: "City -", state: "State -", zip: "Zip Code -",
          country: bin.region === "hk" ? "Hong Kong, China" : "United States",
        },
      });
    }
    setCards((cs) => [...created, ...cs]);
    if (topupAmount > 0) {
      setFlows((fs) => [
        ...created.map((card, index) => ({
          id: `CF-KC-${Date.now()}-${String(index).padStart(2, "0")}`,
          cardId: card.id,
          time: stamp,
          type: "recharge" as const,
          amount: topupAmount,
          balanceAfter: topupAmount,
          merchant: "平台余额划转（开卡充值）",
          status: "success" as const,
          txNo: "—",
        })),
        ...fs,
      ]);
    }
  };

  const handleFundComplete = (card: VirtualCard, amount: number) => {
    const newBalance = Number((platformBalance - amount).toFixed(2));
    setPlatformBalance(newBalance);
    onPlatformFlow({ type: "card_recharge", amount: -amount, balanceAfter: newBalance, note: `卡充值 · 尾号 ${card.cardNo.slice(-4)}` });
    const stamp = now();
    const cardBalance = Number((card.balance + amount).toFixed(2));
    setCards((cs) => cs.map((c) => c.id === card.id ? { ...c, balance: cardBalance } : c));
    setFlows((fs) => [
      {
        id: `CF-KC-${Date.now()}`,
        cardId: card.id,
        time: stamp,
        type: "recharge",
        amount,
        balanceAfter: cardBalance,
        merchant: "平台余额划转",
        status: "success",
        txNo: "—",
      },
      ...fs,
    ]);
  };

  const handleFreeze = (card: VirtualCard) => {
    if (card.status === "system_frozen") {
      toast.info("系统冻结的卡片需联系客服处理");
      return;
    }
    if (card.status === "processing") {
      toast.info("开卡处理中，暂不可冻结");
      return;
    }
    setFreezeTarget(card);
  };
  const confirmFreeze = () => {
    const card = freezeTarget;
    if (!card || freezing) return;
    if (card.status !== "active" && card.status !== "frozen") {
      toast.info(card.status === "system_frozen" ? "系统冻结的卡片需联系客服处理" : "开卡处理中，暂不可冻结");
      setFreezeTarget(null);
      return;
    }
    const next = card.status === "frozen" ? "active" : "frozen";
    // 冻结/解冻通过上游接口执行：模拟约 0.9s 的接口往返，期间禁止重复提交。
    setFreezing(true);
    window.setTimeout(() => {
      setCards((cs) => cs.map((c) => c.id === card.id ? { ...c, status: next } : c));
      if (detailCard?.id === card.id) setDetailCard({ ...card, status: next });
      setFreezing(false);
      setFreezeTarget(null);
      toast.success(next === "frozen" ? "上游已冻结卡片" : "上游已解冻，卡片恢复可用");
    }, 900);
  };

  const handleDelete = (card: VirtualCard) => { setDeleteTarget(card); };
  const confirmDelete = () => {
    const card = deleteTarget;
    if (!card) return;
    const newBalance = Number((platformBalance + card.balance).toFixed(2));
    setPlatformBalance(newBalance);
    onPlatformFlow({
      type: "card_close",
      amount: card.balance,
      balanceAfter: newBalance,
      note: card.balance > 0 ? `删卡退款 · 尾号 ${card.cardNo.slice(-4)}` : `删卡 · 尾号 ${card.cardNo.slice(-4)}`,
    });
    setClosedRecords((records) => [{ card, closedAt: now() }, ...records]);
    setCards((cs) => cs.filter((c) => c.id !== card.id));
    // 销卡后流水保留：交易记录页可见「已销卡」的历史流水。
    if (detailCard?.id === card.id) setDetailCard(null);
    toast.success("卡片已删除，余额已退回平台余额");
    setDeleteTarget(null);
  };

  const handleRefund = (card: VirtualCard) => { setRefundTarget(card); };
  /** 退款弹窗确认：指定金额从卡内余额退回平台余额（弹窗已保证退款后卡内 ≥ $0.10）。 */
  const handleRefundComplete = (card: VirtualCard, amount: number) => {
    const newBalance = Number((platformBalance + amount).toFixed(2));
    setPlatformBalance(newBalance);
    onPlatformFlow({ type: "card_refund", amount, balanceAfter: newBalance, note: `卡退款 · 尾号 ${card.cardNo.slice(-4)}` });
    const cardBalance = Number((card.balance - amount).toFixed(2));
    setCards((cs) => cs.map((c) => c.id === card.id ? { ...c, balance: cardBalance } : c));
    setFlows((fs) => [
      {
        id: `CF-TK-${Date.now()}`,
        cardId: card.id,
        time: now(),
        type: "cashout",
        amount: -amount,
        balanceAfter: cardBalance,
        merchant: "转出至平台余额",
        status: "success",
        txNo: "—",
      },
      ...fs,
    ]);
    if (detailCard?.id === card.id) setDetailCard({ ...card, balance: cardBalance });
    toast.success(`${amount.toFixed(2)} 美元已退回平台余额`);
    setRefundTarget(null);
  };

  const openNote = (card: VirtualCard) => {
    setNoteTarget(card);
    setNoteDraft(card.remark ?? "");
  };
  const confirmNote = () => {
    const card = noteTarget;
    if (!card) return;
    const next = noteDraft.trim();
    setCards((cs) => cs.map((c) => c.id === card.id ? { ...c, remark: next } : c));
    if (detailCard?.id === card.id) setDetailCard({ ...card, remark: next });
    toast.success("备注已保存");
    setNoteTarget(null);
  };
  const confirmRefund = () => {};

  const freezeIsUnfreeze = freezeTarget?.status === "frozen";

  return (
    <section className="card-module">
      <PageHeading
        titleKey={tab === "transactions" ? "cardTabTransactions" : "cardPageTitle"}
        subtitleKey={tab === "transactions" ? "cardFlowsPageSubtitle" : "cardPageSubtitle"}
        content={content}
        editMode={editMode}
        updateContent={updateContent}
        icon={<CreditCard aria-hidden="true" />}
      />

      {detailCard ? (
        <CardDetail
          card={detailCard}
          bin={bins.find((bin) => bin.id === detailCard.binId)}
          flows={flows}
          onBack={() => setDetailCard(null)}
          onFund={(card) => setFundCard(card)}
          onRefund={handleRefund}
          onNote={openNote}
          onRequestFreeze={handleFreeze}
          onRequestDelete={handleDelete}
          content={content}
          editMode={editMode}
          updateContent={updateContent}
        />
      ) : tab === "cards" ? (
        <CardList
          cards={cards}
          closedRecords={closedRecords}
          onOpenMarket={() => setMarketOpen(true)}
          onDetail={setDetailCard}
          onFund={(card) => setFundCard(card)}
          onNote={openNote}
          onRequestFreeze={handleFreeze}
          onRequestDelete={handleDelete}
          content={content}
          editMode={editMode}
          updateContent={updateContent}
        />
      ) : (
        <CardTransactions
          cards={cards}
          closedCards={closedRecords.map((record) => record.card)}
          flows={flows}
          content={content}
          editMode={editMode}
          updateContent={updateContent}
          embedded
          onOpenMarket={() => setMarketOpen(true)}
        />
      )}

      {/* 开卡中心：从列表里的「开卡」按钮弹出，不再占菜单和页签 */}
      <Dialog open={marketOpen} onOpenChange={setMarketOpen}>
        <DialogContent className="card-market-dialog" showCloseButton={false}>
          <DialogTitle className="sr-only">开卡中心</DialogTitle>
          <DialogDescription className="sr-only">按用途挑选卡段，查看开卡费、限额与适用场景。</DialogDescription>
          <header className="card-market-dialog-head">
            <div>
              <h2>开卡中心</h2>
              <p>按用途挑卡段，开卡费和限额直接写在卡面上。</p>
            </div>
            <button className="card-market-dialog-close" type="button" onClick={() => setMarketOpen(false)} aria-label="关闭开卡中心">
              <X aria-hidden="true" />
            </button>
          </header>
          <div className="card-market-dialog-body">
            <CardMarket
              bins={bins}
              ownedCounts={ownedCounts}
              onOpen={(bin) => { setMarketOpen(false); setOpenBin(bin); }}
              content={content}
              editMode={editMode}
              updateContent={updateContent}
            />
          </div>
        </DialogContent>
      </Dialog>

      <CardOpenDialog
        bin={openBin}
        availableBalance={platformBalance}
        onOpenChange={(open) => { if (!open) setOpenBin(null); }}
        onComplete={handleOpenComplete}
        onGoTopup={onGoTopup}
        onViewCards={() => { setMarketOpen(false); setOpenBin(null); }}
        content={content}
        editMode={editMode}
        updateContent={updateContent}
      />

      <CardRechargeDialog
        card={fundCard}
        availableBalance={platformBalance}
        onOpenChange={(open) => { if (!open) setFundCard(null); }}
        onComplete={handleFundComplete}
        onGoTopup={onGoTopup}
        onViewCard={() => { if (fundCard) setDetailCard(fundCard); setFundCard(null); }}
        content={content}
        editMode={editMode}
        updateContent={updateContent}
      />

      <AlertDialog open={Boolean(freezeTarget)} onOpenChange={(open) => !open && !freezing && setFreezeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{editable(freezeIsUnfreeze ? "cardUnfreezeConfirmTitle" : "cardFreezeConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{editable(freezeIsUnfreeze ? "cardUnfreezeConfirmDescription" : "cardFreezeConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={freezing}>{editable("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="card-freeze-confirm" onClick={confirmFreeze} disabled={freezing}>
              {freezing ? "正在请求上游…" : editable("cardConfirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CardRefundDialog
        card={refundTarget}
        onOpenChange={(open) => { if (!open) setRefundTarget(null); }}
        onComplete={handleRefundComplete}
        content={content}
        editMode={editMode}
        updateContent={updateContent}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{editable("cardDeleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {editable("cardDeleteConfirmDescription")}
              {deleteTarget && deleteTarget.balance > 0 ? ` 将退回 ${binTitle(deleteTarget)} 卡内余额 ${deleteTarget.balance.toFixed(2)} 美元。` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{editable("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="card-delete-confirm" onClick={confirmDelete}>{editable("cardConfirmAction")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(noteTarget)} onOpenChange={(open) => { if (!open) setNoteTarget(null); }}>
        <DialogContent className="card-note-dialog">
          <DialogHeader>
            <DialogTitle>{editable("cardRemarkLabel")}</DialogTitle>
            <DialogDescription>
              {noteTarget ? `尾号 ${noteTarget.cardNo.slice(-4)} · ${binTitle(noteTarget)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="card-note-textarea"
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="输入备注，方便识别这张卡的用途"
            rows={3}
            maxLength={60}
            aria-label="备注内容"
          />
          <DialogFooter>
            <button className="uc-secondary-action" type="button" onClick={() => setNoteTarget(null)}>{editable("cancel")}</button>
            <button className="uc-primary-action" type="button" onClick={confirmNote}>保存</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
