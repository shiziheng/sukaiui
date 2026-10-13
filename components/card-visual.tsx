"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff, Snowflake, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { EditableText } from "@/components/editable-text";
import {
  binTitle, cardStatusMeta, formatCardNumber, maskCardNumber, regionLabel, schemeLabel,
  type CardScheme, type CardStatus, type VirtualCard,
} from "@/data/card-business";
import { type DemoContent } from "@/data/content";

/** 列表里同时显示多张卡，脱敏状态由父级按卡维护。 */
export type RevealMap = Record<string, boolean>;

export async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 非安全上下文会抛错，落到下面的兜底方案 */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export function SchemeBadge({ scheme }: { scheme: CardScheme }) {
  return <span className={`vcard-scheme is-${scheme}`}>{schemeLabel(scheme)}</span>;
}

export function CardStatusTag({ status }: { status: CardStatus }) {
  const meta = cardStatusMeta[status];
  return (
    <span className={`vcard-status is-${meta.tone}`}>
      {status === "frozen" || status === "system_frozen" ? <Snowflake aria-hidden="true" /> : null}
      {status === "processing" ? <i aria-hidden="true" /> : null}
      {meta.label}
    </span>
  );
}

/**
 * 卡片视觉：默认脱敏，显示 / 隐藏由父级控制。
 * list 用于卡片列表，detail 用于卡详情的大卡。
 */
export function CardVisual({
  card,
  variant = "list",
  revealed,
  onToggleReveal,
  content,
  editMode,
  updateContent,
}: {
  card: VirtualCard;
  variant?: "list" | "detail";
  revealed: boolean;
  onToggleReveal: () => void;
  content: DemoContent;
  editMode: boolean;
  updateContent: (key: keyof DemoContent, value: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const dim = card.status === "frozen" || card.status === "system_frozen";

  const handleCopy = async () => {
    const ok = await copyText(card.cardNo);
    if (!ok) {
      toast.error("复制失败，请手动选择卡号");
      return;
    }
    setCopied(true);
    toast.success(content.cardCopied);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={`vcard is-${variant} ${dim ? "is-dimmed" : ""}`} data-scheme={card.scheme}>
      <span className="vcard-accent" aria-hidden="true" />

      <header className="vcard-head">
        <span className="vcard-bin">{binTitle(card)}</span>
        <SchemeBadge scheme={card.scheme} />
      </header>

      <span className="vcard-chip" aria-hidden="true"><i /><i /><i /></span>

      <div className="vcard-number-row">
        <span className="vcard-number">{revealed ? formatCardNumber(card.cardNo) : maskCardNumber(card.cardNo)}</span>
        <span className="vcard-number-tools">
          <button type="button" onClick={onToggleReveal} aria-label={revealed ? content.cardHide : content.cardReveal}>
            {revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            <EditableText active={editMode} value={revealed ? content.cardHide : content.cardReveal} onChange={(value) => updateContent(revealed ? "cardHide" : "cardReveal", value)} />
          </button>
          <button type="button" onClick={handleCopy} aria-label={content.cardCopy}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          </button>
        </span>
      </div>

      <div className="vcard-balance">
        <span><EditableText active={editMode} value={content.cardBalanceLabel} onChange={(value) => updateContent("cardBalanceLabel", value)} /></span>
        <strong>${card.balance.toFixed(2)}</strong>
      </div>

      <footer className="vcard-foot">
        <span><b><EditableText active={editMode} value={content.cardExpLabel} onChange={(value) => updateContent("cardExpLabel", value)} /></b>{String(card.expMonth).padStart(2, "0")}/{card.expYear}</span>
        <span><b><EditableText active={editMode} value={content.cardHolderLabel} onChange={(value) => updateContent("cardHolderLabel", value)} /></b>{card.holder}</span>
        <span className="vcard-region">{regionLabel(card.region)}</span>
      </footer>

      <CardStatusTag status={card.status} />
    </div>
  );
}

/** 详情页的敏感字段行：脱敏 + 显示 / 复制。 */
export function SensitiveRow({
  label,
  value,
  display,
  revealed,
  onToggleReveal,
  onCopy,
}: {
  label: string;
  value: string;
  display: string;
  revealed: boolean;
  onToggleReveal: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="vcard-info-row is-sensitive">
      <dt>{label}</dt>
      <dd>
        <span>{revealed ? value : display}</span>
        <span className="vcard-info-tools">
          <button type="button" onClick={onToggleReveal} aria-label={revealed ? "隐藏" : "显示"}>
            {revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
          <button type="button" onClick={onCopy} aria-label="复制"><Copy aria-hidden="true" /></button>
        </span>
      </dd>
    </div>
  );
}

export function CardNotice({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="vcard-notices">
      {items.map((item) => (
        <li key={item}><TriangleAlert aria-hidden="true" />{item}</li>
      ))}
    </ul>
  );
}
