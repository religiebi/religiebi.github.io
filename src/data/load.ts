import raw from './religions.json';
import { generateStressData } from './stress.ts';
import type { Branch, Dataset, Tradition } from './types.ts';
import type { ValidationResult } from './schema.ts';
import { buildSearchIndex } from '../lib/search.ts';

/**
 * Loads the dataset once at startup. `?stress` swaps in generated data for performance testing.
 *
 * Validation: `pnpm build` already rejects invalid data, so the Zod schema is loaded in a separate
 * chunk right after startup instead of on the critical path (it is a large share of the bundle).
 * If validation fails at load, the app replaces the chart with the list of problems.
 */
const useStress =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('stress');

export const dataset: Dataset = useStress ? generateStressData() : (raw as unknown as Dataset);

export const validation: Promise<ValidationResult> = import('./schema.ts').then((m) => {
  const result = m.validateDataset(dataset);
  if (!result.ok) console.error('Dataset validation failed:\n' + result.errors.join('\n'));
  return result;
});

export const traditionById = new Map<string, Tradition>(dataset.traditions.map((t) => [t.id, t]));
export const branchById = new Map<string, Branch>(dataset.branches.map((b) => [b.id, b]));
export const groupLabel = new Map(dataset.groups.map((g) => [g.id, g.label]));
export const incoming = new Map<string, Branch[]>();
export const outgoing = new Map<string, Branch[]>();
for (const b of dataset.branches) {
  incoming.set(b.to, [...(incoming.get(b.to) ?? []), b]);
  outgoing.set(b.from, [...(outgoing.get(b.from) ?? []), b]);
}
export const searchIndex = buildSearchIndex(dataset);
export const nameById = new Map(dataset.traditions.map((t) => [t.id, t.name]));

/** The current year, used for "today" and ongoing bars. */
export const NOW = new Date().getFullYear();
