import { useEffect } from 'react';
import { parseHash, toHash, type Route } from '../lib/route.ts';
import { useApp } from './useSelection.ts';

/** Applies a route to the app store. `initial` frames instantly instead of animating. */
function applyRoute(route: Route, initial: boolean) {
  const app = useApp.getState();
  const opts = { fly: true, animate: !initial };
  switch (route.kind) {
    case 'tradition':
      app.setAboutOpen(false);
      if (app.selectedId !== route.id || app.focusBranchId) app.selectTradition(route.id, opts);
      break;
    case 'branch':
      app.setAboutOpen(false);
      if (app.focusBranchId !== route.id) app.selectBranch(route.id, opts);
      break;
    case 'about':
      app.setAboutOpen(true);
      break;
    case 'home':
      app.setAboutOpen(false);
      app.clearSelection();
      break;
  }
}

function routeFromState(): Route {
  const { selectedId, focusBranchId, aboutOpen } = useApp.getState();
  if (aboutOpen) return { kind: 'about' };
  if (focusBranchId) return { kind: 'branch', id: focusBranchId };
  if (selectedId) return { kind: 'tradition', id: selectedId };
  return { kind: 'home' };
}

/**
 * Keeps the location hash and app state in sync: `#/t/<id>`, `#/b/<id>`, `#/about`.
 * Selection changes replace the history entry (no back-button spam); opening About pushes one.
 */
export function useUrlHash(): void {
  useEffect(() => {
    applyRoute(parseHash(location.hash), true);

    const onHash = () => applyRoute(parseHash(location.hash), false);
    addEventListener('hashchange', onHash);

    const unsub = useApp.subscribe((s, prev) => {
      if (
        s.selectedId === prev.selectedId &&
        s.focusBranchId === prev.focusBranchId &&
        s.aboutOpen === prev.aboutOpen
      )
        return;
      const hash = toHash(routeFromState());
      if (hash === location.hash || (hash === '' && location.hash === '')) return;
      const url = hash || location.pathname + location.search;
      if (s.aboutOpen !== prev.aboutOpen && s.aboutOpen) history.pushState(null, '', url);
      else history.replaceState(null, '', url);
    });
    return () => {
      removeEventListener('hashchange', onHash);
      unsub();
    };
  }, []);
}
