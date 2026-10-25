import { describe, expect, it } from 'vitest';
import { formatRange, formatTick, formatYear, tickStep, ticks } from './format.ts';

describe('formatYear', () => {
  it('formats BCE, early CE and modern years', () => {
    expect(formatYear(-500)).toBe('500 BCE');
    expect(formatYear(300)).toBe('300 CE');
    expect(formatYear(1517)).toBe('1517');
    expect(formatYear(0)).toBe('BCE | CE');
  });
  it('formats ranges with approximation and ongoing ends', () => {
    expect(formatRange(760, null, true, 'today')).toBe('c. 760 CE – today');
    expect(formatRange(-516, 70, false, 'today')).toBe('516 BCE – 70 CE');
  });
});

describe('ticks', () => {
  it('chooses wider steps when zoomed out', () => {
    expect(tickStep(0.3)).toBe(500);
    expect(tickStep(12)).toBe(10);
    expect(tickStep(1200)).toBe(1 / 12);
  });
  it('generates multiples of the step inside the window', () => {
    expect(ticks(-520, 260, 250)).toEqual([-500, -250, 0, 250]);
  });
  it('labels month ticks', () => {
    expect(formatTick(1517.25, 3 / 12)).toBe('Apr 1517');
    expect(formatTick(1517, 3 / 12)).toBe('1517');
    expect(formatTick(-300, 100)).toBe('300 BCE');
  });
});
