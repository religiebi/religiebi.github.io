// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { App } from './App.tsx';
import { useApp } from './hooks/useSelection.ts';

beforeAll(() => {
  // jsdom has no layout: report a fixed chart size.
  globalThis.ResizeObserver = class {
    constructor(private cb: ResizeObserverCallback) {}
    observe(el: Element) {
      this.cb(
        [
          {
            target: el,
            contentRect: { width: 1000, height: 600 },
          } as unknown as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  HTMLCanvasElement.prototype.getContext = (() => null) as never;
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.scrollTo = (() => {}) as never;
});

describe('App', () => {
  it('opens a deep-linked tradition in the panel', () => {
    location.hash = '#/t/lutheranism';
    render(<App />);
    const panel = screen.getByRole('complementary', { name: 'Details' });
    expect(
      within(panel).getByRole('heading', { level: 2, name: 'Lutheranism' }),
    ).toBeInTheDocument();
    expect(within(panel).getByText('How it began')).toBeInTheDocument();
    // The bar is a focusable, pressed button in the chart.
    const bar = screen.getByRole('button', { name: /^Lutheranism, 1517/ });
    expect(bar).toHaveAttribute('aria-pressed', 'true');
    expect(bar).toHaveAttribute('tabindex', '0');
  });

  it('searches with diacritic folding and shows a count', () => {
    render(<App />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'bahai' } });
    expect(useApp.getState().results.traditions[0]).toBe('bahai');
    expect(screen.getByText(/\d+ match/)).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '' } });
  });

  it('never lets every family filter be switched off', () => {
    render(<App />);
    const chips = within(screen.getByRole('group', { name: 'Families shown' })).getAllByRole(
      'button',
    );
    act(() => chips.forEach((c) => fireEvent.click(c)));
    expect(useApp.getState().families).toHaveLength(1);
  });

  it('selecting a branch highlights its card and updates the hash', () => {
    render(<App />);
    act(() => useApp.getState().selectBranch('b-eastern-orthodox'));
    expect(location.hash).toBe('#/b/b-eastern-orthodox');
    expect(document.getElementById('card-b-eastern-orthodox')).toHaveAttribute(
      'aria-current',
      'true',
    );
  });
});
