import type { BranchType } from '../data/types.ts';

/** Rail stroke styles per branch type (AGENTS.md §6). Colour is never the only signal. */
export const RAIL_STYLE: Record<BranchType, { width: number; dash?: string; cap?: 'round' }> = {
  schism: { width: 3 },
  reform: { width: 2 },
  movement: { width: 1.75, dash: '8 4' },
  revelation: { width: 1.75, dash: '8 3 2 3' },
  influence: { width: 1.5, dash: '1.5 3.5', cap: 'round' },
};

export const groupColor = (group: string) => `var(--g-${group}, var(--g-fallback))`;
export const groupFill = (group: string) =>
  `color-mix(in srgb, ${groupColor(group)} 25%, var(--bg))`;
