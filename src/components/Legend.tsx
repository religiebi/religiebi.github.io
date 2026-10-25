import { useEffect, useRef } from 'react';
import { dataset } from '../data/load.ts';
import { branchTypes } from '../data/schema.ts';
import { useApp } from '../hooks/useSelection.ts';
import { t } from '../i18n/t.ts';
import { groupColor, groupFill } from './railStyle.ts';
import { RailSample } from './TypePill.tsx';

/** Guide panel: legend for colours and rail types, navigation help and the data disclaimer. */
export function Legend({ returnFocusTo }: { returnFocusTo: React.RefObject<HTMLElement | null> }) {
  const setGuideOpen = useApp((s) => s.setGuideOpen);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const back = returnFocusTo.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGuideOpen(false);
    };
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('keydown', onKey);
      back?.focus();
    };
  }, [setGuideOpen, returnFocusTo]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby="guide-title"
      tabIndex={-1}
      className="fixed top-14 right-2 z-40 max-h-[calc(100dvh-4.5rem)] w-[min(400px,calc(100vw-16px))] overflow-y-auto rounded-lg border border-line bg-surface p-4 shadow-xl outline-none md:right-4"
    >
      <div className="flex items-center justify-between">
        <h2 id="guide-title" className="font-display text-xl">
          {t('guide.title')}
        </h2>
        <button
          type="button"
          onClick={() => setGuideOpen(false)}
          aria-label={t('guide.close')}
          className="grid h-8 w-8 place-items-center rounded text-muted hover:bg-surface-2 hover:text-ink"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      </div>

      <h3 className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">
        {t('legend.colours')}
      </h3>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
        {dataset.groups.map((g) => (
          <li key={g.id} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-6 shrink-0 rounded-sm border-[1.5px]"
              style={{ borderColor: groupColor(g.id), background: groupFill(g.id) }}
            />
            {g.label}
          </li>
        ))}
      </ul>

      <h3 className="mt-4 text-xs font-semibold tracking-wide text-muted uppercase">
        {t('legend.rails')}
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {branchTypes.map((type) => (
          <li key={type} className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-ink">
              <RailSample type={type} length={40} />
            </span>
            <span>
              <strong className="font-semibold">{t(`type.${type}`)}</strong>
              <span className="text-muted"> — {t(`typeDesc.${type}`)}</span>
            </span>
          </li>
        ))}
      </ul>

      <h3 className="mt-4 text-xs font-semibold tracking-wide text-muted uppercase">
        {t('legend.marks')}
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        <li className="flex items-center gap-3">
          <svg width="40" height="12" aria-hidden="true" className="shrink-0">
            <circle
              cx="20"
              cy="6"
              r="3.5"
              fill="currentColor"
              stroke="var(--surface)"
              strokeWidth="1.5"
            />
          </svg>
          {t('legend.junction')}
        </li>
        <li className="flex items-center gap-3">
          <svg width="40" height="12" aria-hidden="true" className="shrink-0">
            <line x1="20" x2="20" y1="0" y2="12" stroke="var(--today)" strokeDasharray="3 3" />
          </svg>
          {t('legend.todayMark')}
        </li>
        <li className="flex items-center gap-3">
          <svg width="40" height="14" aria-hidden="true" className="shrink-0">
            <line x1="12" x2="12" y1="0" y2="14" stroke="currentColor" strokeDasharray="2 2" />
            <rect
              x="12"
              y="3"
              width="26"
              height="8"
              rx="1.5"
              fill="var(--surface-2)"
              stroke="currentColor"
            />
          </svg>
          {t('panel.approx')}
        </li>
      </ul>

      <h3 className="mt-4 text-xs font-semibold tracking-wide text-muted uppercase">
        {t('legend.navigation')}
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        <li>{t('legend.nav1')}</li>
        <li>{t('legend.nav2')}</li>
        <li>{t('legend.nav3')}</li>
      </ul>

      <h3 className="mt-4 text-xs font-semibold tracking-wide text-muted uppercase">
        {t('legend.disclaimerTitle')}
      </h3>
      <p className="mt-1 text-sm leading-relaxed">{t('legend.disclaimer')}</p>
      <p className="mt-2 text-sm">
        <a href="#/about" className="text-accent underline underline-offset-2">
          {t('about.title')}
        </a>
      </p>
    </div>
  );
}
