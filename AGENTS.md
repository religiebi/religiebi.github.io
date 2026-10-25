# AGENTS.md — Branches of Faith

This file is the single source of truth for working on this repository. Read it at the start of
every work session. If anything here is stale, fixing it is part of the task.

## 1. Purpose and audience

**Branches of Faith** is an interactive, scholarly-looking chart of how religious traditions
branched from one another over time. The first dataset covers the Abrahamic family (Judaism,
Christianity, Islam, the Bábí and Bahá'í faiths and selected offshoots). The data model allows more
families to be added later.

- Every **tradition** is a horizontal lane with a bar from its start year to its end year (or
  today, if it is still active), on one shared time axis that runs from BCE to the present.
- Every **branch** is a vertical rail from the parent's lane at the year of the split down or up to
  the start of the child's bar. The line style shows what kind of split it was.
- Users pan and zoom the chart like a map. Zooming stretches only the time axis; text stays the
  same size.
- Clicking a bar or rail opens a detail panel: when the branch happened, why, what it added and
  what it left behind, with sources.

Audience: curious general readers, students and teachers. The tone is a calm reference plate,
not a marketing page. The chart is the hero of the site.

Hosted as a GitHub **user site** at `https://religiebi.github.io/` (base path `/`).

## 2. Tech stack and commands

| Concern         | Choice                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Build           | Vite 8 (Rolldown) + `@vitejs/plugin-react` 6                                                                                          |
| UI              | React 19, TypeScript (strict). TS is pinned to **6.0.x** because `typescript-eslint` does not yet support TS 7 (peer range `<6.1.0`). |
| CSS             | Tailwind CSS v4 via `@tailwindcss/vite`; all colours are CSS variables exposed as Tailwind theme tokens                               |
| Charts          | D3 **modular** packages only: `d3-scale`, `d3-zoom`, `d3-selection`, `d3-array`, `d3-interpolate`, `d3-ease`. Never `import * as d3`. |
| State           | Zustand (app state). Per-frame zoom/view state lives in a tiny external store (`src/hooks/viewStore.ts`), not React state             |
| Validation      | Zod 4                                                                                                                                 |
| Tests           | Vitest + React Testing Library + jsdom                                                                                                |
| Lint/format     | ESLint 10 (flat config, typescript-eslint, react-hooks, react-refresh) + Prettier                                                     |
| Fonts           | Self-hosted with `@fontsource`: Newsreader (display serif), Public Sans (UI), IBM Plex Mono (years)                                   |
| Package manager | **pnpm** (lockfile committed). `packageManager` is set in `package.json`.                                                             |

No runtime third-party requests. No SSR, no backend. Next.js was considered and rejected: the site
is fully static.

Commands:

```bash
pnpm install            # install dependencies
pnpm dev                # dev server at http://localhost:5173
pnpm validate-data      # validate src/data/religions.json (schema + integrity), exits 1 on errors
pnpm lint               # eslint + prettier --check
pnpm format             # prettier --write
pnpm typecheck          # tsc --noEmit (project references)
pnpm test               # vitest run (includes the data validation tests)
pnpm build              # validate-data → typecheck → vite build → dist/
pnpm build:docs         # same, but outputs to docs/ (Pages fallback mode, see §7)
pnpm preview            # serve dist/ locally
pnpm stress             # dev server with generated stress data (?stress in the URL also works)
```

## 3. Project structure

```
.github/workflows/deploy.yml  CI: lint, test, build on PRs; deploy to GitHub Pages on main
public/                       favicon.svg, robots.txt, sitemap.xml, 404.html (→ /), og-image.png
scripts/validate-data.ts      CLI validator used by `pnpm build`, CI and tests (+ .test.ts)
scripts/og-image.svg          source of public/og-image.png (regenerate command inside)
data/TODO-sources.md          entries whose sources/dates still need human verification
src/data/religions.json       THE dataset (single source of truth)
src/data/schema.ts            Zod schemas + validateDataset() integrity checks (pure)
src/data/types.ts             TypeScript types inferred from the schema
src/data/load.ts              runtime load, lookup maps, deferred Zod validation (separate chunk)
src/data/stress.ts            generator for large synthetic datasets (perf testing only)
src/components/Chart.tsx      SVG chart: axis, era bands, lanes, bars, rails, today marker
src/components/Panel.tsx      detail panel (sidebar on desktop, bottom sheet on mobile)
src/components/Header.tsx     title, search, family chips, view/theme/guide controls
src/components/Legend.tsx     guide panel: colour + rail-type legend and data disclaimer
src/components/ListView.tsx   text list of all traditions and branches (accessible alternative)
src/components/About.tsx      About & corrections page
src/components/TypePill.tsx   branch-type pill and rail-style sample (legend, panel)
src/components/Sources.tsx    source list
src/components/railStyle.ts   rail stroke styles per branch type; group colour helpers
src/App.tsx                   layout shell; App.test.tsx is the integration test
src/test/setup.ts             jest-dom matchers + Testing Library cleanup
src/hooks/useZoom.ts          attaches d3-zoom to the SVG ref; drives the view store
src/hooks/viewStore.ts        tiny external store for the visible window (per-frame state)
src/hooks/useSelection.ts     Zustand app store: selection, search, filters, view mode
src/hooks/useUrlHash.ts       syncs selection/view with the location hash
src/hooks/useTheme.ts         light/dark/system theme, persisted in localStorage
src/lib/layout.ts             lane rows, rail geometry, rail offsets, label placement (pure)
src/lib/format.ts             year formatting and tick generation (pure)
src/lib/search.ts             text folding and search over traditions/branches (pure)
src/lib/lineage.ts            ancestor/descendant traversal (pure)
src/lib/route.ts              hash route parse/serialise (pure; added beyond the brief, see note)
src/lib/view.ts               visible-window ↔ zoom-transform maths and framing (pure)
src/i18n/en.json              all UI strings
src/i18n/t.ts                 tiny t() helper
index.html, vite.config.ts, README.md, AGENTS.md, CLAUDE.md
```

Deviations from the original brief (deliberate): `src/lib/route.ts`, `src/lib/view.ts`,
`src/hooks/viewStore.ts`, `src/data/load.ts`, `src/data/stress.ts`, `src/i18n/t.ts` and the small
component helpers above were added so that hash parsing, view maths, data loading and translation
stay pure and testable. TypeScript configs: `tsconfig.app.json` (src, no tests),
`tsconfig.node.json` (vite config + scripts), `tsconfig.test.json` (tests, with Node types).
Vitest defaults to the `node` environment; component tests opt in with a
`// @vitest-environment jsdom` docblock.

## 4. Data schema, validation and editing

Source of truth: `src/data/religions.json`:

```jsonc
{
  "families":   [{ "id": "judaism", "label": "Judaism" }],
  "groups":     [{ "id": "judaism", "label": "Judaism" }],      // drives colour; see §6
  "traditions": [Tradition],   // array order = lane order, top to bottom
  "branches":   [Branch]
}
```

```ts
type Source = { title: string; url?: string; publisher?: string };
type BranchType = 'schism' | 'reform' | 'movement' | 'revelation' | 'influence';
type Tradition = {
  id: string;
  name: string;
  family: string;
  group: string;
  start: number;
  end: number | null; // integer years; negative = BCE; null = ongoing
  approx?: boolean;
  summary: string;
  sources?: Source[];
};
type Branch = {
  id: string;
  from: string;
  to: string;
  year: number;
  approx?: boolean;
  type: BranchType;
  reason: string;
  added: string[];
  removed: string[];
  sources?: Source[];
};
```

Conventions:

- Ids are lowercase kebab-case. Branch ids are `b-<child-id>` for the primary parent and
  `b-<child-id>-<qualifier>` for extra parents (e.g. `b-baptists-anabaptist-influence`).
- Years are astronomical-ish integers with no year 0 handling: `-516` means 516 BCE. The chart
  treats years linearly; the one-year BCE/CE offset is ignored at this scale.
- A tradition can have several incoming branches (e.g. a primary parent plus an `influence`).

Validation (`validateDataset` in `src/data/schema.ts`; CLI in `scripts/validate-data.ts`). Errors
are collected, not thrown one by one, and printed with the offending id:

1. Zod shape: required fields, types, non-empty strings, kebab-case ids, `url` must be http(s).
2. Unique ids across families, groups, traditions and branches (each list separately).
3. References exist: `tradition.family`, `tradition.group`, `branch.from`, `branch.to`.
4. `end >= start` when `end` is not null; `start` and `end` not in the future.
5. No self-loops and no cycles in the branch graph.
6. `branch.year` equals the child's `start`. Tolerance: **0 years**, or **≤ 5 years** when the
   branch or the child is marked `approx`.
7. `branch.year` lies within the parent's lifespan (`start … end ?? now`), same tolerance.
8. Non-empty `reason`.
9. Every branch has ≥ 1 source **or** its id appears in backticks in `data/TODO-sources.md`.
   (The browser runtime skips check 9 because it cannot read that file.)

Runtime validation: `src/data/load.ts` uses the JSON immediately and validates it with the same
schema in a lazily imported chunk right after start-up (keeps ~25 kB gzipped of Zod off the
critical path). If it fails, `App` replaces the chart with the list of errors.

`pnpm build`, CI and `src/data/schema.test.ts` all run validation; any error fails the build.

### Adding or editing a tradition

1. Add a `Tradition` object to `traditions` at the lane position you want (array order = lanes).
   Use an existing `family` and `group`, or add new ones (new groups need colour tokens, §6).
2. Add one `Branch` per parent with `year === child.start` (or mark both approximate).
3. Write neutral text (§5) and add sources. If you cannot source something yet, add the branch id
   to `data/TODO-sources.md` with what needs checking.
4. Run `pnpm validate-data` and `pnpm test`.

Future-proofing: text fields are plain strings today; they may later become
`string | Record<locale, string>`. Lane order is the array order today; it may later be computed to
keep children near parents. The layout code must not assume dataset size.

## 5. Content, neutrality and sourcing

- Neutral, descriptive language. Describe what a tradition teaches and how it began. Never claim a
  tradition is true or false, and never editorialise.
- Attribute doctrinal claims: "teaches that", "according to tradition", "adherents hold".
- Newer or contested movements: give the movement's own historical self-description and the
  mainstream scholarly framing where they differ, and label each.
- Where a rail is a modelling simplification (for example, the Reformed parent of the Latter Day
  Saints, or the Baptist parent of Adventism), say so in the branch `reason`.
- Dates must be defensible. Mark uncertain ones `approx: true` and log them in
  `data/TODO-sources.md`.
- **Never fabricate sources or URLs.** A source URL is only added after it has been seen as a real
  page (fetched or an exact search result). Prefer encyclopaedias (Britannica, Encyclopaedia
  Iranica, Jewish Virtual Library/Encyclopaedia Judaica, YIVO), academic publishers and official
  histories of the tradition itself (labelled as such by the publisher field).
- If a seed date conflicts with reliable sources, trust the sources and note the change in the
  Progress log.

## 6. Design system

Mood: calm, precise, dense but legible, like a chart-room plate. No gradient hero, no emoji icons,
no stock illustration.

- **Fonts**: `--font-display` Newsreader (titles, panel headings); `--font-sans` Public Sans (UI,
  labels); `--font-mono` IBM Plex Mono (years, axis ticks).
- **Surfaces** (blue-grey neutrals), defined in `src/index.css` under `:root` and
  `[data-theme='dark']`: `--bg`, `--surface`, `--surface-2`, `--border`, `--grid`, `--text`,
  `--text-muted`, `--accent`, `--focus`, `--halo` (text halo = background colour).
- **Group colours** (8): `--g-judaism`, `--g-early-christianity`, `--g-eastern-churches`,
  `--g-catholic`, `--g-protestant`, `--g-movements-19c`, `--g-islam`, `--g-babi-bahai`. Used as
  strokes; fills are the same colour at ~25% (`color-mix`). Light and dark values are tuned
  separately; strokes keep ≥ 3:1 contrast against the chart background.
- **Rail styles** (colour is never the only signal):
  `schism` thick solid (3px) · `reform` solid (2px) · `movement` long dash `8 4` ·
  `revelation` dash-dot `8 3 2 3` · `influence` dotted `1.5 3.5` (round caps).
- **Spacing**: 4px base unit. Lane height 30px, bar height 14px, family header row 24px, axis 40px.
  Rails sharing a year are offset by 5px steps, centred on the year.
- **Interaction**: drag pans; wheel/trackpad/pinch zooms the time axis only; shift+wheel scrolls
  lanes and horizontal wheel pans; double-click zoom is disabled (it fought with clicking bars); vertical drag scrolls lanes; `+`/`−`/fit buttons; keyboard arrows
  pan, `+`/`-` zoom, `0` fits, `Esc` clears selection. Zoom range: whole timeline to ≈ 1px per
  month. Panning is clamped so data never leaves the viewport. Fly-to animations interpolate the
  visible-year window with `d3-ease` cubic in-out (≈ 650 ms) and jump instantly under
  `prefers-reduced-motion`.
- **Dimming**: lineage highlight, family filters and search all dim (opacity ≈ 0.18) rather than
  hide. Focus rings use `--focus` and are always visible on keyboard focus.
- **Layering** (bottom → top): era bands, grid, family headers, rails, bars, junction dots, labels,
  today marker, axis. Labels have their own layer so dots never cover them.
- **Layout**: desktop (≥ 768px) puts the panel in a right sidebar (340/380px). Below that the
  panel is a bottom sheet in the layout flow (the chart shrinks above it, max 50% height) and is
  hidden when nothing is selected. `index.html` contains a static header shell so the title paints
  before the script runs (LCP); keep it in sync with `Header.tsx`.
- Lanes are culled vertically only when there are more than 80 traditions (keeps every bar
  tabbable for the real dataset).

## 7. Deployment

**Primary: GitHub Actions** (`.github/workflows/deploy.yml`).

- Triggers: push to `main`, `pull_request` (checks only, no deploy) and `workflow_dispatch`.
- Permissions `contents: read`, `pages: write`, `id-token: write`; concurrency group `pages`.
- Steps: checkout → `pnpm/action-setup` → `actions/setup-node` (LTS, pnpm cache) →
  `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm test` → `pnpm build` →
  `actions/configure-pages` → `actions/upload-pages-artifact` (`dist`) → deploy job with
  `actions/deploy-pages`.
- One-time repo setting: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
- Vite `base: '/'` (user site).

**Fallback: `docs/` mode.** `pnpm build:docs` writes the site to `docs/`. Commit `docs/` and set
**Settings → Pages → Deploy from a branch → `main` / `/docs`**. Not the default; `docs/` is not
committed unless the owner asks.

Static extras: `public/404.html` redirects to `/` (keeping the hash), `robots.txt`, favicon,
`<title>`, meta description, Open Graph and Twitter tags in `index.html`.

## 8. Quality bars and Definition of Done

Quality bars:

- Lighthouse (mobile) ≥ 95 for Performance, Accessibility, Best Practices, SEO.
- Initial JS ≤ 150 kB gzipped. No runtime third-party requests.
- Smooth pan/zoom with ≥ 150 traditions and ≥ 200 branches (`?stress` URL flag).
- `pnpm build` fails on invalid data. No console errors/warnings in the production build.
- Pure `lib/` functions have unit tests, including: schema validation failures, search folding,
  lineage, label flipping, URL-hash round trip.

Definition of Done:

- [x] `pnpm install && pnpm dev` works; `pnpm build` yields a working `dist/`.
- [x] All features work on desktop and a 360px viewport in both themes.
- [x] `#/t/lutheranism` opens with Lutheranism selected and framed.
- [x] A dangling `from` id in the data makes `pnpm build` fail with a clear error
      (covered by `scripts/validate-data.test.ts`).
- [x] The Actions workflow is valid and documented (first run on GitHub succeeded).
- [x] `AGENTS.md` is complete, accurate and current.

## 9. Progress log

- 2026-10-25 — Step 0: wrote AGENTS.md and CLAUDE.md. Verified current package versions on npm
  (Vite 8.3, React 19.3, Tailwind 4.3, Zod 4.6, Vitest 5.0, ESLint 10, pnpm 12). Chose TS 6.0.x
  over TS 7 because typescript-eslint 8.72 requires `typescript <6.1`.
- 2026-10-25 — Data: researched all 27 traditions and 28 branches (three parallel research passes,
  sources verified by fetch or exact search-result URL). **Date change vs. the seed:** Conservative
  Judaism 1887 → **1886** (JTS founded January 1886; classes began 1887). All other seed dates
  held. Added Zod schema, integrity checks, CLI validator and tests.
- 2026-10-25 — Pure lib (layout, format, search, lineage, route, view) with unit tests.
- 2026-10-25 — UI: chart (era bands, ticks, rails with offsets, junction dots, pinned/flipped
  labels, today marker, scroll indicator), d3-zoom hook with external view store, panel, search,
  family chips, hash deep links, theme toggle, list view, guide, About; integration test.
- 2026-10-25 — Deploy workflow (checkout@v7, pnpm/action-setup@v6, setup-node@v7,
  configure-pages@v6, upload-pages-artifact@v5, deploy-pages@v5: latest majors per the GitHub
  releases API), README, public assets, OG image.
- 2026-10-25 — Quality pass: initial JS 123 kB gzipped (was 145 kB before moving Zod to a deferred
  chunk); Lighthouse mobile (headless Edge, gzip-serving static server) Performance 96–97,
  Accessibility 100, Best Practices 100, SEO 100. Stress test (160 traditions, 219 branches):
  p95 frame 16.8 ms while zooming and dragging. No console messages in the production build.
- 2026-10-25 — First push to `main`: "Build and deploy" run 40202947397 passed (lint, test,
  build, deploy). Live at https://religiebi.github.io/; `#/t/lutheranism` verified on the live site.

## 10. Open questions / content gaps

- Lighthouse LCP is ~2.6 s on simulated slow 4G (the header title waits for the Newsreader font
  swap). Preloading the Latin Newsreader file is a possible follow-up if the score drifts below 95.
- Influence rails from Rabbinic Judaism and Early Christianity to Islam cross many lanes; a future
  computed lane order could shorten them.
- Lineage, search and family dimming combine (any reason dims). Consider making search highlight
  rather than dim when a selection is active.

- See `data/TODO-sources.md` for entries needing human verification.
- Georgian localisation: Newsreader and Public Sans have no Georgian glyphs; a Georgian-capable
  font (for example Noto Serif/Sans Georgian via @fontsource) will be needed.
