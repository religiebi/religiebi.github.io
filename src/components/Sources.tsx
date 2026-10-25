import type { Source } from '../data/types.ts';
import { t } from '../i18n/t.ts';

export function Sources({ sources }: { sources?: Source[] }) {
  if (!sources?.length) return null;
  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold tracking-wide text-muted uppercase">
        {t('panel.sources')}
      </h4>
      <ul className="mt-1 space-y-1 text-sm">
        {sources.map((s, i) => (
          <li key={i} className="leading-snug">
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline decoration-line underline-offset-2 hover:decoration-accent"
              >
                {s.title}
              </a>
            ) : (
              <span>{s.title}</span>
            )}
            {s.publisher && <span className="text-muted"> — {s.publisher}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
