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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  binTitle, type CardBin, type CardFlowItem, type VirtualCard,
} from "@/data/card-business";
import { type DemoContent } from "@/data/content";

type Editable = (key: keyof DemoContent, value: string) => void;
type CardTab = "cards" | "market" | "transactions";
export type ClosedCardRecord = { card: VirtualCard; closedAt: string };

export function CardModule({
  cards, setCards, flows, setFlows, bins, platformBalance, setPlatformBalance,
  content, editMode, updateContent, onGoTopup,
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
}) {
  const [tab, setTab] = useState<CardTab>("cards");
  const [detailCard, setDetailCard] = useState<VirtualCard | null>(null);
  const [openBin, setOpenBin] = useState<CardBin | null>(null);
  const [fundCard, setFundCard] = useState<VirtualCard | null>(null);
  const [freezeTarget, setFreezeTarget] = useState<VirtualCard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VirtualCard | null>(null);
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
    setPlatformBalance((wb) => Number((wb - total).toFixed(2)));
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
    setPlatformBalance((wb) => Number((wb - amount).toFixed(2)));
    const stamp = now();
    const newBalance = Number((card.balance + amount).toFixed(2));
    setCards((cs) => cs.map((c) => c.id === card.id ? { ...c, balance: newBalance } : c));
    setFlows((fs) => [
      {
        id: `CF-KC-${Date.now()}`,
        cardId: card.id,
        time: stamp,
        type: "recharge",
        amount,
        balanceAfter: newBalance,
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
    setPlatformBalance((wb) => Number((wb + card.balance).toFixed(2)));
    setClosedRecords((records) => [{ card, closedAt: now() }, ...records]);
    setCards((cs) => cs.filter((c) => c.id !== card.id));
    setFlows((fs) => fs.filter((f) => f.cardId !== card.id));
    if (detailCard?.id === card.id) setDetailCard(null);
    toast.success("卡片已注销，余额已退回平台余额");
    setDeleteTarget(null);
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
          platformBalance={platformBalance}
          onOpenMarket={() => setTab("market")}
          onDetail={setDetailCard}
          onFund={(card) => setFundCard(card)}
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
    </section>
  );
}
