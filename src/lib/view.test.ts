import { describe, expect, it } from 'vitest';
import {
  constrain,
  maxScale,
  scrollToShow,
  transformFromWindow,
  windowFromTransform,
} from './view.ts';

const domain = [-600, 2050] as const;

describe('view maths', () => {
  it('round-trips window ↔ transform', () => {
    const t = transformFromWindow([1400, 1700], 1000, domain);
    const [a, b] = windowFromTransform(t, 1000, domain);
    expect(a).toBeCloseTo(1400);
    expect(b).toBeCloseTo(1700);
  });
  it('k = 1 shows the whole domain', () => {
    expect(windowFromTransform({ k: 1, x: 0 }, 1000, domain)).toEqual([-600, 2050]);
  });
  it('limits zoom to about one pixel per month', () => {
    const k = maxScale(1000, domain);
    const t = transformFromWindow([1500, 1500.001], 1000, domain);
    expect(t.k).toBe(k);
    const [a, b] = windowFromTransform(t, 1000, domain);
    expect(1000 / (b - a)).toBeCloseTo(12);
  });
  it('never pans the data off-screen', () => {
    expect(constrain({ k: 2, x: 500 }, 1000)).toEqual({ k: 2, x: 0 });
    expect(constrain({ k: 2, x: -5000 }, 1000)).toEqual({ k: 2, x: -1000 });
    expect(constrain({ k: 0.5, x: 10 }, 1000)).toEqual({ k: 1, x: 0 });
  });
  it('scrolls a lane into view only when needed', () => {
    expect(scrollToShow(100, 130, 400, 2000, 0)).toBe(0);
    expect(scrollToShow(1000, 1030, 400, 2000, 0)).toBe(815);
    expect(scrollToShow(1900, 1930, 400, 2000, 0)).toBe(1600);
  });
});
