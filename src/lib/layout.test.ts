import { describe, expect, it } from 'vitest';
import type { Branch, Tradition } from '../data/types.ts';
import { computeRails, computeRows, FAMILY_H, LANE_H, placeLabel, RAIL_GAP } from './layout.ts';

const t = (id: string, family: string): Tradition => ({
  id,
  name: id,
  family,
  group: 'g',
  start: 0,
  end: null,
  summary: 's',
});
const b = (id: string, from: string, to: string, year: number): Branch => ({
  id,
  from,
  to,
  year,
  type: 'schism',
  reason: 'r',
  added: [],
  removed: [],
});

describe('computeRows', () => {
  it('inserts a family header when the family changes', () => {
    const { rows, laneCenter, height } = computeRows(
      [t('a', 'f1'), t('b', 'f1'), t('c', 'f2')],
      [
        { id: 'f1', label: 'F1' },
        { id: 'f2', label: 'F2' },
      ],
    );
    expect(rows.map((r) => r.kind)).toEqual(['family', 'lane', 'lane', 'family', 'lane']);
    expect(laneCenter.get('a')).toBe(FAMILY_H + LANE_H / 2);
    expect(laneCenter.get('c')).toBe(2 * FAMILY_H + 2 * LANE_H + LANE_H / 2);
    expect(height).toBeGreaterThan(laneCenter.get('c')!);
  });
});

describe('computeRails', () => {
  it('offsets overlapping rails that share a year, centred on it', () => {
    const centers = new Map([
      ['p', 0],
      ['c1', 30],
      ['c2', 60],
      ['q', 200],
      ['c3', 230],
    ]);
    const rails = computeRails(
      [b('r1', 'p', 'c1', 1054), b('r2', 'p', 'c2', 1054), b('r3', 'q', 'c3', 1054)],
      centers,
    );
    const off = Object.fromEntries(rails.map((r) => [r.branch.id, r.offset]));
    expect(off.r1).toBe(-RAIL_GAP / 2);
    expect(off.r2).toBe(RAIL_GAP / 2);
    expect(off.r3).toBe(0); // separate vertical span: no offset needed
  });
  it('skips rails with unknown lanes', () => {
    expect(computeRails([b('x', 'nope', 'c1', 1)], new Map([['c1', 0]]))).toEqual([]);
  });
});

describe('placeLabel', () => {
  const base = { labelWidth: 100, viewStart: 0, viewEnd: 800, pad: 6 };
  it('sits just inside the bar start normally', () => {
    expect(placeLabel({ ...base, barStart: 200, barEnd: 500 })).toMatchObject({
      x: 206,
      anchor: 'start',
      pinned: false,
      flipped: false,
      visible: true,
    });
  });
  it('pins to the left edge while the bar start is off-screen', () => {
    expect(placeLabel({ ...base, barStart: -300, barEnd: 500 })).toMatchObject({
      x: 6,
      anchor: 'start',
      pinned: true,
    });
  });
  it('flips to the left of the bar near the right edge', () => {
    expect(placeLabel({ ...base, barStart: 750, barEnd: 900 })).toMatchObject({
      x: 744,
      anchor: 'end',
      flipped: true,
      visible: true,
    });
  });
  it('is hidden when the bar is entirely off-screen to the left', () => {
    expect(placeLabel({ ...base, barStart: -500, barEnd: -10 }).visible).toBe(false);
  });
});
