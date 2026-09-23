import { z } from 'zod';

export const worksQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  pillar: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  sort: z.enum(['newest', 'oldest', 'title']).default('newest')
}).strict();
