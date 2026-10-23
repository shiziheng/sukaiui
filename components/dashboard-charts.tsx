"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { ComparePoint, TrendPoint } from "@/data/home-dashboard";

function useMeasuredSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setSize({ width: node.clientWidth, height: node.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, ...size };
}

function shortMoney(value: number) {
  if (value >= 1000) {
    const k = value / 1000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `$${Math.round(value)}`;
}

function exactMoney(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 把峰值换算成整齐的刻度（1 / 2 / 5 × 10^n） */
function niceScale(peak: number, targetTicks = 4) {
  const raw = Math.max(peak, 1) / targetTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2.5 ? 2 : normalized <= 6 ? 5 : 10;
  const step = factor * magnitude;
  const max = Math.ceil(peak / step) * step;
  return { step, max };
}

/** Catmull-Rom → 三次贝塞尔，得到参考图那种柔和曲线 */
function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const tension = 0.16;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) * tension;
    const c1y = p1.y + (p2.y - p0.y) * tension;
    const c2x = p2.x - (p3.x - p1.x) * tension;
    const c2y = p2.y - (p3.y - p1.y) * tension;
    path += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

export function SpendTrendChart({ points }: { points: TrendPoint[] }) {
  const { ref, width, height: boxHeight } = useMeasuredSize();
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, "");

  const height = boxHeight > 180 ? boxHeight : 268;
  const pad = { top: 18, right: 18, bottom: 30, left: 54 };
  const innerW = Math.max(width - pad.left - pad.right, 0);
  const innerH = height - pad.top - pad.bottom;
  const peak = Math.max(...points.map((point) => point.value), 1);
  const { step: yStep, max: yMax } = niceScale(peak);
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;
  const toX = (index: number) => pad.left + (points.length > 1 ? index * step : innerW / 2);
  const toY = (value: number) => pad.top + innerH - (value / yMax) * innerH;

  const coords = points.map((point, index) => ({ x: toX(index), y: toY(point.value) }));
  const linePath = smoothPath(coords);
  const areaPath = coords.length
    ? `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${(pad.top + innerH).toFixed(2)} L ${coords[0].x.toFixed(2)} ${(pad.top + innerH).toFixed(2)} Z`
    : "";

  const ticks = Array.from({ length: Math.floor(yMax / yStep) + 1 }, (_, index) => {
    const value = index * yStep;
    return { value, y: pad.top + innerH - (value / yMax) * innerH };
  });
  const labelEvery = points.length <= 7 ? 1 : Math.ceil(points.length / 7);
  const active = hover === null ? null : points[hover];
  const activePoint = hover === null ? null : coords[hover];
  const previous = hover !== null && hover > 0 ? points[hover - 1].value : null;

  return (
    <div className="dash-trend-plot" ref={ref}>
      {width > 0 ? (
        <svg
          className="dash-trend-svg"
          width={width}
          height={height}
          role="img"
          aria-label="消费金额趋势折线图"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const raw = (event.clientX - rect.left - pad.left) / (step || 1);
            const index = Math.round(raw);
            setHover(Math.min(Math.max(index, 0), points.length - 1));
          }}
        >
          <defs>
            <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b9c81f" stopOpacity="0.26" />
              <stop offset="60%" stopColor="#c8d43d" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#c8d43d" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => (
            <g key={tick.value}>
              <line x1={pad.left} x2={width - pad.right} y1={tick.y} y2={tick.y} stroke="#e7e9e2" strokeDasharray={tick.value === 0 ? undefined : "3 5"} />
              <text x={pad.left - 12} y={tick.y + 4} textAnchor="end" className="dash-axis-text">{shortMoney(tick.value)}</text>
            </g>
          ))}

          {areaPath ? <path d={areaPath} fill={`url(#${gradientId}-area)`} /> : null}
          {linePath ? <path d={linePath} fill="none" stroke="#6d7a00" strokeWidth="2.2" strokeLinecap="round" /> : null}

          {points.length <= 12
            ? coords.map((coord, index) => (
                <circle
                  key={points[index].label}
                  cx={coord.x}
                  cy={coord.y}
                  r={hover === index ? 5 : 3.4}
                  fill="#fff"
                  stroke="#6d7a00"
                  strokeWidth="2"
                />
              ))
            : null}

          {activePoint ? (
            <g>
              <line x1={activePoint.x} x2={activePoint.x} y1={pad.top} y2={pad.top + innerH} stroke="#c3c8ab" strokeDasharray="3 4" />
              <circle cx={activePoint.x} cy={activePoint.y} r="6.5" fill="#f4f7d6" stroke="#6d7a00" strokeWidth="2.2" />
            </g>
          ) : null}

          {points.map((point, index) =>
            index % labelEvery === 0 || index === points.length - 1 ? (
              <text key={point.label} x={toX(index)} y={height - 8} textAnchor="middle" className="dash-axis-text">{point.label}</text>
            ) : null,
          )}
        </svg>
      ) : null}

      {active && activePoint ? (
        <div
          className="dash-trend-tip"
          style={{ left: Math.min(Math.max(activePoint.x, 72), Math.max(width - 72, 72)), top: Math.max(activePoint.y - 12, 4) }}
        >
          <span>{active.label}</span>
          <strong>{exactMoney(active.value)}</strong>
          {previous !== null ? (
            <em className={active.value >= previous ? "is-up" : "is-down"}>
              {active.value >= previous ? "▲" : "▼"} {Math.abs(((active.value - previous) / previous) * 100).toFixed(1)}%
            </em>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SparkLine({ values }: { values: number[] }) {
  const gradientId = useId().replace(/:/g, "");
  const width = 100;
  const height = 40;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const coords = values.map((value, index) => ({
    x: (index / (values.length - 1)) * width,
    y: height - 4 - ((value - min) / span) * (height - 10),
  }));
  const path = smoothPath(coords);

  return (
    <svg className="dash-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${gradientId}-spark`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dfff00" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#dfff00" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${gradientId}-spark)`} />
      <path d={path} fill="none" stroke="#dfff00" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  );
}

export function RechargeSpendChart({ points }: { points: ComparePoint[] }) {
  const peak = Math.max(...points.flatMap((point) => [point.recharge, point.spend]));
  const { step, max: yMax } = niceScale(peak);
  const ticks = Array.from({ length: Math.floor(yMax / step) + 1 }, (_, index) => (yMax / step - index) * step);

  return (
    <div className="dash-bars">
      <div className="dash-bars-axis">
        {ticks.map((tick) => <span key={tick}>{shortMoney(tick)}</span>)}
      </div>
      <div className="dash-bars-plot">
        <div className="dash-bars-grid" aria-hidden="true">
          {ticks.map((tick) => <i key={tick} />)}
        </div>
        {points.map((point) => (
          <div className="dash-bar-col" key={point.label}>
            <div className="dash-bar-tip">
              <span>{point.label}</span>
              <strong><i className="is-recharge" />充值 {exactMoney(point.recharge)}</strong>
              <strong><i className="is-spend" />消费 {exactMoney(point.spend)}</strong>
            </div>
            <div className="dash-bar-pair">
              <i className="dash-bar is-recharge" style={{ height: `${(point.recharge / yMax) * 100}%` }} />
              <i className="dash-bar is-spend" style={{ height: `${(point.spend / yMax) * 100}%` }} />
            </div>
            <span className="dash-bar-label">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
