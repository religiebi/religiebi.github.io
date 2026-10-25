import { useEffect, useRef, useState } from 'react';
import { groupLabel, incoming, outgoing, traditionById } from '../data/load.ts';
import type { Branch } from '../data/types.ts';
import { useApp } from '../hooks/useSelection.ts';
import { formatRange, formatYearApprox } from '../lib/format.ts';
import { t } from '../i18n/t.ts';
import { groupColor, groupFill } from './railStyle.ts';
import { Sources } from './Sources.tsx';
import { TypePill } from './TypePill.tsx';

/** Detail panel: right sidebar on desktop, bottom sheet on mobile. */
export function Panel() {
  const selectedId = useApp((s) => s.selectedId);
  const focusBranchId = useApp((s) => s.focusBranchId);
  const clearSelection = useApp((s) => s.clearSelection);
  const tr = selectedId ? traditionById.get(selectedId) : undefined;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusBranchId) {
      scrollRef.current?.scrollTo({ top: 0 });
      return;
    }
    document
      .getElementById(`card-${focusBranchId}`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusBranchId, selectedId]);

  return (
    <aside
      aria-label={t('panel.label')}
      className={`${tr ? 'flex' : 'hidden md:flex'} relative z-20 max-h-[50%] min-h-[40%] flex-col rounded-t-xl border-t border-line bg-surface shadow-[0_-4px_24px_rgba(0,0,0,0.12)] md:z-auto md:max-h-none md:min-h-0 md:w-[340px] md:shrink-0 md:rounded-none md:border-t-0 md:border-l md:shadow-none lg:w-[380px]`}
    >
      <div
        ref={scrollRef}
        aria-live="polite"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {tr ? (
          <TraditionDetails key={tr.id} id={tr.id} onClose={clearSelection} />
        ) : (
          <div className="p-5">
            <h2 className="font-display text-2xl">{t('panel.emptyTitle')}</h2>
            <p className="mt-2 text-sm text-muted">{t('panel.emptyBody')}</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function TraditionDetails({ id, onClose }: { id: string; onClose: () => void }) {
  const tr = traditionById.get(id)!;
  const parents = incoming.get(id) ?? [];
  const children = outgoing.get(id) ?? [];
  const focusBranchId = useApp((s) => s.focusBranchId);
  const selectTradition = useApp((s) => s.selectTradition);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable: the address bar still has the link */
    }
  };

  const go = (target: string) => selectTradition(target, { fly: true });

  return (
    <article className="p-4 md:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-2 h-3 w-6 shrink-0 rounded-sm border-[1.5px]"
          style={{ borderColor: groupColor(tr.group), background: groupFill(tr.group) }}
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl leading-tight">{tr.name}</h2>
          <p className="mt-0.5 font-mono text-sm text-muted">
            {formatRange(tr.start, tr.end, tr.approx, t('panel.today'))}
            <span className="font-sans"> · {groupLabel.get(tr.group)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('panel.close')}
          title={t('panel.close')}
          className="-mt-1 -mr-1 grid h-8 w-8 shrink-0 place-items-center rounded text-muted hover:bg-surface-2 hover:text-ink"
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

      <p className="mt-3 text-[15px] leading-relaxed">{tr.summary}</p>
      <Sources sources={tr.sources} />
      <button
        type="button"
        onClick={copyLink}
        className="mt-3 text-xs text-muted underline decoration-line underline-offset-2 hover:text-ink"
      >
        {copied ? t('panel.copied') : t('panel.link')}
      </button>

      <h3 className="mt-6 border-b border-line pb-1 font-display text-lg">
        {t('panel.howItBegan')}
      </h3>
      {parents.length === 0 && <p className="mt-2 text-sm text-muted">{t('panel.noParents')}</p>}
      <div className="mt-3 space-y-3">
        {parents.map((b) => (
          <BranchCard key={b.id} branch={b} focused={b.id === focusBranchId} onGo={go} />
        ))}
      </div>

      <h3 className="mt-6 border-b border-line pb-1 font-display text-lg">
        {t('panel.branchesFrom')}
      </h3>
      {children.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{t('panel.noChildren')}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {[...children]
            .sort((a, b) => a.year - b.year)
            .map((b) => {
              const child = traditionById.get(b.to)!;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => go(child.id)}
                    className="flex w-full items-center gap-3 py-2 text-left hover:bg-surface-2"
                  >
                    <span className="w-16 shrink-0 font-mono text-xs text-muted">
                      {formatYearApprox(b.year, b.approx)}
                    </span>
                    <span className="min-w-0 flex-1 font-medium text-accent">{child.name}</span>
                    <TypePill type={b.type} color={groupColor(child.group)} />
                  </button>
                </li>
              );
            })}
        </ul>
      )}
      {(tr.approx || parents.some((p) => p.approx)) && (
        <p className="mt-6 text-xs text-muted">{t('panel.approx')}</p>
      )}
    </article>
  );
}

function BranchCard({
  branch: b,
  focused,
  onGo,
}: {
  branch: Branch;
  focused: boolean;
  onGo: (id: string) => void;
}) {
  const parent = traditionById.get(b.from)!;
  const child = traditionById.get(b.to)!;
  return (
    <section
      id={`card-${b.id}`}
      aria-current={focused ? 'true' : undefined}
      className={`rounded-lg border p-3 ${focused ? 'border-accent bg-surface-2 ring-1 ring-accent' : 'border-line'}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-medium">{formatYearApprox(b.year, b.approx)}</span>
        <TypePill type={b.type} color={groupColor(child.group)} />
        <span className="text-sm text-muted">
          {t('panel.from')}{' '}
          <button
            type="button"
            onClick={() => onGo(parent.id)}
            className="font-medium text-accent underline decoration-line underline-offset-2 hover:decoration-accent"
          >
            {parent.name}
          </button>
        </span>
      </div>
      <h4 className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">
        {t('panel.why')}
      </h4>
      <p className="mt-1 text-sm leading-relaxed">{b.reason}</p>
      {b.added.length > 0 && (
        <>
          <h4 className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">
            {t('panel.added')}
          </h4>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm marker:text-muted">
            {b.added.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </>
      )}
      {b.removed.length > 0 && (
        <>
          <h4 className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">
            {t('panel.removed')}
          </h4>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm marker:text-muted">
            {b.removed.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </>
      )}
      <Sources sources={b.sources} />
    </section>
  );
}
