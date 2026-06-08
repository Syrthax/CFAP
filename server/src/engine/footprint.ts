import type { Profile, UserState, Signals, Category } from './types.js';
import {
  CAR_FACTORS,
  FLIGHT_FACTORS,
  GRID_INTENSITY,
  DEFAULT_GRID,
  HEATING_FACTORS,
  DIET_FACTORS,
  GOODS_FACTORS,
  REGIONAL_AVERAGES,
} from './factors.js';

function computeTransport(state: UserState['transport']): number {
  const { carType, kmPerWeek, flightsPerYear } = state;
  const carFactor = CAR_FACTORS[carType]?.kgCo2ePerKm ?? 0;
  const carAnnual = kmPerWeek * 52 * carFactor;
  const shortHaulAnnual = flightsPerYear.shortHaul * FLIGHT_FACTORS.shortHaul.kgCo2ePerPassengerReturn;
  const longHaulAnnual  = flightsPerYear.longHaul  * FLIGHT_FACTORS.longHaul.kgCo2ePerPassengerReturn;
  return carAnnual + shortHaulAnnual + longHaulAnnual;
}

function computeDiet(diet: UserState['diet']): number {
  const { redMeatDaysPerWeek, dairyHeavy, vegetarian } = diet;
  // If vegetarian, all 7 days are veg days regardless of redMeatDaysPerWeek
  const meatDays = vegetarian ? 0 : redMeatDaysPerWeek;
  const vegDays  = 7 - meatDays;
  const weeklyKg =
    meatDays * DIET_FACTORS.redMeatDay.kgCo2ePerDay +
    vegDays  * DIET_FACTORS.vegDay.kgCo2ePerDay;
  const dairyAddon = dairyHeavy ? DIET_FACTORS.dairyHeavyAddonPerYear.kgCo2e : 0;
  return weeklyKg * 52 + dairyAddon;
}

function computeEnergy(energy: UserState['energy'], region: string): number {
  const { kwhPerMonth, heating } = energy;
  const grid = GRID_INTENSITY[region] ?? DEFAULT_GRID;
  let factor: number;

  if (heating === 'electric') {
    factor = grid.kgCo2ePerKwh;
  } else if (heating === 'heatpump') {
    factor = grid.kgCo2ePerKwh / HEATING_FACTORS.heatpump.cop;
  } else {
    factor = HEATING_FACTORS[heating as 'gas' | 'other'].kgCo2ePerKwh;
  }

  return kwhPerMonth * 12 * factor;
}

function computeGoods(profile: Profile): number {
  const perPerson = GOODS_FACTORS[profile.homeType]?.kgCo2ePerPersonPerYear
    ?? GOODS_FACTORS.house.kgCo2ePerPersonPerYear;
  return profile.householdSize * perPerson;
}

function topCategory(cats: Record<Category, number>): Category {
  return (Object.entries(cats) as [Category, number][])
    .reduce((best, [cat, kg]) => (kg > cats[best] ? cat : best), 'transport' as Category);
}

export function computeSignals(profile: Profile, state: UserState): Signals {
  const transport = computeTransport(state.transport);
  const diet      = computeDiet(state.diet);
  const energy    = computeEnergy(state.energy, profile.region);
  const goods     = computeGoods(profile);

  const annualCo2eByCategory = { transport, diet, energy, goods } as Record<Category, number>;
  const totalAnnualCo2e = transport + diet + energy + goods;
  const top = topCategory(annualCo2eByCategory);

  const regionAvgPerPerson =
    (REGIONAL_AVERAGES[profile.region] ?? REGIONAL_AVERAGES['Other']).kgCo2ePerPersonPerYear;
  const regionalTotal = regionAvgPerPerson * profile.householdSize;
  const vsRegionalAvg = totalAnnualCo2e / regionalTotal;

  return { annualCo2eByCategory, totalAnnualCo2e, topCategory: top, vsRegionalAvg };
}
