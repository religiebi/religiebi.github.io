import { create } from 'zustand';
import { branchById, dataset, nameById, searchIndex, traditionById } from '../data/load.ts';
import { lineage, type Lineage } from '../lib/lineage.ts';
import { search, type SearchResult } from '../lib/search.ts';

/** A request for the chart to frame something. `nonce` makes repeated requests distinct. */
export interface FlyRequest {
  kind: 'tradition' | 'branch';
  id: string;
  animate: boolean;
  nonce: number;
}

export interface AppState {
  selectedId: string | null;
  /** incoming branch highlighted in the panel (set when a rail is clicked) */
  focusBranchId: string | null;
  lineage: Lineage | null;
  fly: FlyRequest | null;
  query: string;
  results: SearchResult;
  families: string[];
  view: 'chart' | 'list';
  guideOpen: boolean;
  aboutOpen: boolean;

  selectTradition(id: string, opts?: { fly?: boolean; animate?: boolean }): void;
  selectBranch(id: string, opts?: { fly?: boolean; animate?: boolean }): void;
  clearSelection(): void;
  flyTo(kind: FlyRequest['kind'], id: string, animate?: boolean): void;
  setQuery(q: string): void;
  toggleFamily(id: string): void;
  setView(view: AppState['view']): void;
  setGuideOpen(open: boolean): void;
  setAboutOpen(open: boolean): void;
}

let nonce = 0;
const allFamilies = dataset.families.map((f) => f.id);
const noResults: SearchResult = { traditions: [], branches: [] };

export const useApp = create<AppState>((set, get) => ({
  selectedId: null,
  focusBranchId: null,
  lineage: null,
  fly: null,
  query: '',
  results: noResults,
  families: allFamilies,
  view: 'chart',
  guideOpen: false,
  aboutOpen: false,

  selectTradition(id, opts = {}) {
    if (!traditionById.has(id)) return;
    set({
      selectedId: id,
      focusBranchId: null,
      lineage: lineage(id, dataset.branches),
      ...(opts.fly
        ? { fly: { kind: 'tradition', id, animate: opts.animate ?? true, nonce: ++nonce } }
        : {}),
    });
  },
  selectBranch(id, opts = {}) {
    const b = branchById.get(id);
    if (!b) return;
    set({
      selectedId: b.to,
      focusBranchId: id,
      lineage: lineage(b.to, dataset.branches),
      ...(opts.fly
        ? { fly: { kind: 'branch', id, animate: opts.animate ?? true, nonce: ++nonce } }
        : {}),
    });
  },
  clearSelection() {
    if (get().selectedId) set({ selectedId: null, focusBranchId: null, lineage: null });
  },
  flyTo(kind, id, animate = true) {
    set({ fly: { kind, id, animate, nonce: ++nonce } });
  },
  setQuery(query) {
    set({ query, results: query.trim() ? search(searchIndex, query, nameById) : noResults });
  },
  toggleFamily(id) {
    const { families } = get();
    if (families.includes(id)) {
      if (families.length === 1) return; // never allow all-off
      set({ families: families.filter((f) => f !== id) });
    } else {
      set({ families: allFamilies.filter((f) => f === id || families.includes(f)) });
    }
  },
  setView(view) {
    set({ view });
  },
  setGuideOpen(guideOpen) {
    set({ guideOpen });
  },
  setAboutOpen(aboutOpen) {
    set({ aboutOpen });
  },
}));

/** Selection hook used by components; re-exported under the name the brief uses. */
export const useSelection = useApp;
