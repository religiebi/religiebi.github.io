import { dataset } from '../data/load.ts';
import { t } from '../i18n/t.ts';

const ISSUES_URL = 'https://github.com/religiebi/religiebi.github.io/issues';

/** About & corrections page (#/about). Long-form copy stays in English until i18n of content. */
export function About() {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-canvas">
      <article className="mx-auto max-w-2xl px-4 py-8 text-[15px] leading-relaxed md:px-6">
        <a href="#/" className="text-sm text-accent underline underline-offset-2">
          ← {t('about.back')}
        </a>
        <h2 className="mt-4 font-display text-4xl leading-tight">{t('about.title')}</h2>

        <p className="mt-4">
          <em>Branches of Faith</em> is an interactive chart of how religious traditions branched
          from one another. This first edition covers {dataset.traditions.length} traditions and{' '}
          {dataset.branches.length} branches of the Abrahamic family: Judaism, Christianity, Islam
          and the Bábí and Bahá'í faiths.
        </p>

        <h3 className="mt-8 font-display text-2xl">How to read the chart</h3>
        <p className="mt-2">
          Each horizontal bar is a tradition, drawn from its conventional start year to its end, or
          to today if it is still active. Each vertical rail is a branch: it leaves the parent's
          lane at the year of the split and ends where the new tradition begins. The line style
          shows the kind of branch (schism, reform, movement, revelation or influence); the colour
          shows the broad group. Open the Guide for the full legend.
        </p>

        <h3 className="mt-8 font-display text-2xl">What the chart simplifies</h3>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            Religious change is gradual. A single year marks a conventional turning point (a
            council, a declaration, a founding), not the moment a community suddenly changed.
          </li>
          <li>
            Many traditions had several sources. The chart usually draws one primary parent, and an
            occasional dotted "influence" rail; the branch text says when a parent is a modelling
            simplification.
          </li>
          <li>
            Traditions often describe their own origins differently from historians. Where they
            differ, the text gives both, labelled as self-description and scholarly framing.
          </li>
          <li>
            Dates marked "c." are approximate. A branch counts as one event even when, as with the
            East–West Schism, historians see a long process.
          </li>
        </ul>

        <h3 className="mt-8 font-display text-2xl">Neutrality</h3>
        <p className="mt-2">
          The summaries describe what traditions teach and how they began. They do not claim any
          tradition is true or false, and doctrinal statements are attributed ("teaches that",
          "according to tradition").
        </p>

        <h3 className="mt-8 font-display text-2xl">Sources and corrections</h3>
        <p className="mt-2">
          Each tradition and branch lists its sources: mainly encyclopaedias, academic works and
          traditions' own official histories. Some details are still awaiting verification and are
          tracked openly in the project's{' '}
          <code className="font-mono text-sm">data/TODO-sources.md</code>.
        </p>
        <p className="mt-2">
          Found a mistake, an unfair description or a missing tradition? Please open an issue with a
          source.
        </p>
        <p className="mt-4">
          <a
            href={ISSUES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-line bg-surface px-3 py-2 font-medium text-accent hover:bg-surface-2"
          >
            {t('about.issues')} ↗
          </a>
        </p>

        <h3 className="mt-8 font-display text-2xl">Accessibility</h3>
        <p className="mt-2">
          Every bar is a keyboard-focusable button, and the List view presents the full dataset as
          text. The colour theme follows your system and can be switched in the header.
        </p>
      </article>
    </div>
  );
}
