import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import raw from './religions.json';
import { findCycle, parseTodoSourceIds, validateDataset, type Dataset } from './schema.ts';

const todo = parseTodoSourceIds(
  readFileSync(resolve(import.meta.dirname, '../../data/TODO-sources.md'), 'utf8'),
);

const clone = (): Dataset => structuredClone(raw) as Dataset;
const errorsOf = (d: unknown) => {
  const r = validateDataset(d, { todoSourceIds: todo, currentYear: 2026 });
  return r.ok ? [] : r.errors;
};

describe('religions.json', () => {
  it('is valid', () => {
    expect(errorsOf(raw)).toEqual([]);
  });
  it('contains the documented deep-link targets', () => {
    const d = clone();
    expect(d.traditions.some((t) => t.id === 'lutheranism')).toBe(true);
    expect(d.branches.some((b) => b.id === 'b-eastern-orthodox')).toBe(true);
  });
});

describe('validateDataset failures', () => {
  it('reports a dangling "from" reference with the branch id', () => {
    const d = clone();
    d.branches[0]!.from = 'no-such-tradition';
    const errs = errorsOf(d);
    expect(
      errs.some((e) => e.includes('"from" references unknown tradition "no-such-tradition"')),
    ).toBe(true);
    expect(errs.some((e) => e.includes(d.branches[0]!.id))).toBe(true);
  });
  it('reports duplicate ids', () => {
    const d = clone();
    d.traditions.push({ ...d.traditions[0]! });
    expect(errorsOf(d).some((e) => e.includes('duplicate id'))).toBe(true);
  });
  it('reports unknown family and group', () => {
    const d = clone();
    d.traditions[0]!.family = 'martians';
    d.traditions[0]!.group = 'nope';
    const errs = errorsOf(d);
    expect(errs.some((e) => e.includes('unknown family "martians"'))).toBe(true);
    expect(errs.some((e) => e.includes('unknown group "nope"'))).toBe(true);
  });
  it('reports end before start', () => {
    const d = clone();
    d.traditions[0]!.end = d.traditions[0]!.start - 10;
    expect(errorsOf(d).some((e) => e.includes('is before start'))).toBe(true);
  });
  it('reports a branch year that does not match the child start', () => {
    const d = clone();
    const b = d.branches.find((x) => x.id === 'b-lutheranism')!;
    b.year = 1530;
    expect(errorsOf(d).some((e) => e.includes('does not match start of "lutheranism"'))).toBe(true);
  });
  it('allows approximate years within the tolerance', () => {
    const d = clone();
    const b = d.branches.find((x) => x.id === 'b-karaite')!;
    b.year += 4;
    expect(errorsOf(d)).toEqual([]);
  });
  it('reports cycles', () => {
    const d = clone();
    d.branches.push({
      ...d.branches.find((x) => x.id === 'b-lutheranism')!,
      id: 'b-loop',
      from: 'lutheranism',
      to: 'catholic',
      year: 1054,
    });
    expect(errorsOf(d).some((e) => e.startsWith('branches form a cycle'))).toBe(true);
  });
  it('reports empty reason and malformed fields via the schema with a readable path', () => {
    const d = clone() as unknown as { branches: Record<string, unknown>[] };
    d.branches[2]!.reason = '  ';
    d.branches[3]!.type = 'split';
    const errs = errorsOf(d);
    expect(errs.some((e) => /branches\[2\] \(b-[a-z-]+\)\.reason: must not be empty/.test(e))).toBe(
      true,
    );
    expect(errs.some((e) => e.startsWith('branches[3]') && e.includes('.type'))).toBe(true);
  });
  it('requires sources or a TODO-sources entry', () => {
    const d = clone();
    const b = d.branches.find((x) => x.id === 'b-sunni')!;
    delete b.sources;
    expect(errorsOf(d).some((e) => e.includes('"b-sunni": has no sources'))).toBe(true);
    const ok = validateDataset(d, { todoSourceIds: new Set(['b-sunni']), currentYear: 2026 });
    expect(ok.ok).toBe(true);
  });
});

describe('helpers', () => {
  it('findCycle returns the cycle path', () => {
    expect(
      findCycle({
        branches: [
          { id: '1', from: 'a', to: 'b' },
          { id: '2', from: 'b', to: 'c' },
          { id: '3', from: 'c', to: 'a' },
        ] as Dataset['branches'],
      }),
    ).toEqual(['a', 'b', 'c', 'a']);
  });
  it('parseTodoSourceIds picks up backticked branch ids only', () => {
    expect([...parseTodoSourceIds('- `b-foo`: x\n- `bar` and `b-baz-2`')]).toEqual([
      'b-foo',
      'b-baz-2',
    ]);
  });
});
