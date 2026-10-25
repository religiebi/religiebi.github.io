import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { scaleLinear } from 'd3-scale';
import { NOW, dataset, groupLabel, traditionById, branchById } from '../data/load.ts';
import type { Branch, Tradition } from '../data/types.ts';
import { useApp } from '../hooks/useSelection.ts';
import { useViewState, type ViewStore } from '../hooks/viewStore.ts';
import { useZoom } from '../hooks/useZoom.ts';
import { formatRange, formatTick, formatYearApprox, tickStep, ticks } from '../lib/format.ts';
import {
  AXIS_H,
  BAR_H,
  computeRails,
  computeRows,
  placeLabel,
  type Rail,
  type Row,
} from '../lib/layout.ts';
import { frameBranch, frameTradition, scrollToShow, type YearWindow } from '../lib/view.ts';
import { t } from '../i18n/t.ts';
import { RAIL_STYLE, groupColor, groupFill } from './railStyle.ts';

const ERAS: { key: string; from: number; to: number }[] = [
  { key: 'era.antiquity', from: -Infinity, to: 500 },
  { key: 'era.medieval', from: 500, to: 1500 },
  { key: 'era.earlyModern', from: 1500, to: 1800 },
  { key: 'era.modern', from: 1800, to: Infinity },
];

/** Lanes beyond this count are culled when off-screen vertically. */
const CULL_THRESHOLD = 80;

function useSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry!.contentRect;
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** Measures label widths with a canvas; re-measures once web fonts have loaded. */
function useLabelWidths(names: string[]) {
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let live = true;
    document.fonts?.ready.then(() => live && setFontsReady(true));
    return () => {
      live = false;
    };
  }, []);
  return useMemo(() => {
    const ctx = document.createElement('canvas').getContext('2d');
    const font = getComputedStyle(document.documentElement).getPropertyValue('--font-sans');
    const widths = new Map<string, number>();
    for (const n of names) {
      if (ctx) {
        ctx.font = `500 12px ${font || 'sans-serif'}`;
        widths.set(n, ctx.measureText(n).width);
      } else widths.set(n, n.length * 6.6);
    }
    return widths;
    // fontsReady triggers a re-measure with the real font metrics
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names, fontsReady]);
}

export interface ChartProps {
  store: ViewStore;
  domain: YearWindow;
}

