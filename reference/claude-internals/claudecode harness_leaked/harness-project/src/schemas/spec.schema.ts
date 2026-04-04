import { z } from 'zod'

export const featureSchema = z.object({
  name: z.string(),
  description: z.string(),
  acceptance_criteria: z.array(z.string()),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
})

export const designLanguageSchema = z.object({
  color_palette: z.array(z.string()),
  typography: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  layout_principles: z.array(z.string()),
  anti_patterns: z.array(z.string()),
})

export const techArchitectureSchema = z.object({
  frontend: z.object({
    framework: z.string(),
    bundler: z.string(),
    styling: z.string(),
  }),
  backend: z.object({
    framework: z.string(),
    language: z.string(),
  }),
  database: z.object({
    engine: z.string(),
    orm: z.string(),
  }),
})

export const aiIntegrationSchema = z.object({
  feature_name: z.string(),
  capability: z.string(),
  tools: z.array(z.string()),
  app_apis: z.array(z.string()),
  fallback_behavior: z.string(),
})

export const productSpecSchema = z.object({
  overview: z.string(),
  features: z.array(featureSchema).min(1),
  design_language: designLanguageSchema,
  tech_architecture: techArchitectureSchema,
  ai_integrations: z.array(aiIntegrationSchema),
  acceptance_criteria: z.array(z.string()),
})

export type ProductSpec = z.infer<typeof productSpecSchema>
export type Feature = z.infer<typeof featureSchema>
export type DesignLanguage = z.infer<typeof designLanguageSchema>
export type TechArchitecture = z.infer<typeof techArchitectureSchema>
export type AIIntegration = z.infer<typeof aiIntegrationSchema>
