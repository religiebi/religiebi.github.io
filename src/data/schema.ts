import { z } from 'zod';

/**
 * Zod schemas for src/data/religions.json plus integrity checks that Zod alone cannot express
 * (references, cycles, year agreement). Pure: no file-system or DOM access, so it runs in the
 * browser, in Vitest and in scripts/validate-data.ts.
 */

const idSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase kebab-case (a-z, 0-9, -)');
const text = z.string().trim().min(1, 'must not be empty');
const year = z.number().int('must be a whole year');

export const sourceSchema = z.strictObject({
  title: text,
  url: z
    .string()
    .regex(/^https?:\/\/\S+$/, 'must be an http(s) URL')
    .optional(),
  publisher: text.optional(),
});

export const familySchema = z.strictObject({ id: idSchema, label: text });
export const groupSchema = z.strictObject({ id: idSchema, label: text });

export const branchTypes = ['schism', 'reform', 'movement', 'revelation', 'influence'] as const;
export const branchTypeSchema = z.enum(branchTypes);

export const traditionSchema = z.strictObject({
  id: idSchema,
  name: text,
  family: idSchema,
  group: idSchema,
  start: year,
  end: year.nullable(),
  approx: z.boolean().optional(),
  summary: text,
  sources: z.array(sourceSchema).optional(),
});

export const branchSchema = z.strictObject({
  id: idSchema,
  from: idSchema,
  to: idSchema,
  year,
  approx: z.boolean().optional(),
  type: branchTypeSchema,
  reason: text,
  added: z.array(text),
  removed: z.array(text),
  sources: z.array(sourceSchema).optional(),
});

export const datasetSchema = z.strictObject({
  families: z.array(familySchema).min(1),
  groups: z.array(groupSchema).min(1),
  traditions: z.array(traditionSchema).min(1),
  branches: z.array(branchSchema),
});

/** Allowed |branch.year − child.start| when the branch or the child is marked approximate. */
export const APPROX_TOLERANCE_YEARS = 5;

export type Dataset = z.infer<typeof datasetSchema>;

export interface ValidateOptions {
  /** Branch ids listed in data/TODO-sources.md. When omitted, the source check is skipped. */
  todoSourceIds?: ReadonlySet<string>;
  /** Current year, injectable for tests. */
  currentYear?: number;
}

export type ValidationResult =
  { ok: true; data: Dataset; errors: [] } | { ok: false; data?: undefined; errors: string[] };

function formatZodPath(path: PropertyKey[], raw: unknown): string {
  // Turn ["branches", 3, "from"] into "branches[3] (b-foo).from" for readable messages.
  let out = '';
  let node: unknown = raw;
  for (const key of path) {
    if (typeof key === 'number') {
      out += `[${key}]`;
      node = Array.isArray(node) ? node[key] : undefined;
      const id = (node as { id?: unknown } | undefined)?.id;
      if (typeof id === 'string') out += ` (${id})`;
    } else {
      out += out ? `.${String(key)}` : String(key);
      node =
        node && typeof node === 'object'
          ? (node as Record<string, unknown>)[key as string]
          : undefined;
    }
  }
  return out || '(root)';
}

