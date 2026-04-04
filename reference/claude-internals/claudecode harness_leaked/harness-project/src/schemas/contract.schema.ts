import { z } from 'zod'

export const criterionSchema = z.object({
  id: z.string(),
  description: z.string(),
  testable: z.boolean(),
  test_command: z.string().optional(),
  category: z.enum(['functionality', 'design', 'performance', 'accessibility']),
})

export const acceptanceContractSchema = z.object({
  generated_from_spec: z.string(),
  criteria: z.array(criterionSchema).min(1),
  generated_at: z.string().datetime(),
})

export type AcceptanceContract = z.infer<typeof acceptanceContractSchema>
export type Criterion = z.infer<typeof criterionSchema>
