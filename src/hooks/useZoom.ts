import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { easeCubicInOut } from 'd3-ease';
import { interpolate } from 'd3-interpolate';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior } from 'd3-zoom';
import {
  clamp,
  constrain,
  maxScale,
  transformFromWindow,
  windowFromTransform,
  type YearWindow,
} from '../lib/view.ts';
import type { ViewStore } from './viewStore.ts';

export interface ZoomOptions {
  /** plot width and height in px (height excludes the axis) */
  width: number;
  height: number;
  /** total lane content height in px */
  contentHeight: number;
  domain: YearWindow;
  store: ViewStore;
}

export interface ZoomControls {
  zoomBy(factor: number): void;
  panBy(dxPx: number, dyPx?: number): void;
  fit(): void;
  /** Eased flight to a window (and optional vertical scroll). Instant if `animate` is false. */
  flyTo(win: YearWindow, scrollY?: number, animate?: boolean): void;
}

const FLY_MS = 650;

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clientY(e: Event | null | undefined): number | null {
  if (!e) return null;
  if ('touches' in e) {
    const te = e as TouchEvent;
    return te.touches.length === 1 ? te.touches[0]!.clientY : null;
  }
  return 'clientY' in e ? (e as MouseEvent).clientY : null;
}

/**
 * Attaches d3-zoom to the chart SVG. d3 owns the horizontal transform (x translate + k); the
 * vertical lane scroll is tracked separately so zooming never moves lanes vertically. All
 * per-frame state goes to the external view store, never to React state.
 */
export function useZoom(svgRef: RefObject<SVGSVGElement | null>, opts: ZoomOptions): ZoomControls {
  const { width, height, contentHeight, domain, store } = opts;
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const anim = useRef(0);
  const maxScroll = Math.max(0, contentHeight - height);
  const maxScrollRef = useRef(maxScroll);
  useLayoutEffect(() => {
    maxScrollRef.current = maxScroll;
  }, [maxScroll]);

  const setScroll = useCallback(
    (y: number) => store.set({ scrollY: clamp(y, 0, maxScrollRef.current) }),
    [store],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || width <= 0) return;
    const sel = select(svg);
    const kMax = maxScale(width, domain);
    let lastY: number | null = null;

    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, kMax])
      .extent([
        [0, 0],
        [width, Math.max(1, height)],
      ])
      .clickDistance(4)
      .constrain((t) => {
        const c = constrain({ k: t.k, x: t.x }, width);
        return zoomIdentity.translate(c.x, 0).scale(c.k);
      })
      .filter((event: Event) => {
        if (event.type === 'wheel') {
          const w = event as WheelEvent;
          // Shift+wheel and horizontal wheel are handled below as scroll/pan.
          return !w.shiftKey && Math.abs(w.deltaY) >= Math.abs(w.deltaX);
        }
        const m = event as MouseEvent;
        return !m.button && !(m.ctrlKey && event.type !== 'wheel');
      })
      .on('start', (e: D3ZoomEvent<SVGSVGElement, unknown>) => {
        cancelAnimationFrame(anim.current);
        lastY = clientY(e.sourceEvent as Event);
      })
      .on('zoom', (e: D3ZoomEvent<SVGSVGElement, unknown>) => {
        const src = e.sourceEvent as Event | null;
        if (src && (src.type === 'mousemove' || src.type === 'touchmove')) {
          const y = clientY(src);
          if (y !== null && lastY !== null) setScroll(store.get().scrollY - (y - lastY));
          lastY = y;
        }
        store.set({ win: windowFromTransform(e.transform, width, domain) });
      })
      .on('end', () => {
        lastY = null;
      });

    sel.call(z).on('dblclick.zoom', null);
    zoomRef.current = z;

    // Keep the current window when the size changes (or on first attach).
    const t = transformFromWindow(store.get().win, width, domain, kMax);
    sel.call(z.transform, zoomIdentity.translate(t.x, 0).scale(t.k));
    setScroll(store.get().scrollY);

    const onWheel = (ev: WheelEvent) => {
      const horizontal = Math.abs(ev.deltaX) > Math.abs(ev.deltaY);
      if (!ev.shiftKey && !horizontal) return; // zoom: handled by d3
      ev.preventDefault();
      const unit = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? height : 1;
      if (ev.shiftKey) {
        setScroll(store.get().scrollY + (ev.deltaY || ev.deltaX) * unit);
      } else {
        sel.call(z.translateBy, (-ev.deltaX * unit) / (svg.__zoom?.k ?? 1), 0);
      }
    };
    svg.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(anim.current);
      svg.removeEventListener('wheel', onWheel);
      sel.on('.zoom', null);
      zoomRef.current = null;
    };
  }, [svgRef, width, height, domain, store, setScroll]);

  // Clamp scroll if content or viewport height changes.
  useEffect(() => {
    setScroll(store.get().scrollY);
  }, [maxScroll, setScroll, store]);

  return useMemo<ZoomControls>(() => {
    const apply = (win: YearWindow) => {
      const svg = svgRef.current;
      const z = zoomRef.current;
      if (!svg || !z) return;
      const t = transformFromWindow(win, width, domain);
      select(svg).call(z.transform, zoomIdentity.translate(t.x, 0).scale(t.k));
    };
    const flyTo: ZoomControls['flyTo'] = (win, scrollY, animate = true) => {
      cancelAnimationFrame(anim.current);
      // Clamp the target window to what the zoom can actually show before interpolating.
      const t = transformFromWindow(win, width, domain);
      const target = windowFromTransform(t, width, domain);
      const targetScroll = clamp(scrollY ?? store.get().scrollY, 0, maxScrollRef.current);
      if (!animate || prefersReducedMotion()) {
        apply(target);
        setScroll(targetScroll);
        return;
      }
      const from = store.get();
      const iw = interpolate([...from.win], [...target]);
      const is = interpolate(from.scrollY, targetScroll);
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / FLY_MS);
        const e = easeCubicInOut(p);
        const w = iw(e);
        apply([w[0]!, w[1]!]);
        setScroll(is(e));
        if (p < 1) anim.current = requestAnimationFrame(step);
      };
      anim.current = requestAnimationFrame(step);
    };
    const zoomBy = (factor: number) => {
      const [a, b] = store.get().win;
      const mid = (a + b) / 2;
      const half = (b - a) / 2 / factor;
      flyTo([mid - half, mid + half], undefined, true);
    };
    const panBy = (dxPx: number, dyPx = 0) => {
      const [a, b] = store.get().win;
      const dy = (dxPx / width) * (b - a);
      if (dxPx) apply([a + dy, b + dy]);
      if (dyPx) setScroll(store.get().scrollY + dyPx);
    };
    const fit = () => flyTo(domain, undefined, true);
    return { flyTo, zoomBy, panBy, fit };
  }, [svgRef, width, domain, store, setScroll]);
}

declare global {
  interface SVGSVGElement {
    /** d3-zoom stores the current transform on the element */
    __zoom?: { k: number; x: number; y: number };
  }
}
