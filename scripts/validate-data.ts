/**
 * Validates src/data/religions.json against the schema and integrity rules.
 * Usage: pnpm validate-data [path/to/religions.json]
 * Exits with code 1 and a readable list of problems if anything is wrong.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseTodoSourceIds, validateDataset } from '../src/data/schema.ts';

const root = resolve(import.meta.dirname, '..');
const dataPath = resolve(root, process.argv[2] ?? 'src/data/religions.json');
const todoPath = resolve(root, 'data/TODO-sources.md');

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(dataPath, 'utf8'));
} catch (err) {
  console.error(`✗ Could not read ${dataPath}: ${(err as Error).message}`);
  process.exit(1);
}

const todoSourceIds = existsSync(todoPath)
  ? parseTodoSourceIds(readFileSync(todoPath, 'utf8'))
  : new Set<string>();

const result = validateDataset(raw, { todoSourceIds });
if (!result.ok) {
  console.error(`✗ ${dataPath} is invalid (${result.errors.length} problem(s)):`);
  for (const e of result.errors) console.error(`  - ${e}`);
  process.exit(1);
}

const { traditions, branches } = result.data;
console.log(`✓ Data valid: ${traditions.length} traditions, ${branches.length} branches.`);
