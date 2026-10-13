"use client";

import { useMemo, useState } from "react";
import { CreditCard, Search, Sparkles } from "lucide-react";

import { CardNotice, SchemeBadge } from "@/components/card-visual";
import { EditableText } from "@/components/editable-text";
import { Button } from "@/components/ui/button";
import {
  binTitle, money, regionLabel, remainingStock, schemeLabel, type CardBin, type CardRegion, type CardScheme,
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

  return (
    <section className="vbin-panel">
      <header className="vbin-panel-head">
        <div className="vbin-panel-copy">
          <span className="section-title-icon"><CreditCard aria-hidden="true" /></span>
          <div>
            <h2>{editable("cardMarketTitle")}</h2>
            <p>{editable("cardMarketSubtitle")}</p>
          </div>
        </div>
        <span className="vbin-count">共 {visibleBins.length} 个卡段</span>
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

                <CardNotice items={bin.restrictions} />

                <dl className="vbin-fees">
                  <div>
                    <dt>{editable("cardOpenFee")}</dt>
                    <dd>{money(bin.openFee)} <small>/ 张</small></dd>
                  </div>
                  <div>
                    <dt>{editable("cardRechargeFeeLabel")}</dt>
                    <dd>{bin.rechargeFeePercent}%</dd>
                  </div>
                </dl>

                <dl className="vbin-meta">
                  <div><dt>{editable("cardRegionLabel")}</dt><dd>{regionLabel(bin.region)}</dd></div>
                  <div><dt>BIN</dt><dd><code>{bin.bin}</code></dd></div>
                  <div><dt>{editable("cardRemaining")}</dt><dd className={rest <= 20 ? "is-low" : ""}>{rest} 张</dd></div>
                </dl>

                <div className="vbin-card-foot">
                  <Button className="vbin-open-button" disabled={rest <= 0} onClick={() => onOpen(bin)}>
                    {rest > 0 ? editable("cardOpenNow") : "已开完"}
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
