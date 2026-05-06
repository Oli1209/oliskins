import { z } from "zod";

const RARITIES = [
  "consumer",
  "industrial",
  "mil_spec",
  "restricted",
  "classified",
  "covert",
  "extraordinary",
] as const;

export const DropV1Schema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  rarity: z.enum(RARITIES),
  valueCents: z.number().int().nonnegative(),
  weight: z.number().positive(),
  image: z.string(),
  /** undefined treated as true (opt-out model) */
  boostEligible: z.boolean().optional(),
});

export const CaseV1Schema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  priceCents: z.number().int().nonnegative(),
  image: z.string(),
  requiredLevel: z.number().int().positive().optional(),
  modeAvailability: z
    .object({
      boostEnabled: z.boolean(),
      jesterEnabled: z.boolean(),
    })
    .optional(),
  modePricing: z
    .object({
      boostMult: z.number().positive(),
      jesterMult: z.number().positive(),
      boostWeightMult: z.number().positive(),
    })
    .optional(),
  drops: z.array(DropV1Schema).min(1),
});

export const DatasetV1Schema = z.object({
  schemaVersion: z.literal(1),
  currency: z.literal("$"),
  generatedAt: z.string().datetime(),
  paidCases: z.array(CaseV1Schema),
  freeCases: z.array(CaseV1Schema).optional(),
});

export type DropV1 = z.infer<typeof DropV1Schema>;
export type CaseV1 = z.infer<typeof CaseV1Schema>;
export type DatasetV1 = z.infer<typeof DatasetV1Schema>;
