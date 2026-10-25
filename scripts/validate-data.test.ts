import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const run = (file?: string) =>
  spawnSync(
    process.execPath,
    ['--import', 'tsx', 'scripts/validate-data.ts', ...(file ? [file] : [])],
    {
      cwd: root,
      encoding: 'utf8',
    },
  );

describe('scripts/validate-data.ts', () => {
  it('passes on the real dataset', () => {
    const r = run();
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Data valid/);
  });

  it('exits 1 with a clear message for a dangling "from" id', () => {
    const data = JSON.parse(readFileSync(join(root, 'src/data/religions.json'), 'utf8'));
    data.branches[0].from = 'does-not-exist';
    const file = join(mkdtempSync(join(tmpdir(), 'bof-')), 'bad.json');
    writeFileSync(file, JSON.stringify(data));
    const r = run(file);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(
      `branch "${data.branches[0].id}": "from" references unknown tradition "does-not-exist"`,
    );
  }, 30_000);
});
