"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CreditCard, Search, Sparkles } from "lucide-react";

import { CardNotice, SchemeBadge } from "@/components/card-visual";
import { EditableText } from "@/components/editable-text";
import { Button } from "@/components/ui/button";
import {
  binTitle, money, regionLabel, remainingStock, schemeLabel, totalRemainingStock, type CardBin, type CardRegion, type CardScheme,
} from "@/data/card-business";
import { type DemoContent } from "@/data/content";

type SchemeFilter = "all" | CardScheme;
type RegionFilter = "all" | CardRegion;

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

  const visibleBins = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return bins.filter((bin) => {
      if (scheme !== "all" && bin.scheme !== scheme) return false;
      if (region !== "all" && bin.region !== region) return false;
      if (!query) return true;
      return [binTitle(bin), bin.bin, bin.cardType, ...bin.scenes].join(" ").toLowerCase().includes(query);
    });
  }, [bins, keyword, region, scheme]);

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

      {visibleBins.length ? (
        <div className="vbin-grid">
          {visibleBins.map((bin) => {
            const rest = remainingStock(bin, ownedCounts[bin.id] ?? 0);
            return (
              <article className={`vbin-card ${bin.recommended ? "is-recommended" : ""}`} key={bin.id}>
                <header className="vbin-card-head">
                  <h3>{binTitle(bin)}</h3>
                  <div className="vbin-card-badges">
                    {bin.recommended ? <span className="vbin-recommend"><Sparkles aria-hidden="true" />推荐</span> : null}
                    <SchemeBadge scheme={bin.scheme} />
                  </div>
                </header>

                <div className="vbin-tags">
                  <span className="vbin-tag is-type">{bin.cardType}</span>
                  {bin.scenes.map((scene) => <span className="vbin-tag" key={scene}>{scene}</span>)}
                  <span className="vbin-tag is-support">{content.cardSupportRecharge}</span>
                </div>

                {bin.restrictions.length ? (
                  <div className="vbin-notice-block">
                    <CardNotice items={bin.restrictions} />
                  </div>
                ) : null}

                <div className="vbin-pricing">
                  <p className="vbin-price-line">
                    <span className="vbin-price-label">{editable("cardOpenFee")}</span>
                    <span className="vbin-price-value">{money(bin.openFee)}</span>
                    <small>/ 张</small>
                  </p>
                  {bin.rechargeFeePercent > 0 ? (
                    <p className="vbin-price-sub">
                      <span>{editable("cardRechargeFeeLabel")}</span>
                      <strong>{bin.rechargeFeePercent}%</strong>
                    </p>
                  ) : null}
                  {bin.consumeFee.fixed > 0 ? (
                    <p className="vbin-fee-extra">
                      {bin.smallAmountFeeThreshold
                        ? `低于 ${money(bin.smallAmountFeeThreshold)} 收 ${money(bin.consumeFee.fixed)}/笔`
                        : `消费手续费 ${money(bin.consumeFee.fixed)}/笔`}
                    </p>
                  ) : null}
                </div>

                <div className="vbin-meta-row">
                  <span>
                    {regionLabel(bin.region)}
                    <i className="vbin-meta-sep">·</i>
                    剩余 <em className={rest <= 20 ? "is-low" : ""}>{rest}</em> 张
                  </span>
                  <code>BIN {bin.bin}</code>
                </div>

                {bin.subscriptionPrices?.length ? (
                  <div className="vbin-sub">
                    <p className="vbin-sub-head"><span className="vbin-sub-dot" aria-hidden="true" />OpenAI 最新</p>
                    {bin.subscriptionPrices.map((item) => (
                      <p className="vbin-sub-row" key={item.label}>
                        <span>{item.label} <em>{money(item.price)}</em></span>
                        <time>{item.date}</time>
                      </p>
                    ))}
                  </div>
                ) : null}

                <div className="vbin-card-foot">
                  <Button className="vbin-open-button" disabled={rest <= 0} onClick={() => onOpen(bin)}>
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
