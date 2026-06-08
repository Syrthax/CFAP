import type { Profile, UserState, Signals, Category, Recommendation, TraceStep } from './types.js';
import {
  CAR_FACTORS,
  FLIGHT_FACTORS,
  GRID_INTENSITY,
  DEFAULT_GRID,
  HEATING_FACTORS,
  DIET_FACTORS,
  GREEN_TARIFF_KG_CO2E_PER_KWH,
  ENERGY_BENCHMARK_KWH_PER_PERSON_PER_MONTH,
  GOODS_FACTORS,
} from './factors.js';

type Fired   = { fired: true;  rec: Omit<Recommendation, 'score'>; traceReason: string };
type Skipped = { fired: false; traceReason: string };
type RuleResult = Fired | Skipped;

interface Rule {
  id: string;
  category: Category;
  effort: 1 | 2 | 3;
  evaluate(profile: Profile, state: UserState, signals: Signals): RuleResult;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const fmt = (kg: number) => `${Math.round(kg)} kg CO₂e`;

export const RULES: Rule[] = [
  // ── Transport ────────────────────────────────────────────────────────────
  {
    id: 'shift-short-car-trips',
    category: 'transport',
    effort: 2,
    evaluate(_p, state, signals) {
      const { carType, kmPerWeek, cyclesRegularly } = state.transport;
      const transportPct = signals.annualCo2eByCategory.transport / signals.totalAnnualCo2e;

      if (cyclesRegularly) {
        return { fired: false, traceReason: 'You already cycle regularly — rule skipped.' };
      }
      if (carType === 'none') {
        return { fired: false, traceReason: 'No car in use — rule skipped.' };
      }
      if (kmPerWeek < 30) {
        return { fired: false, traceReason: `Low weekly mileage (${kmPerWeek} km/wk < 30 threshold) — rule skipped.` };
      }

      const saving = Math.round(kmPerWeek * 52 * 0.30 * (CAR_FACTORS[carType]?.kgCo2ePerKm ?? 0));
      return {
        fired: true,
        traceReason: `Transport is ${pct(transportPct)} of your footprint and you don't cycle yet.`,
        rec: {
          id: 'shift-short-car-trips',
          category: 'transport',
          title: 'Replace short car trips with cycling or walking',
          annualSavingCo2e: saving,
          effort: 2,
        },
      };
    },
  },

  {
    id: 'reduce-short-haul-flights',
    category: 'transport',
    effort: 1,
    evaluate(_p, state) {
      const { shortHaul } = state.transport.flightsPerYear;
      if (shortHaul < 1) {
        return { fired: false, traceReason: 'No short-haul flights — rule skipped.' };
      }
      // Saving: replace all short-haul with equivalent rail (negligible vs flight)
      const flightKgEach = FLIGHT_FACTORS.shortHaul.kgCo2ePerPassengerReturn;
      const saving = Math.round(shortHaul * flightKgEach);
      return {
        fired: true,
        traceReason: `${shortHaul} short-haul flight(s)/yr at ~${fmt(flightKgEach)} each; rail cuts most of that.`,
        rec: {
          id: 'reduce-short-haul-flights',
          category: 'transport',
          title: `Replace short-haul flights with rail where possible (${shortHaul} flight${shortHaul > 1 ? 's' : ''}/yr)`,
          annualSavingCo2e: saving,
          effort: 1,
        },
      };
    },
  },

  {
    id: 'flag-long-haul',
    category: 'transport',
    effort: 3,
    evaluate(_p, state) {
      const { longHaul } = state.transport.flightsPerYear;
      if (longHaul < 1) {
        return { fired: false, traceReason: 'No long-haul flights — rule skipped.' };
      }
      const kgEach = FLIGHT_FACTORS.longHaul.kgCo2ePerPassengerReturn;
      const saving = Math.round(longHaul * kgEach);
      return {
        fired: true,
        traceReason: `${longHaul} long-haul flight(s)/yr at ~${fmt(kgEach)} each — single largest lever.`,
        rec: {
          id: 'flag-long-haul',
          category: 'transport',
          title: `Reduce long-haul flights (${longHaul}/yr) — your single biggest lever`,
          annualSavingCo2e: saving,
          effort: 3,
        },
      };
    },
  },

  {
    id: 'switch-to-ev',
    category: 'transport',
    effort: 3,
    evaluate(_p, state) {
      const { carType, kmPerWeek } = state.transport;
      if (carType !== 'petrol' && carType !== 'diesel') {
        return { fired: false, traceReason: 'Car is not petrol/diesel — EV switch rule skipped.' };
      }
      if (kmPerWeek < 100) {
        return { fired: false, traceReason: `Weekly mileage (${kmPerWeek} km) below threshold for EV switch to be cost-effective — rule skipped.` };
      }
      const delta = (CAR_FACTORS[carType].kgCo2ePerKm - CAR_FACTORS.ev.kgCo2ePerKm);
      const saving = Math.round(kmPerWeek * 52 * delta);
      return {
        fired: true,
        traceReason: `High-mileage ${carType} car (${kmPerWeek} km/wk); EV saves ${fmt(delta * kmPerWeek * 52)}/yr.`,
        rec: {
          id: 'switch-to-ev',
          category: 'transport',
          title: 'Switch to an electric vehicle',
          annualSavingCo2e: saving,
          effort: 3,
        },
      };
    },
  },

  // ── Diet ─────────────────────────────────────────────────────────────────
  {
    id: 'reduce-red-meat',
    category: 'diet',
    effort: 2,
    evaluate(_p, state) {
      const { redMeatDaysPerWeek, vegetarian } = state.diet;
      if (vegetarian) {
        return { fired: false, traceReason: 'Vegetarian diet — red meat rule skipped.' };
      }
      if (redMeatDaysPerWeek < 3) {
        return { fired: false, traceReason: `Red meat ${redMeatDaysPerWeek}×/wk (below 3-day trigger) — rule skipped.` };
      }
      const targetDays = 1;
      const reducedDays = redMeatDaysPerWeek - targetDays;
      const saving = Math.round(
        reducedDays * (DIET_FACTORS.redMeatDay.kgCo2ePerDay - DIET_FACTORS.vegDay.kgCo2ePerDay) * 52,
      );
      return {
        fired: true,
        traceReason: `Red meat ${redMeatDaysPerWeek}×/wk is a large, low-effort lever (each meat day ≈ ${fmt(DIET_FACTORS.redMeatDay.kgCo2ePerDay)} vs ${fmt(DIET_FACTORS.vegDay.kgCo2ePerDay)} veg).`,
        rec: {
          id: 'reduce-red-meat',
          category: 'diet',
          title: `Cut red meat from ${redMeatDaysPerWeek} to 1 day per week`,
          annualSavingCo2e: saving,
          effort: 2,
        },
      };
    },
  },

  {
    id: 'reduce-dairy',
    category: 'diet',
    effort: 2,
    evaluate(_p, state) {
      if (!state.diet.dairyHeavy) {
        return { fired: false, traceReason: 'Dairy not marked as heavy — rule skipped.' };
      }
      const saving = DIET_FACTORS.dairyHeavyAddonPerYear.kgCo2e;
      return {
        fired: true,
        traceReason: 'Heavy dairy consumption adds ~182 kg CO₂e/yr (Poore & Nemecek 2018).',
        rec: {
          id: 'reduce-dairy',
          category: 'diet',
          title: 'Reduce heavy dairy — swap some dairy for plant-based alternatives',
          annualSavingCo2e: saving,
          effort: 2,
        },
      };
    },
  },

  // ── Energy ───────────────────────────────────────────────────────────────
  {
    id: 'efficiency-behavioral',
    category: 'energy',
    effort: 1,
    evaluate(profile, state) {
      const { kwhPerMonth, heating } = state.energy;
      const benchmark = ENERGY_BENCHMARK_KWH_PER_PERSON_PER_MONTH * profile.householdSize;
      if (kwhPerMonth <= benchmark) {
        return { fired: false, traceReason: `Energy use (${kwhPerMonth} kWh/mo) at or below benchmark (${benchmark} kWh/mo for ${profile.householdSize} people) — rule skipped.` };
      }

      const grid = GRID_INTENSITY[profile.region] ?? DEFAULT_GRID;
      const factor = heating === 'electric' || heating === 'heatpump'
        ? grid.kgCo2ePerKwh
        : HEATING_FACTORS['gas'].kgCo2ePerKwh;
      const saving = Math.round(kwhPerMonth * 12 * 0.12 * factor);
      return {
        fired: true,
        traceReason: `Energy use (${kwhPerMonth} kWh/mo) above benchmark of ${benchmark} kWh/mo for ${profile.householdSize} people. A 12% reduction saves ~${fmt(saving)}.`,
        rec: {
          id: 'efficiency-behavioral',
          category: 'energy',
          title: 'Lower thermostat by 1°C and switch to LED lighting',
          annualSavingCo2e: saving,
          effort: 1,
        },
      };
    },
  },

  {
    id: 'heat-pump-upgrade',
    category: 'energy',
    effort: 3,
    evaluate(profile, state) {
      if (state.energy.heating !== 'gas') {
        return { fired: false, traceReason: 'Heating is not gas — heat pump rule skipped.' };
      }
      const { kwhPerMonth } = state.energy;
      const grid = GRID_INTENSITY[profile.region] ?? DEFAULT_GRID;
      const gasFactor = HEATING_FACTORS.gas.kgCo2ePerKwh;
      const hpFactor  = grid.kgCo2ePerKwh / HEATING_FACTORS.heatpump.cop;
      const saving = Math.round(kwhPerMonth * 12 * (gasFactor - hpFactor));
      return {
        fired: true,
        traceReason: `Gas heating at ${gasFactor} kgCO₂e/kWh vs heat pump at ${hpFactor.toFixed(4)} kgCO₂e/kWh — saves ${fmt(saving)}/yr.`,
        rec: {
          id: 'heat-pump-upgrade',
          category: 'energy',
          title: 'Upgrade from gas boiler to a heat pump',
          annualSavingCo2e: saving,
          effort: 3,
        },
      };
    },
  },

  {
    id: 'green-tariff',
    category: 'energy',
    effort: 1,
    evaluate(profile, state) {
      if (state.energy.heating !== 'electric') {
        return { fired: false, traceReason: 'Not on electric heating — green tariff rule skipped.' };
      }
      const grid = GRID_INTENSITY[profile.region] ?? DEFAULT_GRID;
      if (!grid.dirty) {
        return { fired: false, traceReason: `Grid in ${profile.region} is not classified as dirty (${grid.kgCo2ePerKwh} kgCO₂e/kWh) — green tariff rule skipped.` };
      }
      const { kwhPerMonth } = state.energy;
      const saving = Math.round(kwhPerMonth * 12 * (grid.kgCo2ePerKwh - GREEN_TARIFF_KG_CO2E_PER_KWH));
      return {
        fired: true,
        traceReason: `Dirty grid (${grid.kgCo2ePerKwh} kgCO₂e/kWh in ${profile.region}); green tariff reduces effective intensity to ~0.05 kgCO₂e/kWh.`,
        rec: {
          id: 'green-tariff',
          category: 'energy',
          title: 'Switch to a certified 100% renewable electricity tariff',
          annualSavingCo2e: saving,
          effort: 1,
        },
      };
    },
  },

  // ── Goods ─────────────────────────────────────────────────────────────────
  {
    id: 'reduce-consumption',
    category: 'goods',
    effort: 2,
    evaluate(profile, _state, signals) {
      if (signals.topCategory !== 'goods') {
        return { fired: false, traceReason: `Goods (${Math.round(signals.annualCo2eByCategory.goods)} kg) is not your top category — rule skipped.` };
      }
      const baseline = GOODS_FACTORS[profile.homeType]?.kgCo2ePerPersonPerYear
        ?? GOODS_FACTORS.house.kgCo2ePerPersonPerYear;
      const saving = Math.round(baseline * profile.householdSize * 0.12);
      return {
        fired: true,
        traceReason: 'Goods & consumption is your largest category — buying secondhand and avoiding fast fashion is a high-impact lever.',
        rec: {
          id: 'reduce-consumption',
          category: 'goods',
          title: 'Reduce new purchases — buy secondhand, repair, and avoid fast fashion',
          annualSavingCo2e: saving,
          effort: 2,
        },
      };
    },
  },
];

export function evaluateRules(
  profile: Profile,
  state: UserState,
  signals: Signals,
): { recommendations: Recommendation[]; trace: TraceStep[] } {
  const recommendations: Recommendation[] = [];
  const trace: TraceStep[] = [];

  for (const rule of RULES) {
    const result = rule.evaluate(profile, state, signals);
    if (result.fired) {
      const categoryWeight = rule.category === signals.topCategory ? 1.5 : 1;
      const score = (result.rec.annualSavingCo2e / rule.effort) * categoryWeight;
      recommendations.push({ ...result.rec, score: Math.round(score) });
      trace.push({ ruleId: rule.id, reason: result.traceReason, fired: true });
    } else {
      trace.push({ ruleId: rule.id, reason: result.traceReason, fired: false });
    }
  }

  recommendations.sort((a, b) => b.score - a.score);
  return { recommendations, trace };
}
