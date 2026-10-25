import { describe, expect, it } from 'vitest';
import { parseHash, toHash, type Route } from './route.ts';

describe('hash routes', () => {
  it('round-trips every route kind', () => {
    const routes: Route[] = [
      { kind: 'tradition', id: 'lutheranism' },
      { kind: 'branch', id: 'b-eastern-orthodox' },
      { kind: 'about' },
      { kind: 'home' },
    ];
    for (const r of routes) expect(parseHash(toHash(r))).toEqual(r);
  });
  it('parses the documented deep links', () => {
    expect(parseHash('#/t/lutheranism')).toEqual({ kind: 'tradition', id: 'lutheranism' });
    expect(parseHash('#/b/b-eastern-orthodox')).toEqual({
      kind: 'branch',
      id: 'b-eastern-orthodox',
    });
    expect(parseHash('#/t/lutheranism/')).toEqual({ kind: 'tradition', id: 'lutheranism' });
  });
  it('falls back to home for junk', () => {
    expect(parseHash('')).toEqual({ kind: 'home' });
    expect(parseHash('#/t/')).toEqual({ kind: 'home' });
    expect(parseHash('#/t/Not Valid')).toEqual({ kind: 'home' });
    expect(parseHash('#/t/%E0%A4%A')).toEqual({ kind: 'home' });
    expect(parseHash('#/x/y/z')).toEqual({ kind: 'home' });
  });
});
