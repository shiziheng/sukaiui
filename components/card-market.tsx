"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, CreditCard, Info, Search, Sparkles, TriangleAlert } from "lucide-react";

import { SchemeBadge } from "@/components/card-visual";
import { EditableText } from "@/components/editable-text";
import { Button } from "@/components/ui/button";
import {
  binDisplayName, money, regionLabel, remainingStock, schemeLabel, totalRemainingStock,
  type CardBin, type CardRegion, type CardScheme,
} from "@/data/card-business";
import { type DemoContent } from "@/data/content";

type SchemeFilter = "all" | CardScheme;
type RegionFilter = "all" | CardRegion;
/** 用户视角的用途筛选：按「我要拿它干什么」分，而不是按卡组织分。 */
type PurposeFilter = "all" | "chatgpt" | "claude" | "ads" | "general";
type SortMode = "recommended" | "fee" | "stock";

const purposeOptions: Array<{ id: PurposeFilter; label: string }> = [
  { id: "all", label: "全部用途" },
  { id: "chatgpt", label: "开 ChatGPT" },
  { id: "claude", label: "开 Claude" },
  { id: "ads", label: "广告投放" },
  { id: "general", label: "普通消费" },
];

const sortOptions: Array<{ id: SortMode; label: string }> = [
  { id: "recommended", label: "推荐优先" },
  { id: "fee", label: "开卡费从低到高" },
  { id: "stock", label: "剩余最多优先" },
];

function matchesPurpose(bin: CardBin, purpose: PurposeFilter) {
  if (purpose === "all") return true;
  const scenes = bin.scenes.join(" ");
  if (purpose === "chatgpt") return scenes.includes("ChatGPT") || scenes.includes("AI 订阅");
  if (purpose === "claude") return !bin.restrictions.some((item) => item.includes("禁止") && item.includes("Claude"));
  if (purpose === "ads") return scenes.includes("广告投放");
  return scenes.includes("通用消费") || scenes.includes("常规线上消费") || scenes.includes("谷歌");
}