export function Chart({ store, domain }: ChartProps) {
  const [wrapRef, size] = useSize<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = size.w;
  const plotH = Math.max(0, size.h - AXIS_H);

  const {
    rows,
    laneCenter,
    height: contentHeight,
  } = useMemo(() => computeRows(dataset.traditions, dataset.families), []);
  const rails = useMemo(() => computeRails(dataset.branches, laneCenter), [laneCenter]);
  const names = useMemo(() => dataset.traditions.map((d) => d.name), []);
  const labelWidths = useLabelWidths(names);

  const controls = useZoom(svgRef, { width, height: plotH, contentHeight, domain, store });
  const { win, scrollY } = useViewState(store);

  const selectedId = useApp((s) => s.selectedId);
  const focusBranchId = useApp((s) => s.focusBranchId);
  const lin = useApp((s) => s.lineage);
  const families = useApp((s) => s.families);
  const query = useApp((s) => s.query);
  const results = useApp((s) => s.results);
  const fly = useApp((s) => s.fly);
  const view = useApp((s) => s.view);
  const aboutOpen = useApp((s) => s.aboutOpen);
  const guideOpen = useApp((s) => s.guideOpen);
  const selectTradition = useApp((s) => s.selectTradition);
  const selectBranch = useApp((s) => s.selectBranch);
  const clearSelection = useApp((s) => s.clearSelection);

  // Fly to whatever the app asked for (selection, search, deep link).
  const ready = width > 0 && plotH > 0;
  useEffect(() => {
    if (!fly || !ready) return;
    const lane = (id: string) => laneCenter.get(id) ?? 0;
    if (fly.kind === 'tradition') {
      const tr = traditionById.get(fly.id);
      if (!tr) return;
      const y = lane(tr.id);
      const scroll = scrollToShow(y - 40, y + 40, plotH, contentHeight, store.get().scrollY);
      controls.flyTo(frameTradition(tr, NOW), scroll, fly.animate);
    } else {
      const b = branchById.get(fly.id);
      if (!b) return;
      const scroll = scrollToShow(
        lane(b.from),
        lane(b.to),
        plotH,
        contentHeight,
        store.get().scrollY,
      );
      controls.flyTo(frameBranch(b, traditionById.get(b.to), NOW), scroll, fly.animate);
    }
    // Only react to new requests (nonce) or the chart becoming ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fly?.nonce, ready]);

  // Keyboard navigation for the chart (ignored while typing or when another view is open).
  useEffect(() => {
    if (view !== 'chart' || aboutOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) {
        if (e.key === 'Escape' && el.closest('[role="dialog"]')) return;
        if (e.key !== 'Escape' || el.tagName === 'INPUT') return;
      }
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const step = width * 0.15;
      switch (e.key) {
        case 'ArrowLeft':
          controls.panBy(-step);
          break;
        case 'ArrowRight':
          controls.panBy(step);
          break;
        case 'ArrowUp':
          controls.panBy(0, -60);
          break;
        case 'ArrowDown':
          controls.panBy(0, 60);
          break;
        case '+':
        case '=':
          controls.zoomBy(1.6);
          break;
        case '-':
        case '_':
          controls.zoomBy(1 / 1.6);
          break;
        case '0':
          controls.fit();
          break;
        case 'Escape':
          if (guideOpen) return;
          clearSelection();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [controls, width, view, aboutOpen, guideOpen, clearSelection]);

  const x = useMemo(() => scaleLinear().domain(win).range([0, width]), [win, width]);
  const pxPerYear = width / Math.max(1e-9, win[1] - win[0]);
  const step = tickStep(pxPerYear);
  const tickValues = ticks(win[0], win[1], step);
  const clampX = (v: number) => Math.max(-40, Math.min(width + 40, v));

  // Dimming: lineage, family filter and search all dim rather than hide.
  const famOn = new Set(families);
  const matchT = query.trim() ? new Set(results.traditions) : null;
  const matchB = query.trim() ? new Set(results.branches) : null;
  const dimTradition = (tr: Tradition) =>
    !famOn.has(tr.family) || (matchT && !matchT.has(tr.id)) || (lin && !lin.traditions.has(tr.id));
  const dimBranch = (b: Branch) => {
    const child = traditionById.get(b.to);
    return (
      (child && !famOn.has(child.family)) ||
      (matchB && !matchB.has(b.id) && !matchT!.has(b.to)) ||
      (lin && !lin.branches.has(b.id))
    );
  };

  const cull = dataset.traditions.length > CULL_THRESHOLD;
  const yMin = scrollY - 60;
  const yMax = scrollY + plotH + 60;
  const visibleRow = (r: Row) =>
    !cull ||
    (r.y + r.h >= yMin && r.y <= yMax) ||
    (r.kind === 'lane' && r.tradition.id === selectedId);
  const visibleRail = (r: Rail) => {
    const top = Math.min(r.y1, r.y2);
    const bottom = Math.max(r.y1, r.y2);
    return bottom >= yMin && top <= yMax;
  };

  const ensureVisible = (id: string) => {
    const y = laneCenter.get(id);
    if (y === undefined) return;
    const target = scrollToShow(y - 20, y + 20, plotH, contentHeight, store.get().scrollY);
    if (target !== store.get().scrollY) controls.panBy(0, target - store.get().scrollY);
  };

  // When the chart shrinks (e.g. the mobile detail sheet opens), keep the selection in view.
  useEffect(() => {
    if (selectedId && ready) ensureVisible(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotH]);

  const onBarKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectTradition(id);
    }
  };

  const todayX = x(NOW);
  const labelEls: ReactNode[] = [];
  const maxScroll = Math.max(0, contentHeight - plotH);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-canvas">
      {ready && (
        <svg
          ref={svgRef}
          className="chart-svg"
          width={width}
          height={size.h}
          role="group"
          aria-label={t('chart.label')}
        >
          <defs>
            <clipPath id="plot-clip">
              <rect x={0} y={AXIS_H} width={width} height={plotH} />
            </clipPath>
          </defs>

          <g clipPath="url(#plot-clip)">
            {/* Era bands */}
            {ERAS.map((era, i) => {
              const x0 = clampX(x(Math.max(era.from, domain[0])));
              const x1 = clampX(x(Math.min(era.to, domain[1])));
              return i % 2 === 1 && x1 > x0 ? (
                <rect
                  key={era.key}
                  x={x0}
                  y={AXIS_H}
                  width={x1 - x0}
                  height={plotH}
                  fill="var(--band)"
                />
              ) : null;
            })}
            {/* Grid */}
            {tickValues.map((v) => (
              <line
                key={v}
                x1={x(v)}
                x2={x(v)}
                y1={AXIS_H}
                y2={AXIS_H + plotH}
                stroke="var(--grid)"
                strokeWidth={1}
              />
            ))}

            <g transform={`translate(0, ${AXIS_H - scrollY})`}>
              {/* Family headers */}
              {rows.map((r) =>
                r.kind === 'family' && visibleRow(r) ? (
                  <g key={`f-${r.family.id}`}>
                    <line x1={0} x2={width} y1={r.y + 0.5} y2={r.y + 0.5} stroke="var(--border)" />
                    <text x={10} y={r.y + 16} className="chart-family halo">
                      {r.family.label}
                    </text>
                  </g>
                ) : null,
              )}

              {/* Rails (below bars) */}
              {rails.map((r) => {
                const rx = x(r.year) + r.offset;
                if (rx < -20 || rx > width + 20 || !visibleRail(r)) return null;
                const child = traditionById.get(r.branch.to);
                const parent = traditionById.get(r.branch.from);
                const style = RAIL_STYLE[r.branch.type];
                const focused = focusBranchId === r.branch.id;
                const color = groupColor(child?.group ?? '');
                return (
                  <g
                    key={r.branch.id}
                    className={`rail dimmable ${dimBranch(r.branch) ? 'is-dim' : ''}`}
                    onClick={() => selectBranch(r.branch.id)}
                  >
                    <title>
                      {t('chart.railLabel', {
                        from: parent?.name ?? '',
                        to: child?.name ?? '',
                        year: formatYearApprox(r.year, r.branch.approx),
                        type: t(`type.${r.branch.type}`).toLowerCase(),
                      })}
                    </title>
                    <line className="rail-hit" x1={rx} x2={rx} y1={r.y1} y2={r.y2} />
                    <line
                      className="rail-line"
                      x1={rx}
                      x2={rx}
                      y1={r.y1}
                      y2={r.y2}
                      stroke={color}
                      strokeWidth={style.width + (focused ? 1.5 : 0)}
                      strokeDasharray={style.dash}
                      strokeLinecap={style.cap ?? 'butt'}
                    />
                  </g>
                );
              })}

              {/* Bars and labels */}
              {rows.map((r) => {
                if (r.kind !== 'lane' || !visibleRow(r)) return null;
                const tr = r.tradition;
                const xs = x(tr.start);
                const xe = x(tr.end ?? NOW);
                const bx0 = clampX(xs);
                const bx1 = clampX(xe);
                const w = labelWidths.get(tr.name) ?? 80;
                const label = placeLabel({
                  barStart: xs,
                  barEnd: xe,
                  labelWidth: w,
                  viewStart: 0,
                  viewEnd: width,
                });
                const selected = selectedId === tr.id;
                const range = formatRange(tr.start, tr.end, tr.approx, t('panel.today'));
                return (
                  <g
                    key={tr.id}
                    className={`bar dimmable ${selected ? 'is-selected' : ''} ${dimTradition(tr) ? 'is-dim' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    aria-label={t('chart.barLabel', {
                      name: tr.name,
                      range,
                      group: groupLabel.get(tr.group) ?? tr.group,
                    })}
                    onClick={() => selectTradition(tr.id)}
                    onKeyDown={(e) => onBarKey(e, tr.id)}
                    onFocus={() => ensureVisible(tr.id)}
                  >
                    {/* invisible lane-height hit area makes small bars easy to click */}
                    <rect
                      x={bx0}
                      y={r.y + 2}
                      width={Math.max(0, bx1 - bx0)}
                      height={r.h - 4}
                      fill="transparent"
                    />
                    <rect
                      className="bar-rect"
                      x={bx0}
                      y={r.cy - BAR_H / 2}
                      width={Math.max(1, bx1 - bx0)}
                      height={BAR_H}
                      rx={2}
                      fill={groupFill(tr.group)}
                      stroke={groupColor(tr.group)}
                      strokeWidth={selected ? 2.25 : 1.25}
                    />
                    {tr.approx && xs > -40 && (
                      // Approximate start: a soft dashed cap instead of a hard edge.
                      <line
                        x1={xs}
                        x2={xs}
                        y1={r.cy - BAR_H / 2 - 3}
                        y2={r.cy + BAR_H / 2 + 3}
                        stroke={groupColor(tr.group)}
                        strokeWidth={1}
                        strokeDasharray="2 2"
                      />
                    )}
                    <rect
                      className="bar-focus"
                      x={bx0 - 3}
                      y={r.cy - BAR_H / 2 - 3}
                      width={Math.max(1, bx1 - bx0) + 6}
                      height={BAR_H + 6}
                      rx={4}
                    />
                    {(() => {
                      // Labels go in their own top layer so junction dots never cover them.
                      if (label.visible)
                        labelEls.push(
                          <text
                            key={tr.id}
                            x={label.x}
                            y={r.cy + 4}
                            textAnchor={label.anchor}
                            className={`chart-label halo dimmable pointer-events-none ${dimTradition(tr) ? 'is-dim' : ''}`}
                            fontWeight={selected ? 700 : undefined}
                            aria-hidden="true"
                          >
                            {tr.name}
                          </text>,
                        );
                      return null;
                    })()}
                  </g>
                );
              })}

              {/* Junction dots (above bars) */}
              {rails.map((r) => {
                const rx = x(r.year) + r.offset;
                if (rx < -10 || rx > width + 10 || !visibleRail(r)) return null;
                const child = traditionById.get(r.branch.to);
                return (
                  <circle
                    key={`j-${r.branch.id}`}
                    className={`dimmable pointer-events-none ${dimBranch(r.branch) ? 'is-dim' : ''}`}
                    cx={rx}
                    cy={r.y1}
                    r={r.branch.type === 'influence' ? 2.5 : 3.5}
                    fill={
                      r.branch.type === 'influence' ? 'var(--bg)' : groupColor(child?.group ?? '')
                    }
                    stroke={
                      r.branch.type === 'influence' ? groupColor(child?.group ?? '') : 'var(--bg)'
                    }
                    strokeWidth={1.5}
                  />
                );
              })}

              {labelEls}
            </g>

            {/* Today marker */}
            {todayX >= 0 && todayX <= width && (
              <g className="pointer-events-none">
                <line
                  x1={todayX}
                  x2={todayX}
                  y1={AXIS_H}
                  y2={AXIS_H + plotH}
                  stroke="var(--today)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <text
                  x={todayX - 4}
                  y={AXIS_H + 12}
                  textAnchor="end"
                  className="chart-tick halo"
                  style={{ fill: 'var(--today)' }}
                >
                  {t('chart.today')}
                </text>
              </g>
            )}

            {/* Vertical scroll indicator */}
            {maxScroll > 0 && (
              <rect
                x={width - 4}
                y={AXIS_H + (scrollY / contentHeight) * plotH + 2}
                width={3}
                height={Math.max(24, (plotH / contentHeight) * plotH - 4)}
                rx={1.5}
                fill="var(--text-muted)"
                opacity={0.35}
                className="pointer-events-none"
              />
            )}
          </g>

          {/* Axis */}
          <g className="pointer-events-none">
            <rect x={0} y={0} width={width} height={AXIS_H} fill="var(--bg)" />
            <line x1={0} x2={width} y1={AXIS_H - 0.5} y2={AXIS_H - 0.5} stroke="var(--border)" />
            {ERAS.map((era) => {
              const x0 = Math.max(0, x(Math.max(era.from, domain[0])));
              const x1 = Math.min(width, x(Math.min(era.to, domain[1])));
              if (x1 - x0 < 70) return null;
              return (
                <text
                  key={era.key}
                  x={(x0 + x1) / 2}
                  y={13}
                  textAnchor="middle"
                  className="chart-era"
                >
                  {t(era.key)}
                </text>
              );
            })}
            {tickValues.map((v) => (
              <g key={v} transform={`translate(${x(v)}, 0)`}>
                <line y1={AXIS_H - 5} y2={AXIS_H} stroke="var(--text-muted)" />
                <text y={AXIS_H - 9} textAnchor="middle" className="chart-tick">
                  {formatTick(v, step)}
                </text>
              </g>
            ))}
          </g>
        </svg>
      )}

      <div className="absolute right-3 bottom-3 flex flex-col overflow-hidden rounded-md border border-line bg-surface shadow-sm">
        <ZoomButton label={t('chart.zoomIn')} onClick={() => controls.zoomBy(2)}>
          <path d="M8 3v10M3 8h10" />
        </ZoomButton>
        <ZoomButton label={t('chart.zoomOut')} onClick={() => controls.zoomBy(0.5)}>
          <path d="M3 8h10" />
        </ZoomButton>
        <ZoomButton label={t('chart.fit')} onClick={() => controls.fit()}>
          <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
        </ZoomButton>
      </div>
      <p className="pointer-events-none absolute bottom-3 left-3 hidden rounded bg-canvas/80 px-2 py-1 text-xs text-muted md:block">
        {t('chart.hint')}
      </p>
    </div>
  );
}

function ZoomButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center border-b border-line text-ink last:border-b-0 hover:bg-surface-2"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}
