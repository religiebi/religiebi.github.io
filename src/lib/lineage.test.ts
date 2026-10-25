import { describe, expect, it } from 'vitest';
import { ancestors, descendants, lineage } from './lineage.ts';

const edges = [
  { id: 'b1', from: 'a', to: 'b' },
  { id: 'b2', from: 'b', to: 'c' },
  { id: 'b3', from: 'b', to: 'd' },
  { id: 'b4', from: 'x', to: 'c' }, // second parent of c
  { id: 'b5', from: 'c', to: 'e' },
];

describe('lineage', () => {
  it('finds ancestors through multiple parents', () => {
    expect([...ancestors('c', edges)].sort()).toEqual(['a', 'b', 'x']);
  });
  it('finds descendants', () => {
    expect([...descendants('b', edges)].sort()).toEqual(['c', 'd', 'e']);
  });
  it('includes only branches along the lineage, not siblings', () => {
    const l = lineage('c', edges);
    expect([...l.traditions].sort()).toEqual(['a', 'b', 'c', 'e', 'x']);
    expect([...l.branches].sort()).toEqual(['b1', 'b2', 'b4', 'b5']);
    expect(l.traditions.has('d')).toBe(false);
  });
  it('handles a root with no relatives', () => {
    expect([...lineage('zzz', edges).traditions]).toEqual(['zzz']);
  });
});
