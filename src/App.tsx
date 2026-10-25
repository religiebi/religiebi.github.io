import { useRef, useState } from 'react';
import { NOW, dataset, loadErrors } from './data/load.ts';
import { Chart } from './components/Chart.tsx';
import { Header } from './components/Header.tsx';
import { Legend } from './components/Legend.tsx';
import { ListView } from './components/ListView.tsx';
import { Panel } from './components/Panel.tsx';
import { About } from './components/About.tsx';
import { useApp } from './hooks/useSelection.ts';
import { useTheme } from './hooks/useTheme.ts';
import { useUrlHash } from './hooks/useUrlHash.ts';
import { createViewStore } from './hooks/viewStore.ts';
import { timeDomain } from './lib/view.ts';
import { t } from './i18n/t.ts';

const domain = timeDomain(dataset.traditions, NOW);

export function App() {
  useUrlHash();
  const { mode, cycle } = useTheme();
  const view = useApp((s) => s.view);
  const guideOpen = useApp((s) => s.guideOpen);
  const aboutOpen = useApp((s) => s.aboutOpen);
  // The view store outlives the chart so switching to the list and back keeps the framing.
  const [store] = useState(() => createViewStore({ win: domain, scrollY: 0 }));
  const guideButtonRef = useRef<HTMLButtonElement>(null);

  if (loadErrors.length) {
    return (
      <main className="p-6">
        <h1 className="font-display text-2xl">{t('app.title')}</h1>
        <p className="mt-2">{t('app.loadError')}</p>
        <ul className="mt-3 list-disc pl-5 font-mono text-sm">
          {loadErrors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </main>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header theme={mode} onCycleTheme={cycle} guideButtonRef={guideButtonRef} />
      <main className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <section
          className="relative min-h-0 min-w-0 flex-1"
          aria-label={view === 'chart' ? t('view.chart') : t('view.list')}
        >
          {aboutOpen ? (
            <About />
          ) : view === 'chart' ? (
            <Chart store={store} domain={domain} />
          ) : (
            <ListView />
          )}
        </section>
        {!aboutOpen && <Panel />}
      </main>
      {guideOpen && <Legend returnFocusTo={guideButtonRef} />}
    </div>
  );
}