export function CardMarket({
  bins,
  ownedCounts,
  onOpen,
  content,
  editMode,
  updateContent,
}: {
  bins: CardBin[];
  ownedCounts: Record<string, number>;
  onOpen: (bin: CardBin) => void;
  content: DemoContent;
  editMode: boolean;
  updateContent: (key: keyof DemoContent, value: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [scheme, setScheme] = useState<SchemeFilter>("all");
  const [region, setRegion] = useState<RegionFilter>("all");
  const [purpose, setPurpose] = useState<PurposeFilter>("all");
  const [sort, setSort] = useState<SortMode>("recommended");

  const visibleBins = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return bins.filter((bin) => {
      if (scheme !== "all" && bin.scheme !== scheme) return false;
      if (region !== "all" && bin.region !== region) return false;
      if (!matchesPurpose(bin, purpose)) return false;
      if (!query) return true;
      return [binDisplayName(bin), bin.bin, bin.cardType, ...bin.scenes].join(" ").toLowerCase().includes(query);
    });
  }, [bins, keyword, purpose, region, scheme]);

  /** 一个卡段一张卡，不做同参数聚合（用户确认过同参数卡也分开铺）。 */
  const groups = useMemo(() => {
    const list = visibleBins.map((bin) => ({
      key: bin.id,
      active: bin,
      subscription: bin.subscriptionPrices,
      rest: remainingStock(bin, ownedCounts[bin.id] ?? 0),
      recommended: bin.recommended,
    }));

    if (sort === "fee") {
      list.sort((a, b) => a.active.openFee - b.active.openFee || b.rest - a.rest);
    } else if (sort === "stock") {
      list.sort((a, b) => b.rest - a.rest);
    } else {
      list.sort((a, b) => Number(b.recommended) - Number(a.recommended) || a.active.openFee - b.active.openFee || b.rest - a.rest);
    }
    return list;
  }, [visibleBins, ownedCounts, sort]);

  /** 一屏只留一个实心按钮：推荐卡优先，没有推荐卡就第一张。 */
  const primaryKey = (groups.find((group) => group.recommended) ?? groups[0])?.key;

  const editable = (key: keyof DemoContent) => (
    <EditableText active={editMode} value={content[key]} onChange={(value) => updateContent(key, value)} />
  );

  const overallRest = totalRemainingStock(bins, ownedCounts);

  return (
    <section className="vbin-panel">
      <header className="vbin-panel-head">
        <div className="vbin-panel-copy">
          <span className="section-title-icon"><CreditCard aria-hidden="true" /></span>
          <div>
            <h2>{editable("cardMarketTitle")}</h2>
            <p>{editable("cardMarketSubtitle")}<span className="vbin-fee-inline">{editable("cardFeeExternal")}</span></p>
          </div>
        </div>
        <div className="vbin-head-stats">
          <span className="vbin-count">共 {visibleBins.length} 个卡段</span>
          <span className="vbin-count is-stock">{editable("cardOverallStock")} · <strong>{overallRest}</strong> 张</span>
        </div>
      </header>

      <div className="vbin-filters">
        <label className="vbin-search">
          <Search aria-hidden="true" />
          <input
            value={keyword}
            placeholder={content.cardSearchPlaceholder}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
        <select className="vbin-select" value={purpose} onChange={(event) => setPurpose(event.target.value as PurposeFilter)} aria-label="按用途筛选">
          {purposeOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
        <select className="vbin-select" value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="排序方式">
          {sortOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
        <select className="vbin-select" value={scheme} onChange={(event) => setScheme(event.target.value as SchemeFilter)} aria-label="卡组织">
          <option value="all">{content.cardAllScheme}</option>
          <option value="visa">{schemeLabel("visa")}</option>
          <option value="mastercard">{schemeLabel("mastercard")}</option>
        </select>
        <select className="vbin-select" value={region} onChange={(event) => setRegion(event.target.value as RegionFilter)} aria-label="发行地">
          <option value="all">{content.cardAllRegion}</option>
          <option value="us">{regionLabel("us")}</option>
          <option value="hk">{regionLabel("hk")}</option>
        </select>
      </div>

      {groups.length ? (
        <div className="vbin-grid">
          {groups.map((group) => {
            const bin = group.active;
            const rest = remainingStock(bin, ownedCounts[bin.id] ?? 0);
            const isPrimary = group.key === primaryKey && group.rest > 0;
            const latestDate = group.subscription?.reduce((max, item) => (item.date > max ? item.date : max), "") ?? "";

            return (
              <article className={`vbin-card ${group.recommended ? "is-recommended" : ""}`} key={group.key}>
                <header className="vbin-card-head">
                  <div className="vbin-card-title">
                    <h3>{binDisplayName(bin)}</h3>
                    <p>{regionLabel(bin.region)} · {bin.cardType} · BIN {bin.bin}</p>
                  </div>
                  <div className="vbin-card-badges">
                    {group.recommended ? <span className="vbin-recommend"><Sparkles aria-hidden="true" />推荐</span> : null}
                    <SchemeBadge scheme={bin.scheme} />
                  </div>
                </header>

                <div className="vbin-price-row">
                  <p className="vbin-price-line">
                    <span className="vbin-price-value">{money(bin.openFee)}</span>
                    <span className="vbin-price-unit">{editable("cardOpenFee")}</span>
                  </p>
                  <span className="vbin-price-note">
                    {bin.rechargeFeePercent > 0 ? `${content.cardRechargeFeeLabel} ${bin.rechargeFeePercent}%` : "充值 0 费"}
                  </span>
                </div>

                <ul className="vbin-feature-row">
                  {bin.scenes.map((scene) => <li key={scene}><Check aria-hidden="true" />{scene}</li>)}
                </ul>

                {bin.restrictions.length ? (
                  <p className="vbin-limit-line">
                    <TriangleAlert aria-hidden="true" />
                    <span>{bin.restrictions.join("；")}</span>
                  </p>
                ) : (
                  <p className="vbin-limit-line is-clear"><Check aria-hidden="true" /><span>无额外使用限制</span></p>
                )}

                {bin.consumeFee.fixed > 0 ? (
                  <p className="vbin-fee-note">
                    <Info aria-hidden="true" />
                    {bin.smallAmountFeeThreshold
                      ? `低于 ${money(bin.smallAmountFeeThreshold)} 的消费按 ${money(bin.consumeFee.fixed)}/笔 收取`
                      : `消费手续费 ${money(bin.consumeFee.fixed)}/笔`}
                  </p>
                ) : null}

                {group.subscription?.length ? (
                  <p className="vbin-sub-inline">
                    <span>OpenAI 订阅价</span>
                    {group.subscription.map((item) => (
                      <b key={item.label}>{item.label} {money(item.price)}</b>
                    ))}
                    {latestDate ? <time>{latestDate} 更新</time> : null}
                  </p>
                ) : null}

                <div className="vbin-card-foot">
                  <span className="vbin-stock">
                    剩余 <strong className={group.rest <= 20 ? "is-low" : ""}>{group.rest}</strong> 张
                  </span>
                  <Button
                    className={`vbin-open-button ${isPrimary ? "" : "is-plain"}`}
                    disabled={rest <= 0}
                    onClick={() => onOpen(bin)}
                  >
                    {rest > 0 ? <>{editable("cardOpenNow")}<ArrowRight aria-hidden="true" /></> : "已开完"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="uc-empty vbin-empty">
          <CreditCard aria-hidden="true" />
          <strong>{editable("cardEmptyBins")}</strong>
          <p>{editable("cardEmptyBinsHint")}</p>
        </div>
      )}
    </section>
  );
}
