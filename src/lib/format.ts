/**
 * Year formatting and axis tick generation. Years are numbers on a continuous axis:
 * negative = BCE, fractional parts are months (1517.5 ≈ July 1517).
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `-500` → "500 BCE", `300` → "300 CE", `1517` → "1517", `0` → "1 BCE | 1 CE". */
export function formatYear(year: number): string {
  const y = Math.round(year);
  if (y < 0) return `${-y} BCE`;
  if (y === 0) return 'BCE | CE';
  if (y < 1000) return `${y} CE`;
  return String(y);
}

/** Adds "c. " for approximate dates. */
export function formatYearApprox(year: number, approx?: boolean): string {
  return approx ? `c. ${formatYear(year)}` : formatYear(year);
}

export function formatRange(
  start: number,
  end: number | null,
  approx: boolean | undefined,
  todayLabel: string,
): string {
  return `${formatYearApprox(start, approx)} – ${end === null ? todayLabel : formatYear(end)}`;
}

/** Candidate tick steps in years, from one month up to a millennium. */
export const TICK_STEPS = [
  1 / 12,
  2 / 12,
  3 / 12,
  6 / 12,
  1,
  2,
  5,
  10,
  20,
  25,
  50,
  100,
  200,
  250,
  500,
  1000,
] as const;

/** Smallest step whose ticks are at least `minSpacingPx` apart. */
export function tickStep(pxPerYear: number, minSpacingPx = 84): number {
  for (const step of TICK_STEPS) if (step * pxPerYear >= minSpacingPx) return step;
  return TICK_STEPS[TICK_STEPS.length - 1]!;
}

/** Tick values that are multiples of `step` within [a, b]. Rounded to kill float drift. */
export function ticks(a: number, b: number, step: number): number[] {
  const out: number[] = [];
  const first = Math.ceil(a / step - 1e-9);
  const last = Math.floor(b / step + 1e-9);
  if (last - first > 2000) return out; // guard against nonsense input
  for (let i = first; i <= last; i++) out.push(Math.round(i * step * 1e6) / 1e6);
  return out;
}

/** Axis label for a tick; month precision when the step is below one year. */
export function formatTick(value: number, step: number): string {
  if (step >= 1) return formatYear(value);
  const year = Math.floor(value + 1e-9);
  const month = Math.round((value - year) * 12) % 12;
  return month === 0 ? formatYear(year) : `${MONTHS[month]} ${formatYear(year)}`;
}
