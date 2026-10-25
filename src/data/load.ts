import raw from './religions.json';
import { validateDataset } from './schema.ts';
import { generateStressData } from './stress.ts';
import type { Branch, Dataset, Tradition } from './types.ts';
import { buildSearchIndex } from '../lib/search.ts';

/**
 * Loads and validates the dataset once at startup. `?stress` swaps in generated data for
 * performance testing. Invalid data is reported instead of rendering a broken chart.
 */
const useStress =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('stress');

const result = validateDataset(useStress ? generateStressData() : raw);

export const loadErrors: string[] = result.ok ? [] : result.errors;
if (!result.ok) console.error('Dataset validation failed:\n' + result.errors.join('\n'));

const empty: Dataset = { families: [], groups: [], traditions: [], branches: [] };
export const dataset: Dataset = result.ok ? result.data : empty;

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
