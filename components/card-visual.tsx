"use client";

import { Copy, Eye, EyeOff, Snowflake, TriangleAlert } from "lucide-react";

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
 * 列表里的卡片：浅色信息卡，只靠字号和颜色分层，不再画一整块深色卡面。
 * 数据项一个不少：状态、卡组织、发行地、余额、卡号（前 4 后 4）、BIN、有效期、持卡人。
 * 完整卡面留给详情页，列表这里只需要"扫一眼找到卡"。
 */
export function CardVisual({
  card,
  revealed = false,
  content,
  editMode,
  updateContent,
}: {
  card: VirtualCard;
  variant?: "list" | "detail";
  revealed?: boolean;
  onToggleReveal?: () => void;
  content: DemoContent;
  editMode: boolean;
  updateContent: (key: keyof DemoContent, value: string) => void;
}) {
  const meta = cardStatusMeta[card.status];
  const frozen = card.status === "frozen" || card.status === "system_frozen";

  return (
    <>
      <header className="vlc-top">
        <span className={`vlc-status is-${meta.tone}`}>
          {frozen ? <Snowflake aria-hidden="true" /> : null}
          <i aria-hidden="true" />
          {meta.label}
        </span>
        <span className="vlc-org">{schemeLabel(card.scheme)} · {regionLabel(card.region)}</span>
      </header>

      <div className="vlc-balance">
        <span>
          <EditableText active={editMode} value={content.cardBalanceLabel} onChange={(value) => updateContent("cardBalanceLabel", value)} />
        </span>
        <strong>${card.balance.toFixed(2)}</strong>
      </div>

      <div className="vlc-no">{revealed ? formatCardNumber(card.cardNo) : maskCardNumber(card.cardNo)}</div>

      <p className="vlc-meta">
        <span className="vlc-bin">{binTitle(card)}</span>
        <span className="vlc-dot" aria-hidden="true" />
        <span>
          <b><EditableText active={editMode} value={content.cardExpLabel} onChange={(value) => updateContent("cardExpLabel", value)} /></b>
          {String(card.expMonth).padStart(2, "0")}/{card.expYear}
        </span>
        <span className="vlc-dot" aria-hidden="true" />
        <span>
          <b><EditableText active={editMode} value={content.cardHolderLabel} onChange={(value) => updateContent("cardHolderLabel", value)} /></b>
          {card.holder}
        </span>
      </p>
    </>
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

/**
 * 详情页的深色卡面：全站唯一一处「实体会员卡」。
 * 列表页不用它——那里只需要信息卡。这里保留卡组织、芯片、卡号、有效期、持卡人、发卡地。
 */
export function CardFace({ card, revealed = false }: { card: VirtualCard; revealed?: boolean }) {
  return (
    <div className="vcard-hero">
      <div className="vh-top">
        <span className="vh-org">{schemeLabel(card.scheme)}</span>
        <span className="vh-chip" aria-hidden="true" />
      </div>
      <div className="vh-no">{revealed ? formatCardNumber(card.cardNo) : maskCardNumber(card.cardNo)}</div>
      <div className="vh-bottom">
        <div>
          <span>有效期</span>
          <b>{String(card.expMonth).padStart(2, "0")}/{card.expYear}</b>
        </div>
        <div>
          <span>持卡人</span>
          <b>{card.holder}</b>
        </div>
        <div className="is-end">
          <span>发卡地</span>
          <b>{regionLabel(card.region)}</b>
        </div>
      </div>
    </div>
  );
}
