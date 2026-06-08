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