/** Full validation: shape first, then integrity. Never throws; collects every error. */
export function validateDataset(raw: unknown, options: ValidateOptions = {}): ValidationResult {
  const parsed = datasetSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${formatZodPath(i.path, raw)}: ${i.message}`),
    };
  }
  const data = parsed.data;
  const errors = checkIntegrity(data, options);
  return errors.length ? { ok: false, errors } : { ok: true, data, errors: [] };
}

function checkUnique(kind: string, items: { id: string }[], errors: string[]): Set<string> {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) errors.push(`${kind} "${item.id}": duplicate id`);
    seen.add(item.id);
  }
  return seen;
}

export function checkIntegrity(data: Dataset, options: ValidateOptions = {}): string[] {
  const errors: string[] = [];
  const now = options.currentYear ?? new Date().getFullYear();

  const families = checkUnique('family', data.families, errors);
  const groups = checkUnique('group', data.groups, errors);
  checkUnique('tradition', data.traditions, errors);
  checkUnique('branch', data.branches, errors);

  const byId = new Map(data.traditions.map((t) => [t.id, t]));

  for (const t of data.traditions) {
    if (!families.has(t.family)) errors.push(`tradition "${t.id}": unknown family "${t.family}"`);
    if (!groups.has(t.group)) errors.push(`tradition "${t.id}": unknown group "${t.group}"`);
    if (t.end !== null && t.end < t.start)
      errors.push(`tradition "${t.id}": end (${t.end}) is before start (${t.start})`);
    if (t.start > now) errors.push(`tradition "${t.id}": start (${t.start}) is in the future`);
    if (t.end !== null && t.end > now)
      errors.push(`tradition "${t.id}": end (${t.end}) is in the future; use null for ongoing`);
  }

  for (const b of data.branches) {
    const from = byId.get(b.from);
    const to = byId.get(b.to);
    if (!from) errors.push(`branch "${b.id}": "from" references unknown tradition "${b.from}"`);
    if (!to) errors.push(`branch "${b.id}": "to" references unknown tradition "${b.to}"`);
    if (b.from === b.to) errors.push(`branch "${b.id}": "from" and "to" are the same tradition`);
    if (from && to) {
      const tol = b.approx || to.approx ? APPROX_TOLERANCE_YEARS : 0;
      if (Math.abs(b.year - to.start) > tol) {
        errors.push(
          `branch "${b.id}": year ${b.year} does not match start of "${to.id}" (${to.start}); ` +
            `tolerance is ${tol} year(s)${tol ? '' : ' — mark the branch or child "approx" if uncertain'}`,
        );
      }
      const parentTol = b.approx || from.approx ? APPROX_TOLERANCE_YEARS : 0;
      const parentEnd = from.end ?? now;
      if (b.year < from.start - parentTol || b.year > parentEnd + parentTol) {
        errors.push(
          `branch "${b.id}": year ${b.year} is outside the lifespan of parent "${from.id}" ` +
            `(${from.start}–${from.end ?? 'today'})`,
        );
      }
    }
    if (options.todoSourceIds && !b.sources?.length && !options.todoSourceIds.has(b.id)) {
      errors.push(`branch "${b.id}": has no sources and is not listed in data/TODO-sources.md`);
    }
  }

  const cycle = findCycle(data);
  if (cycle) errors.push(`branches form a cycle: ${cycle.join(' → ')}`);

  return errors;
}

/** Returns one cycle as a list of tradition ids (first id repeated at the end), or null. */
export function findCycle(data: Pick<Dataset, 'branches'>): string[] | null {
  const out = new Map<string, string[]>();
  for (const b of data.branches) {
    if (b.from === b.to) continue; // reported separately
    const list = out.get(b.from) ?? [];
    list.push(b.to);
    out.set(b.from, list);
  }
  const state = new Map<string, 1 | 2>(); // 1 = on stack, 2 = done
  const stack: string[] = [];
  const visit = (id: string): string[] | null => {
    state.set(id, 1);
    stack.push(id);
    for (const next of out.get(id) ?? []) {
      const s = state.get(next);
      if (s === 1) return [...stack.slice(stack.indexOf(next)), next];
      if (s === undefined) {
        const found = visit(next);
        if (found) return found;
      }
    }
    stack.pop();
    state.set(id, 2);
    return null;
  };
  for (const id of out.keys()) {
    if (!state.has(id)) {
      const found = visit(id);
      if (found) return found;
    }
  }
  return null;
}

/** Extracts backticked branch ids from the markdown of data/TODO-sources.md. */
export function parseTodoSourceIds(markdown: string): Set<string> {
  const ids = new Set<string>();
  for (const m of markdown.matchAll(/`(b-[a-z0-9-]+)`/g)) ids.add(m[1]!);
  return ids;
}
