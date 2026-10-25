import type { Branch, Tradition } from '../data/types.ts';

/**
 * Folds text for matching: strips diacritics, apostrophes and case, collapses whitespace.
 * "Bahá'í" → "bahai", "Shi‘a" → "shia".
 */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/['’‘ʼʻ`´]/g, '')
    .replace(/[-–—]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SearchIndexEntry {
  id: string;
  text: string;
}

export interface SearchData {
  traditions: readonly Pick<Tradition, 'id' | 'name' | 'summary'>[];
  branches: readonly Pick<Branch, 'id' | 'to' | 'reason' | 'added' | 'removed'>[];
}

export interface SearchIndex {
  traditions: SearchIndexEntry[];
  branches: SearchIndexEntry[];
}

/** Pre-folds the searchable text once. A tradition's text includes its incoming branches. */
export function buildSearchIndex(data: SearchData): SearchIndex {
  const branchText = new Map<string, string>();
  const branches = data.branches.map((b) => {
    const text = fold([b.reason, ...b.added, ...b.removed].join(' '));
    branchText.set(b.to, `${branchText.get(b.to) ?? ''} ${text}`);
    return { id: b.id, text };
  });
  const traditions = data.traditions.map((t) => ({
    id: t.id,
    text: `${fold(t.name)} ${fold(t.summary)}${branchText.get(t.id) ?? ''}`,
  }));
  return { traditions, branches };
}

export interface SearchResult {
  /** Matching tradition ids, in lane order. Name matches come first. */
  traditions: string[];
  branches: string[];
}

/** Every whitespace-separated term must occur somewhere in the entry's folded text. */
export function search(
  index: SearchIndex,
  query: string,
  names?: ReadonlyMap<string, string>,
): SearchResult {
  const terms = fold(query).split(' ').filter(Boolean);
  if (!terms.length) return { traditions: [], branches: [] };
  const match = (e: SearchIndexEntry) => terms.every((t) => e.text.includes(t));
  const hits = index.traditions.filter(match).map((e) => e.id);
  // Prefer traditions whose name matches, so Enter flies to the obvious one.
  const byName = names
    ? hits.filter((id) => terms.every((t) => fold(names.get(id) ?? '').includes(t)))
    : [];
  const ordered = [...byName, ...hits.filter((id) => !byName.includes(id))];
  return { traditions: ordered, branches: index.branches.filter(match).map((e) => e.id) };
}
