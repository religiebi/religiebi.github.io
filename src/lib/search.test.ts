import { describe, expect, it } from 'vitest';
import { buildSearchIndex, fold, search } from './search.ts';

const data = {
  traditions: [
    { id: 'bahai', name: "Bahá'í Faith", summary: 'Founded by Bahá’u’lláh.' },
    { id: 'shia', name: 'Shia Islam', summary: 'Imamate of ʻAlī.' },
    { id: 'lutheranism', name: 'Lutheranism', summary: 'Followers of Luther.' },
  ],
  branches: [
    {
      id: 'b-lutheranism',
      to: 'lutheranism',
      reason: 'Ninety-five Theses',
      added: ['justification by faith'],
      removed: ['papal authority'],
    },
  ],
};

describe('fold', () => {
  it('removes diacritics, apostrophes and case', () => {
    expect(fold("Bahá'í")).toBe('bahai');
    expect(fold('Bahá’u’lláh')).toBe('bahaullah');
    expect(fold('ʻAlī')).toBe('ali');
    expect(fold('  Ninety-five   Theses ')).toBe('ninety five theses');
  });
});

describe('search', () => {
  const index = buildSearchIndex(data);
  const names = new Map(data.traditions.map((t) => [t.id, t.name]));
  it('finds folded names', () => {
    expect(search(index, 'bahai', names).traditions).toEqual(['bahai']);
    expect(search(index, 'BAHAULLAH', names).traditions).toEqual(['bahai']);
  });
  it('matches branch reason, added and removed text', () => {
    expect(search(index, 'papal', names)).toEqual({
      traditions: ['lutheranism'],
      branches: ['b-lutheranism'],
    });
    expect(search(index, 'theses faith', names).traditions).toEqual(['lutheranism']);
  });
  it('returns nothing for an empty query', () => {
    expect(search(index, '   ', names).traditions).toEqual([]);
  });
  it('lists name matches first', () => {
    const idx = buildSearchIndex({
      traditions: [
        { id: 'a', name: 'Alpha', summary: 'mentions islam' },
        { id: 'b', name: 'Islam', summary: '' },
      ],
      branches: [],
    });
    const n = new Map([
      ['a', 'Alpha'],
      ['b', 'Islam'],
    ]);
    expect(search(idx, 'islam', n).traditions).toEqual(['b', 'a']);
  });
});
