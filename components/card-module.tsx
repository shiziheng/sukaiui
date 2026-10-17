"use client";

import "./card.css";
import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import { CreditCard, Layers, ReceiptText, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { CardList, CardDetail } from "@/components/card-wallet";
import { CardMarket } from "@/components/card-market";
import { CardTransactions } from "@/components/card-transactions";
import { CardOpenDialog } from "@/components/card-open-dialog";
import { CardRechargeDialog } from "@/components/card-recharge-dialog";
import { EditableText } from "@/components/editable-text";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type PlatformFlowType } from "@/data/bill-flows";
import {
  binTitle, type CardBin, type CardFlowItem, type VirtualCard,
} from "@/data/card-business";
import { type DemoContent } from "@/data/content";

type Editable = (key: keyof DemoContent, value: string) => void;
type CardTab = "cards" | "market" | "transactions";
export type ClosedCardRecord = { card: VirtualCard; closedAt: string };
/** 平台余额流水上报：开卡扣费 / 卡充值 / 卡退款 / 销卡退款，由父级写入余额流水。 */
export type PlatformFlowInput = { type: PlatformFlowType; amount: number; balanceAfter: number; note: string };

export function CardModule({
  cards, setCards, flows, setFlows, bins, platformBalance, setPlatformBalance,
  content, editMode, updateContent, onGoTopup, onPlatformFlow,
}: {
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
  const [tab, setTab] = useState<CardTab>("cards");
  const [detailCard, setDetailCard] = useState<VirtualCard | null>(null);
  const [openBin, setOpenBin] = useState<CardBin | null>(null);
  const [fundCard, setFundCard] = useState<VirtualCard | null>(null);
  const [freezeTarget, setFreezeTarget] = useState<VirtualCard | null>(null);
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

  const handleOpenComplete = (bin: CardBin, quantity: number) => {
    const total = Number((bin.openFee * quantity).toFixed(2));
    const newBalance = Number((platformBalance - total).toFixed(2));
    setPlatformBalance(newBalance);
    onPlatformFlow({ type: "card_open", amount: -total, balanceAfter: newBalance, note: `开卡费 · ${binTitle(bin)} × ${quantity} 张` });
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
        holder: "Ava Johnson",
        expMonth: 10,
        expYear: 28,
        cvv: String(Math.floor(Math.random() * 900) + 100),
        balance: 0,
        currency: "USD",
        status: "active",
        createdAt: stamp,
        remark: "",
        billingAddress: {
          line1: "Street -", city: "City -", state: "State -", zip: "Zip Code -",
          country: bin.region === "hk" ? "Hong Kong, China" : "United States",
        },
      });
    }
    setCards((cs) => [...created, ...cs]);
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

  const handleFreeze = (card: VirtualCard) => { setFreezeTarget(card); };
  const confirmFreeze = () => {
    const card = freezeTarget;
    if (!card) return;
    if (card.status === "system_frozen") {
      toast.info("系统冻结的卡片需联系客服处理");
      setFreezeTarget(null);
      return;
    }
    const next = card.status === "frozen" ? "active" : "frozen";
    setCards((cs) => cs.map((c) => c.id === card.id ? { ...c, status: next } : c));
    toast.success(next === "frozen" ? "卡片已冻结" : "卡片已解冻");
    setFreezeTarget(null);
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
  const confirmRefund = () => {
    const card = refundTarget;
    if (!card) return;
    if (card.balance <= 0) {
      toast.info(content.cardRefundEmpty);
      setRefundTarget(null);
      return;
    }
    const amount = card.balance;
    const newBalance = Number((platformBalance + amount).toFixed(2));
    setPlatformBalance(newBalance);
    onPlatformFlow({ type: "card_refund", amount, balanceAfter: newBalance, note: `卡退款 · 尾号 ${card.cardNo.slice(-4)}` });
    setCards((cs) => cs.map((c) => c.id === card.id ? { ...c, balance: 0 } : c));
    setFlows((fs) => [
      {
        id: `CF-TK-${Date.now()}`,
        cardId: card.id,
        time: now(),
        type: "cashout",
        amount,
        balanceAfter: 0,
        merchant: "转出至平台余额",
        status: "success",
        txNo: "—",
      },
      ...fs,
    ]);
    if (detailCard?.id === card.id) setDetailCard({ ...card, balance: 0 });
    toast.success(`退款成功，${amount.toFixed(2)} 美元已退回平台余额`);
    setRefundTarget(null);
  };

  const freezeIsUnfreeze = freezeTarget?.status === "frozen";

  return (
    <section className="card-module">
      <Tabs value={tab} onValueChange={(value) => setTab(value as CardTab)} className="uc-tabs-list card-tabs">
        <TabsList>
          <TabsTrigger value="cards"><Layers aria-hidden="true" />{editable("cardTabCards")}</TabsTrigger>
          <TabsTrigger value="market"><Sparkles aria-hidden="true" />{editable("cardTabMarket")}</TabsTrigger>
          <TabsTrigger value="transactions"><ReceiptText aria-hidden="true" />{editable("cardTabTransactions")}</TabsTrigger>
        </TabsList>
      </Tabs>

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
          onOpenMarket={() => setTab("market")}
          onDetail={setDetailCard}
          onFund={(card) => setFundCard(card)}
          onNote={openNote}
          onRequestFreeze={handleFreeze}
          onRequestDelete={handleDelete}
          content={content}
          editMode={editMode}
          updateContent={updateContent}
        />
      ) : tab === "market" ? (
        <CardMarket
          bins={bins}
          ownedCounts={ownedCounts}
          onOpen={(bin) => setOpenBin(bin)}
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
        />
      )}

      <CardOpenDialog
        bin={openBin}
        availableBalance={platformBalance}
        onOpenChange={(open) => { if (!open) setOpenBin(null); }}
        onComplete={handleOpenComplete}
        onGoTopup={onGoTopup}
        onViewCards={() => { setTab("cards"); setOpenBin(null); }}
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

      <AlertDialog open={Boolean(freezeTarget)} onOpenChange={(open) => !open && setFreezeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{editable(freezeIsUnfreeze ? "cardUnfreezeConfirmTitle" : "cardFreezeConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{editable(freezeIsUnfreeze ? "cardUnfreezeConfirmDescription" : "cardFreezeConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{editable("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="card-freeze-confirm" onClick={confirmFreeze}>{editable("cardConfirmAction")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(refundTarget)} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{editable("cardRefundConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {editable("cardRefundConfirmDescription")}
              {refundTarget ? ` 当前卡内余额 ${refundTarget.balance.toFixed(2)} 美元。` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{editable("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="card-freeze-confirm" onClick={confirmRefund}>{editable("cardConfirmAction")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
