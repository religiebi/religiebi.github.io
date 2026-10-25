import type { Branch, Family, Tradition } from '../data/types.ts';

/** Geometry constants in CSS pixels (see AGENTS.md §6). */
export const LANE_H = 30;
export const BAR_H = 14;
export const FAMILY_H = 24;
export const AXIS_H = 32;
export const RAIL_GAP = 5;
export const LABEL_PAD = 6;

export type Row =
  | { kind: 'family'; family: Family; y: number; h: number }
  | { kind: 'lane'; tradition: Tradition; index: number; y: number; h: number; cy: number };

export interface Rows {
  rows: Row[];
  /** Lane centre y for each tradition id (content coordinates, below the axis). */
  laneCenter: Map<string, number>;
  height: number;
}

/**
 * Lays out lanes top to bottom in array order, inserting a family header row whenever the family
 * changes. Independent of dataset size; O(n).
 */
export function computeRows(traditions: readonly Tradition[], families: readonly Family[]): Rows {
  const familyById = new Map(families.map((f) => [f.id, f]));
  const rows: Row[] = [];
  const laneCenter = new Map<string, number>();
  let y = 0;
  let prevFamily: string | null = null;
  traditions.forEach((t, index) => {
    if (t.family !== prevFamily) {
      const family = familyById.get(t.family) ?? { id: t.family, label: t.family };
      rows.push({ kind: 'family', family, y, h: FAMILY_H });
      y += FAMILY_H;
      prevFamily = t.family;
    }
    const cy = y + LANE_H / 2;
    rows.push({ kind: 'lane', tradition: t, index, y, h: LANE_H, cy });
    laneCenter.set(t.id, cy);
    y += LANE_H;
  });
  return { rows, laneCenter, height: y + LANE_H / 2 };
}

export interface Rail {
  branch: Branch;
  year: number;
  /** y of the parent lane centre (junction dot) */
  y1: number;
  /** y of the child lane centre (end of rail) */
  y2: number;
  /** horizontal pixel offset so rails sharing a year do not overlap */
  offset: number;
}

/**
 * One vertical rail per branch. Rails that share a year and overlap vertically get offsets of
 * RAIL_GAP pixels, centred on the true year.
 */
export function computeRails(branches: readonly Branch[], laneCenter: Map<string, number>): Rail[] {
  const rails: Rail[] = [];
  for (const branch of branches) {
    const y1 = laneCenter.get(branch.from);
    const y2 = laneCenter.get(branch.to);
    if (y1 === undefined || y2 === undefined) continue;
    rails.push({ branch, year: branch.year, y1, y2, offset: 0 });
  }
  const byYear = new Map<number, Rail[]>();
  for (const r of rails) {
    const list = byYear.get(r.year) ?? [];
    list.push(r);
    byYear.set(r.year, list);
  }
  for (const group of byYear.values()) {
    if (group.length < 2) continue;
    // Cluster rails whose vertical spans overlap; offset only within a cluster.
    group.sort((a, b) => Math.min(a.y1, a.y2) - Math.min(b.y1, b.y2));
    const clusters: Rail[][] = [];
    let current: Rail[] = [];
    let bottom = -Infinity;
    for (const r of group) {
      const top = Math.min(r.y1, r.y2);
      if (current.length && top > bottom) {
        clusters.push(current);
        current = [];
        bottom = -Infinity;
      }
      current.push(r);
      bottom = Math.max(bottom, r.y1, r.y2);
    }
    if (current.length) clusters.push(current);
    for (const c of clusters) {
      // Shorter rails sit nearer the true year.
      c.sort((a, b) => Math.abs(a.y2 - a.y1) - Math.abs(b.y2 - b.y1));
      c.forEach((r, i) => {
        r.offset = (i - (c.length - 1) / 2) * RAIL_GAP;
      });
    }
  }
  return rails;
}

export interface LabelInput {
  /** bar start and end in screen px */
  barStart: number;
  barEnd: number;
  labelWidth: number;
  /** visible horizontal range of the plot in screen px */
  viewStart: number;
  viewEnd: number;
  pad?: number;
}

export interface LabelPlacement {
  x: number;
  anchor: 'start' | 'end';
  /** true while the bar's start is off-screen and the label is held at the left edge */
  pinned: boolean;
  /** true when the label was flipped to the left of the bar */
  flipped: boolean;
  visible: boolean;
}

/**
 * Places a bar label: normally just inside the bar's start; pinned to the left edge while the
 * start is off-screen; flipped to the left of the bar when it would run off the right edge.
 */
export function placeLabel({
  barStart,
  barEnd,
  labelWidth,
  viewStart,
  viewEnd,
  pad = LABEL_PAD,
}: LabelInput): LabelPlacement {
  const visible = barEnd >= viewStart && barStart <= viewEnd + labelWidth + pad;
  const pinned = barStart < viewStart;
  const x = Math.max(barStart, viewStart) + pad;
  if (pinned || x + labelWidth <= viewEnd) {
    return { x, anchor: 'start', pinned, flipped: false, visible };
  }
  const flippedX = barStart - pad;
  if (flippedX - labelWidth >= viewStart) {
    return { x: flippedX, anchor: 'end', pinned: false, flipped: true, visible };
  }
  // No room on either side: right-align against the edge so as much as possible stays readable.
  return { x: viewEnd - pad, anchor: 'end', pinned: false, flipped: true, visible };
}
