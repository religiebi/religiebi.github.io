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
public/                       favicon.svg, robots.txt, 404.html (redirects to /), og image
scripts/validate-data.ts      CLI validator used by `pnpm build`, CI and tests
data/TODO-sources.md          entries whose sources/dates still need human verification
src/data/religions.json       THE dataset (single source of truth)
src/data/schema.ts            Zod schemas + validateDataset() integrity checks (pure)
src/data/types.ts             TypeScript types inferred from the schema
src/data/load.ts              runtime load + validation of the dataset
src/data/stress.ts            generator for large synthetic datasets (perf testing only)
src/components/Chart.tsx      SVG chart: axis, era bands, lanes, bars, rails, today marker
src/components/Panel.tsx      detail panel (sidebar on desktop, bottom sheet on mobile)
src/components/Header.tsx     title, search, family chips, view/theme/guide controls
src/components/Legend.tsx     guide panel: colour + rail-type legend and data disclaimer
src/components/ListView.tsx   text list of all traditions and branches (accessible alternative)
src/components/About.tsx      About & corrections page
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
`src/hooks/viewStore.ts`, `src/data/load.ts`, `src/data/stress.ts` and `src/i18n/t.ts` were added
so that hash parsing, view maths, data loading and translation stay pure and testable.

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
- **Spacing**: 4px base unit. Lane height 30px, bar height 14px, family header row 24px, axis 32px.
  Rails sharing a year are offset by 5px steps, centred on the year.
- **Interaction**: drag pans; wheel/trackpad/pinch zooms the time axis only; shift+wheel or
  horizontal wheel scrolls/pans; vertical drag scrolls lanes; `+`/`−`/fit buttons; keyboard arrows
  pan, `+`/`-` zoom, `0` fits, `Esc` clears selection. Zoom range: whole timeline to ≈ 1px per
  month. Panning is clamped so data never leaves the viewport. Fly-to animations interpolate the
  visible-year window with `d3-ease` cubic in-out (≈ 650 ms) and jump instantly under
  `prefers-reduced-motion`.
- **Dimming**: lineage highlight, family filters and search all dim (opacity ≈ 0.18) rather than
  hide. Focus rings use `--focus` and are always visible on keyboard focus.

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

- [ ] `pnpm install && pnpm dev` works; `pnpm build` yields a working `dist/`.
- [ ] All features work on desktop and a 360px viewport in both themes.
- [ ] `#/t/lutheranism` opens with Lutheranism selected and framed.
- [ ] A dangling `from` id in the data makes `pnpm build` fail with a clear error.
- [ ] The Actions workflow is valid and documented.
- [ ] `AGENTS.md` is complete, accurate and current.

## 9. Progress log

- 2026-10-25 — Step 0: wrote AGENTS.md and CLAUDE.md. Verified current package versions on npm
  (Vite 8.3, React 19.3, Tailwind 4.3, Zod 4.6, Vitest 5.0, ESLint 10, pnpm 12). Chose TS 6.0.x
  over TS 7 because typescript-eslint 8.72 requires `typescript <6.1`.

## 10. Open questions / content gaps

- See `data/TODO-sources.md` for entries needing human verification.
- Georgian localisation: Newsreader and Public Sans have no Georgian glyphs; a Georgian-capable
  font (for example Noto Serif/Sans Georgian via @fontsource) will be needed.
