import { useSyncExternalStore } from 'react';
import type { YearWindow } from '../lib/view.ts';

/**
 * Tiny external store for per-frame view state (visible year window and vertical scroll).
 * d3-zoom writes here on every input event; subscribers are notified at most once per animation
 * frame, so React re-renders the chart at display rate without going through app state.
 */
export interface ViewState {
  win: YearWindow;
  scrollY: number;
}

type Listener = () => void;

export function createViewStore(initial: ViewState) {
  let state = initial;
  let frame = 0;
  const listeners = new Set<Listener>();
  const flush = () => {
    frame = 0;
    for (const l of listeners) l();
  };
  return {
    get: () => state,
    set(next: Partial<ViewState>) {
      state = { ...state, ...next };
      if (!frame) {
        frame =
          typeof requestAnimationFrame === 'function' ? requestAnimationFrame(flush) : (flush(), 0);
      }
    },
    subscribe(l: Listener) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export type ViewStore = ReturnType<typeof createViewStore>;

export function useViewState(store: ViewStore): ViewState {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
