import type { BranchType } from '../data/types.ts';
import { t } from '../i18n/t.ts';
import { RAIL_STYLE } from './railStyle.ts';

/** A short horizontal sample of a rail style, so legends and pills match the chart. */
export function RailSample({
  type,
  color = 'currentColor',
  length = 28,
}: {
  type: BranchType;
  color?: string;
  length?: number;
}) {
  const s = RAIL_STYLE[type];
  return (
    <svg
      width={length}
      height="10"
      viewBox={`0 0 ${length} 10`}
      aria-hidden="true"
      className="shrink-0"
    >
      <line
        x1="1"
        x2={length - 1}
        y1="5"
        y2="5"
        stroke={color}
        strokeWidth={s.width}
        strokeDasharray={s.dash}
        strokeLinecap={s.cap ?? 'butt'}
      />
    </svg>
  );
}

export function TypePill({ type, color }: { type: BranchType; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink"
      title={t(`typeDesc.${type}`)}
    >
      <RailSample type={type} color={color} length={20} />
      {t(`type.${type}`)}
    </span>
  );
}
