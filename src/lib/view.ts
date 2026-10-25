import type { Branch, Tradition } from '../data/types.ts';

/** A visible window on the time axis, in (fractional) years. */
export type YearWindow = readonly [number, number];

export interface ZoomLike {
  k: number;
  x: number;
}

/** Pixels per year at the finest zoom: about one pixel per month. */
export const MAX_PX_PER_YEAR = 12;

/** Full time domain: a margin before the first start and after "today". */
export function timeDomain(traditions: readonly Tradition[], now: number): YearWindow {
  let min = Infinity;
  for (const t of traditions) min = Math.min(min, t.start);
  if (!Number.isFinite(min)) min = now - 100;
  const span = now - min;
  return [min - Math.max(20, span * 0.03), now + Math.max(10, span * 0.02)];
}

export function maxScale(width: number, domain: YearWindow): number {
  const span = domain[1] - domain[0];
  return Math.max(1, (MAX_PX_PER_YEAR * span) / Math.max(1, width));
}

/** Visible window for a zoom transform where k = 1 fits the whole domain into `width`. */
export function windowFromTransform(t: ZoomLike, width: number, domain: YearWindow): YearWindow {
  const span = domain[1] - domain[0];
  const a = domain[0] + (-t.x / t.k / width) * span;
  const b = domain[0] + ((width - t.x) / t.k / width) * span;
  return [a, b];
}

/** Inverse of windowFromTransform, clamped to the zoom extent and pan limits. */
export function transformFromWindow(
  win: YearWindow,
  width: number,
  domain: YearWindow,
  kMax = maxScale(width, domain),
): ZoomLike {
  const span = domain[1] - domain[0];
  const k = clamp(span / Math.max(1e-9, win[1] - win[0]), 1, kMax);
  const x = -((win[0] - domain[0]) / span) * width * k;
  return constrain({ k, x }, width);
}

/** Pan limits: the domain always covers the viewport, so data can never leave the screen. */
export function constrain(t: ZoomLike, width: number): ZoomLike {
  const k = Math.max(1, t.k);
  const x = clamp(t.x, width - width * k, 0);
  return { k, x };
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Window that frames a tradition with some context on either side. */
export function frameTradition(t: Tradition, now: number): YearWindow {
  const end = t.end ?? now;
  const len = Math.max(end - t.start, 40);
  const padBefore = Math.max(len * 0.25, 30);
  const padAfter = Math.max(len * 0.1, 15);
  return [t.start - padBefore, end + padAfter];
}

/** Window centred on a branch year, wide enough to show some of the child bar. */
export function frameBranch(b: Branch, child: Tradition | undefined, now: number): YearWindow {
  const childEnd = child?.end ?? now;
  const w = clamp((childEnd - b.year) * 1.1, 80, 1200);
  return [b.year - w * 0.35, b.year + w * 0.65];
}

/** Vertical scroll that brings the band [y1, y2] (content px) into view, centred if possible. */
export function scrollToShow(
  y1: number,
  y2: number,
  viewHeight: number,
  contentHeight: number,
  current: number,
): number {
  const top = Math.min(y1, y2);
  const bottom = Math.max(y1, y2);
  const maxScroll = Math.max(0, contentHeight - viewHeight);
  if (top >= current + 8 && bottom <= current + viewHeight - 8) return current;
  const target = bottom - top > viewHeight ? top - 24 : (top + bottom) / 2 - viewHeight / 2;
  return clamp(target, 0, maxScroll);
}
