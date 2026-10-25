import { dataset, incoming, outgoing, traditionById, groupLabel } from '../data/load.ts';
import { useApp } from '../hooks/useSelection.ts';
import { formatRange, formatYearApprox } from '../lib/format.ts';
import { t } from '../i18n/t.ts';
import { groupColor, groupFill } from './railStyle.ts';
import { Sources } from './Sources.tsx';

/**
 * Text version of the whole chart: every tradition and branch, grouped by family. This is the
 * accessible alternative to the SVG and is available to everyone via the List toggle.
 */
export function ListView() {
  const selectedId = useApp((s) => s.selectedId);
  const families = useApp((s) => s.families);
  const query = useApp((s) => s.query);
  const results = useApp((s) => s.results);
  const setView = useApp((s) => s.setView);
  const selectTradition = useApp((s) => s.selectTradition);
  const match = query.trim() ? new Set(results.traditions) : null;

  const show = (id: string) => {
    setView('chart');
    selectTradition(id, { fly: true });
  };

  return (
    <div className="absolute inset-0 overflow-y-auto bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <h2 className="font-display text-3xl">{t('list.title')}</h2>
        <p className="mt-1 text-sm text-muted">{t('list.intro')}</p>
        {dataset.families
          .filter((f) => families.includes(f.id))
          .map((f) => (
            <section key={f.id} aria-labelledby={`fam-${f.id}`} className="mt-8">
              <h2
                id={`fam-${f.id}`}
                className="border-b border-line pb-1 text-xs font-semibold tracking-[0.12em] text-muted uppercase"
              >
                {f.label}
              </h2>
              {dataset.traditions
                .filter((tr) => tr.family === f.id && (!match || match.has(tr.id)))
                .map((tr) => (
                  <article
                    key={tr.id}
                    id={`list-${tr.id}`}
                    className={`mt-4 rounded-lg border p-4 ${selectedId === tr.id ? 'border-accent' : 'border-line'} bg-surface`}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-5 self-center rounded-sm border-[1.5px]"
                        style={{
                          borderColor: groupColor(tr.group),
                          background: groupFill(tr.group),
                        }}
                      />
                      <h3 className="font-display text-xl">{tr.name}</h3>
                      <span className="font-mono text-sm text-muted">
                        {formatRange(tr.start, tr.end, tr.approx, t('panel.today'))}
                      </span>
                      <span className="text-sm text-muted">{groupLabel.get(tr.group)}</span>
                      <button
                        type="button"
                        onClick={() => show(tr.id)}
                        className="ml-auto text-sm text-accent underline underline-offset-2"
                      >
                        {t('list.showOnChart')}
                        <span className="sr-only">: {tr.name}</span>
                      </button>
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed">{tr.summary}</p>
                    <Sources sources={tr.sources} />

                    {(incoming.get(tr.id) ?? []).map((b) => (
                      <div key={b.id} className="mt-4 border-l-2 border-line pl-3">
                        <h4 className="text-sm font-semibold">
                          {t('list.branchFrom', {
                            from: traditionById.get(b.from)?.name ?? b.from,
                            year: formatYearApprox(b.year, b.approx),
                            type: t(`type.${b.type}`).toLowerCase(),
                          })}
                        </h4>
                        <p className="mt-1 text-sm leading-relaxed">{b.reason}</p>
                        {b.added.length > 0 && (
                          <p className="mt-1 text-sm">
                            <span className="font-medium">{t('panel.added')}:</span>{' '}
                            {b.added.join('; ')}
                          </p>
                        )}
                        {b.removed.length > 0 && (
                          <p className="mt-1 text-sm">
                            <span className="font-medium">{t('panel.removed')}:</span>{' '}
                            {b.removed.join('; ')}
                          </p>
                        )}
                        <Sources sources={b.sources} />
                      </div>
                    ))}

                    {(outgoing.get(tr.id) ?? []).length > 0 && (
                      <p className="mt-3 text-sm text-muted">
                        {t('panel.branchesFrom')}:{' '}
                        {(outgoing.get(tr.id) ?? [])
                          .map(
                            (b) =>
                              `${traditionById.get(b.to)?.name} (${formatYearApprox(b.year, b.approx)})`,
                          )
                          .join(', ')}
                      </p>
                    )}
                  </article>
                ))}
            </section>
          ))}
      </div>
    </div>
  );
}
