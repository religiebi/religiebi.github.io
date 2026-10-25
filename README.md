# Branches of Faith

An interactive, sourced timeline of how the Abrahamic religions branched: Judaism, Christianity,
Islam, the Bábí and Bahá'í faiths, and selected offshoots. Every tradition is a bar on a shared
time axis, every branch a vertical rail, and every rail opens a short, neutral account of when it
branched, why, and what changed.

Live site: <https://religiebi.github.io/>

Contributors and coding agents: read [`AGENTS.md`](AGENTS.md) first. It documents the stack, data
schema, design system and conventions.

## Run locally

Requires Node 22+ and pnpm (the version is pinned in `package.json` → `packageManager`).

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

Other commands:

```bash
pnpm validate-data   # check src/data/religions.json
pnpm lint            # ESLint + Prettier check
pnpm test            # Vitest (unit, data and component tests)
pnpm build           # validate data, type-check, build to dist/
pnpm preview         # serve dist/
pnpm stress          # dev server with ~160 generated traditions for performance testing
```

Deep links use the hash: `/#/t/lutheranism` opens a tradition and `/#/b/b-eastern-orthodox` opens a
branch.

## Edit the data

All content lives in [`src/data/religions.json`](src/data/religions.json). It has four lists:
`families` (filter chips), `groups` (colours), `traditions` (lanes, in display order) and
`branches` (rails). The full schema and rules are in `AGENTS.md` §4. Validation runs in
`pnpm build`, in CI and in the tests, and a broken reference stops the build with a message such as:

```
✗ src/data/religions.json is invalid (1 problem(s)):
  - branch "b-rabbinic": "from" references unknown tradition "second-templ"
```

### Add a tradition

1. Add an entry to `traditions` where you want its lane:

   ```json
   {
     "id": "quakers",
     "name": "Quakers (Religious Society of Friends)",
     "family": "christianity",
     "group": "protestant",
     "start": 1652,
     "end": null,
     "summary": "Two or three neutral sentences on what it teaches and how it began.",
     "sources": [{ "title": "Quakers", "url": "https://…", "publisher": "…" }]
   }
   ```

2. Add one branch per parent. `year` must equal the child's `start` (or both may be marked
   `"approx": true`, allowing up to 5 years' difference):

   ```json
   {
     "id": "b-quakers",
     "from": "anglicanism",
     "to": "quakers",
     "year": 1652,
     "type": "movement",
     "reason": "Why it branched, in two or three sentences.",
     "added": ["What it introduced"],
     "removed": ["What it left behind"],
     "sources": [{ "title": "…", "url": "https://…" }]
   }
   ```

3. Follow the content rules in `AGENTS.md` §5: neutral wording, attributed doctrinal claims, both
   self-description and scholarly framing where they differ, and **no invented sources**. If a
   source is still missing, list the branch id in [`data/TODO-sources.md`](data/TODO-sources.md).
4. Run `pnpm validate-data && pnpm test`.

## Deploy

### GitHub Actions (default)

`.github/workflows/deploy.yml` lints, tests and builds every push and pull request. Pushes to
`main` are then deployed to GitHub Pages.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### Fallback: `docs/` folder

If Actions are unavailable:

```bash
pnpm build:docs   # writes the site to docs/
```

Remove `docs` from `.gitignore`, commit the `docs/` folder, and set **Settings → Pages → Deploy
from a branch → `main` / `/docs`**.

## Corrections

Spotted an error or an unfair description?
[Open an issue](https://github.com/religiebi/religiebi.github.io/issues) and include a source.
