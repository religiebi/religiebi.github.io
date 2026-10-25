import { useRef, type ReactNode } from 'react';
import { dataset } from '../data/load.ts';
import { useApp } from '../hooks/useSelection.ts';
import type { ThemeMode } from '../hooks/useTheme.ts';
import { t } from '../i18n/t.ts';

interface HeaderProps {
  theme: ThemeMode;
  onCycleTheme: () => void;
  guideButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export function Header({ theme, onCycleTheme, guideButtonRef }: HeaderProps) {
  const query = useApp((s) => s.query);
  const results = useApp((s) => s.results);
  const setQuery = useApp((s) => s.setQuery);
  const families = useApp((s) => s.families);
  const toggleFamily = useApp((s) => s.toggleFamily);
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const guideOpen = useApp((s) => s.guideOpen);
  const setGuideOpen = useApp((s) => s.setGuideOpen);
  const selectTradition = useApp((s) => s.selectTradition);
  const inputRef = useRef<HTMLInputElement>(null);
  const count = results.traditions.length;

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && results.traditions[0]) {
      e.preventDefault();
      setView('chart');
      selectTradition(results.traditions[0], { fly: true });
    } else if (e.key === 'Escape') {
      setQuery('');
    }
  };

  return (
    <header className="relative z-30 border-b border-line bg-surface">
      <button
        type="button"
        onClick={() => setView('list')}
        className="sr-only-focusable absolute top-1 left-1 z-50 rounded bg-accent px-3 py-1 text-sm text-white"
      >
        {t('app.skip')}
      </button>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 md:px-4">
        <div className="order-1 flex min-w-0 items-baseline gap-3">
          <h1 className="font-display text-xl leading-none font-semibold tracking-tight whitespace-nowrap md:text-[22px]">
            <a href="#/" className="hover:text-accent">
              {t('app.title')}
            </a>
          </h1>
          <p className="hidden text-sm text-muted xl:block">{t('app.subtitle')}</p>
        </div>

        <div
          role="search"
          className="order-3 flex w-full items-center gap-2 lg:order-2 lg:ml-4 lg:w-auto"
        >
          <label htmlFor="search" className="sr-only">
            {t('search.label')}
          </label>
          <div className="relative w-full lg:w-72">
            <svg
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="M10.5 10.5L14 14" />
            </svg>
            <input
              ref={inputRef}
              id="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKey}
              placeholder={t('search.placeholder')}
              autoComplete="off"
              spellCheck={false}
              className="h-9 w-full rounded-md border border-line bg-canvas pr-24 pl-8 text-sm placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus"
            />
            <span
              aria-live="polite"
              className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-xs text-muted"
            >
              {query.trim() ? t('search.count', { n: count }) : ''}
            </span>
          </div>
        </div>

        <div
          role="group"
          aria-label={t('filters.label')}
          className="order-4 flex flex-wrap items-center gap-1.5 lg:order-3"
        >
          {dataset.families.map((f) => {
            const on = families.includes(f.id);
            const last = on && families.length === 1;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                aria-disabled={last || undefined}
                title={last ? t('filters.lastOn') : undefined}
                onClick={() => toggleFamily(f.id)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
                  on
                    ? 'border-ink bg-ink text-surface'
                    : 'border-line bg-surface text-muted hover:border-muted hover:text-ink'
                }`}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  {on ? (
                    <path
                      d="M1.5 5.2l2.3 2.3L8.5 2.8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  ) : (
                    <circle
                      cx="5"
                      cy="5"
                      r="3.2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  )}
                </svg>
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="order-2 ml-auto flex items-center gap-1 lg:order-4">
          <div
            role="group"
            aria-label={t('view.label')}
            className="flex rounded-md border border-line p-0.5"
          >
            {(['chart', 'list'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`h-7 rounded px-2.5 text-xs font-medium ${
                  view === v ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {t(`view.${v}`)}
              </button>
            ))}
          </div>
          <IconButton
            ref={guideButtonRef}
            label={t('guide.open')}
            pressed={guideOpen}
            onClick={() => setGuideOpen(!guideOpen)}
            text={t('guide.open')}
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M8 7.2v4M8 4.8v.2" strokeLinecap="round" />
          </IconButton>
          <a
            href="#/about"
            className="hidden h-8 items-center rounded px-2 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink sm:inline-flex"
          >
            {t('about.link')}
          </a>
          <IconButton
            label={t('theme.label', { mode: t(`theme.${theme}`) })}
            onClick={onCycleTheme}
          >
            {theme === 'light' ? (
              <>
                <circle cx="8" cy="8" r="3" />
                <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
              </>
            ) : theme === 'dark' ? (
              <path d="M13 9.5A5.5 5.5 0 016.5 3a5.5 5.5 0 106.5 6.5z" />
            ) : (
              <>
                <rect x="2" y="3" width="12" height="8" rx="1" />
                <path d="M6 14h4M8 11v3" />
              </>
            )}
          </IconButton>
        </div>
      </div>
    </header>
  );
}

function IconButton({
  label,
  onClick,
  children,
  pressed,
  text,
  ref,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  pressed?: boolean;
  text?: string;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={text ? undefined : label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded px-2 text-xs font-medium hover:bg-surface-2 hover:text-ink ${
        pressed ? 'bg-surface-2 text-ink' : 'text-muted'
      }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden="true"
      >
        {children}
      </svg>
      {text && <span className="hidden sm:inline">{text}</span>}
      {text && <span className="sr-only sm:hidden">{text}</span>}
    </button>
  );
}
