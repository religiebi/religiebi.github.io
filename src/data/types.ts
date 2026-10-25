import type { z } from 'zod';
import type {
  branchSchema,
  branchTypeSchema,
  datasetSchema,
  familySchema,
  groupSchema,
  sourceSchema,
  traditionSchema,
} from './schema.ts';

export type Source = z.infer<typeof sourceSchema>;
export type Family = z.infer<typeof familySchema>;
export type Group = z.infer<typeof groupSchema>;
export type BranchType = z.infer<typeof branchTypeSchema>;
export type Tradition = z.infer<typeof traditionSchema>;
export type Branch = z.infer<typeof branchSchema>;
export type Dataset = z.infer<typeof datasetSchema>;
