import { describe, expect, it } from 'vitest';
import { validateDataset } from './schema.ts';
import { generateStressData } from './stress.ts';

describe('generateStressData', () => {
  it('produces a valid dataset of at least 150 traditions and 200 branches', () => {
    const data = generateStressData();
    expect(data.traditions.length).toBeGreaterThanOrEqual(150);
    expect(data.branches.length).toBeGreaterThanOrEqual(200);
    const result = validateDataset(data, { currentYear: 2026 });
    expect(result.errors).toEqual([]);
  });
});
