import type { Branch } from '../data/types.ts';

type Edge = Pick<Branch, 'id' | 'from' | 'to'>;

function walk(start: string, next: Map<string, string[]>): Set<string> {
  const seen = new Set<string>();
  const queue = [...(next.get(start) ?? [])];
  while (queue.length) {
    const id = queue.pop()!;
    if (seen.has(id) || id === start) continue;
    seen.add(id);
    queue.push(...(next.get(id) ?? []));
  }
  return seen;
}

function adjacency(branches: readonly Edge[], dir: 'up' | 'down'): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const b of branches) {
    const [k, v] = dir === 'down' ? [b.from, b.to] : [b.to, b.from];
    const list = map.get(k) ?? [];
    list.push(v);
    map.set(k, list);
  }
  return map;
}

export function ancestors(id: string, branches: readonly Edge[]): Set<string> {
  return walk(id, adjacency(branches, 'up'));
}

export function descendants(id: string, branches: readonly Edge[]): Set<string> {
  return walk(id, adjacency(branches, 'down'));
}

export interface Lineage {
  traditions: Set<string>;
  branches: Set<string>;
}

/**
 * The selected tradition, all its ancestors and descendants, and the branches that connect them
 * along those lines (not sideways links between two unrelated relatives).
 */
export function lineage(id: string, branches: readonly Edge[]): Lineage {
  const up = ancestors(id, branches);
  const down = descendants(id, branches);
  const traditions = new Set([id, ...up, ...down]);
  const ids = new Set<string>();
  for (const b of branches) {
    const upward = up.has(b.from) && (b.to === id || up.has(b.to));
    const downward = (b.from === id || down.has(b.from)) && down.has(b.to);
    if (upward || downward) ids.add(b.id);
  }
  return { traditions, branches: ids };
}
