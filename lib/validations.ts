import { z } from 'zod'

// Transaction validation schema from technical plan
export const TransactionSchema = z.object({
  source_id: z.number(),
  unit_id: z.number().optional(),
  date: z.union([z.date(), z.string().min(1)]),
  description: z.string().min(1).max(255),
  amount: z.number(),
  source_category: z.string().optional(),
  category_id: z.number().optional(),
  ignore: z.boolean().default(false),
  notes: z.string().optional(),
  tags: z
    .string()
    .optional()
    .refine(
      (tags) => !tags || tags.split(',').every((tag) => tag.trim().length > 0),
      'All tags must be non-empty'
    ),
})

export type TransactionInput = z.infer<typeof TransactionSchema>

// Tag schema from technical plan
export const TagSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      'Tags can only contain letters, numbers, hyphens, and underscores'
    ),
})

export type TagInput = z.infer<typeof TagSchema>

// Small helper to validate and normalize date to ISO string
export function validateTransaction(input: unknown) {
  const parsed = TransactionSchema.safeParse(input)
  if (!parsed.success) return parsed

  const value = parsed.data
  const isoDate = value.date instanceof Date ? value.date.toISOString().split('T')[0] : value.date
  return {
    success: true as const,
    data: { ...value, date: isoDate },
  }
}

