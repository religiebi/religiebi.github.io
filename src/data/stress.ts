import type { Dataset } from './types.ts';

/**
 * Generates a large, valid synthetic dataset for performance testing (open the site with
 * `?stress` or run `pnpm stress`). Deterministic: the same arguments give the same data.
 */
export function generateStressData(traditionCount = 160, extraLinks = 60): Dataset {
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const groups = [
    'judaism',
    'early-christianity',
    'eastern-churches',
    'catholic',
    'protestant',
    'movements-19c',
    'islam',
    'babi-bahai',
  ];
  const families = ['f-a', 'f-b', 'f-c', 'f-d'];
  const traditions: Dataset['traditions'] = [];
  const branches: Dataset['branches'] = [];
  const now = 2020;

  for (let i = 0; i < traditionCount; i++) {
    const family = families[Math.floor((i / traditionCount) * families.length)]!;
    const familyMembers = traditions.filter((t) => t.family === family);
    const parent =
      familyMembers.length && rand() < 0.9
        ? familyMembers[Math.floor(rand() * familyMembers.length)]!
        : traditions.length
          ? traditions[Math.floor(rand() * traditions.length)]!
          : undefined;
    const pStart = parent?.start ?? -800;
    const pEnd = parent?.end ?? now;
    const start = parent
      ? Math.min(pEnd, Math.round(pStart + 1 + rand() * Math.max(0, pEnd - pStart - 2)))
      : -800;
    const end = rand() < 0.2 ? Math.min(now, start + 20 + Math.round(rand() * 600)) : null;
    const id = `s-${i}`;
    traditions.push({
      id,
      name: `Synthetic tradition ${i + 1}`,
      family,
      group: groups[i % groups.length]!,
      start,
      end,
      summary: `Generated entry ${i + 1} for performance testing.`,
    });
    if (parent) {
      branches.push({
        id: `b-${id}`,
        from: parent.id,
        to: id,
        year: start,
        type: (['schism', 'reform', 'movement', 'revelation'] as const)[i % 4]!,
        reason: 'Synthetic branch.',
        added: ['Generated'],
        removed: [],
        sources: [{ title: 'Synthetic' }],
      });
    }
  }
  // Extra influence links from an earlier tradition alive at the child's start (keeps a DAG).
  for (let n = 0, guard = 0; n < extraLinks && guard < extraLinks * 50; guard++) {
    const child = traditions[1 + Math.floor(rand() * (traditions.length - 1))]!;
    const candidates = traditions.filter(
      (t) => t.id !== child.id && t.start < child.start && (t.end ?? now) >= child.start,
    );
    const from = candidates[Math.floor(rand() * candidates.length)];
    if (!from || branches.some((b) => b.from === from.id && b.to === child.id)) continue;
    // Only link from lower lane indexes to keep the graph acyclic.
    if (traditions.indexOf(from) > traditions.indexOf(child)) continue;
    branches.push({
      id: `b-${child.id}-x${n}`,
      from: from.id,
      to: child.id,
      year: child.start,
      type: 'influence',
      reason: 'Synthetic influence.',
      added: [],
      removed: [],
      sources: [{ title: 'Synthetic' }],
    });
    n++;
  }

  return {
    families: families.map((id, i) => ({ id, label: `Family ${String.fromCharCode(65 + i)}` })),
    groups: groups.map((id) => ({ id, label: id })),
    traditions,
    branches,
  };
}
