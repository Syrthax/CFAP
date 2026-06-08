import { z } from 'zod';

export const ProfileSchema = z.object({
  householdSize: z.number().int().min(1).max(20),
  region: z.string().min(1).max(100),
  homeType: z.enum(['apartment', 'house']),
});

export const TransportSchema = z.object({
  carType: z.enum(['none', 'petrol', 'diesel', 'hybrid', 'ev']),
  kmPerWeek: z.number().min(0).max(5000),
  flightsPerYear: z.object({
    shortHaul: z.number().int().min(0).max(100),
    longHaul: z.number().int().min(0).max(50),
  }),
  cyclesRegularly: z.boolean(),
});

export const DietSchema = z.object({
  redMeatDaysPerWeek: z.number().int().min(0).max(7),
  dairyHeavy: z.boolean(),
  vegetarian: z.boolean(),
});

export const EnergySchema = z.object({
  kwhPerMonth: z.number().min(0).max(10000),
  heating: z.enum(['gas', 'electric', 'heatpump', 'other']),
});

export const AdviseRequestSchema = z.object({
  profile: ProfileSchema,
  state: z.object({
    transport: TransportSchema,
    diet: DietSchema,
    energy: EnergySchema,
  }),
});

export type AdviseRequestInput = z.infer<typeof AdviseRequestSchema>;

// ── /chat ────────────────────────────────────────────────────────────────
const CategoryEnum = z.enum(['transport', 'diet', 'energy', 'goods']);

const SignalsSchema = z.object({
  annualCo2eByCategory: z.object({ transport: z.number(), diet: z.number(), energy: z.number(), goods: z.number() }),
  totalAnnualCo2e: z.number(),
  topCategory: CategoryEnum,
  vsRegionalAvg: z.number(),
});

const ActionPlanSchema = z.object({
  recommendations: z.array(z.object({
    id: z.string(),
    category: CategoryEnum,
    title: z.string(),
    annualSavingCo2e: z.number(),
    effort: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    score: z.number(),
  })),
  projectedTotalCo2e: z.number(),
  trace: z.array(z.object({ ruleId: z.string(), reason: z.string(), fired: z.boolean() })),
});

export const ChatRequestSchema = z.object({
  question: z.string().min(1).max(500).trim(),
  signals: SignalsSchema,
  plan: ActionPlanSchema,
});

export type ChatRequestInput = z.infer<typeof ChatRequestSchema>;

// LLM output must conform to this — repair-or-reject on failure
export const LlmOutputSchema = z.object({ reply: z.string().min(1).max(2000) });
