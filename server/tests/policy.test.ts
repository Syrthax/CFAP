import { describe, it, expect } from 'vitest';
import { computeSignals } from '../src/engine/footprint.js';
import { decide } from '../src/engine/policy.js';
import type { Profile, UserState } from '../src/engine/types.js';

const UK_PROFILE: Profile = { householdSize: 2, region: 'United Kingdom', homeType: 'house' };

const FULL_STATE: UserState = {
  transport: { carType: 'petrol', kmPerWeek: 150, flightsPerYear: { shortHaul: 2, longHaul: 1 }, cyclesRegularly: false },
  diet: { redMeatDaysPerWeek: 5, dairyHeavy: false, vegetarian: false },
  energy: { kwhPerMonth: 400, heating: 'gas' },
};

describe('policy — cyclist skips shift-short-car-trips', () => {
  it('shift-short-car-trips not in ranked recommendations', () => {
    const state: UserState = { ...FULL_STATE, transport: { ...FULL_STATE.transport, cyclesRegularly: true } };
    const signals = computeSignals(UK_PROFILE, state);
    const plan = decide(UK_PROFILE, state, signals);

    expect(plan.recommendations.find(r => r.id === 'shift-short-car-trips')).toBeUndefined();
  });

  it('trace shows shift-short-car-trips as skipped with a cycling reason', () => {
    const state: UserState = { ...FULL_STATE, transport: { ...FULL_STATE.transport, cyclesRegularly: true } };
    const signals = computeSignals(UK_PROFILE, state);
    const plan = decide(UK_PROFILE, state, signals);

    const step = plan.trace.find(t => t.ruleId === 'shift-short-car-trips');
    expect(step).toBeDefined();
    expect(step?.fired).toBe(false);
    expect(step?.reason.toLowerCase()).toContain('cycle');
  });
});

describe('policy — vegetarian produces no diet recommendations', () => {
  it('no recommendations with category=diet when vegetarian=true', () => {
    const state: UserState = { ...FULL_STATE, diet: { redMeatDaysPerWeek: 0, dairyHeavy: false, vegetarian: true } };
    const signals = computeSignals(UK_PROFILE, state);
    const plan = decide(UK_PROFILE, state, signals);

    const dietRecs = plan.recommendations.filter(r => r.category === 'diet');
    expect(dietRecs).toHaveLength(0);
  });

  it('reduce-red-meat trace step is skipped with vegetarian reason', () => {
    const state: UserState = { ...FULL_STATE, diet: { redMeatDaysPerWeek: 7, dairyHeavy: false, vegetarian: true } };
    const signals = computeSignals(UK_PROFILE, state);
    const plan = decide(UK_PROFILE, state, signals);

    const step = plan.trace.find(t => t.ruleId === 'reduce-red-meat');
    expect(step?.fired).toBe(false);
    expect(step?.reason.toLowerCase()).toContain('vegetarian');
  });
});

describe('policy — top category receives 1.5× weight', () => {
  it('transport rule score = round(saving / effort × 1.5) when transport is topCategory', () => {
    // 2 long-haul flights dominates, making transport topCategory
    const profile: Profile = { householdSize: 1, region: 'United Kingdom', homeType: 'apartment' };
    const state: UserState = {
      transport: { carType: 'petrol', kmPerWeek: 50, flightsPerYear: { shortHaul: 0, longHaul: 2 }, cyclesRegularly: false },
      diet: { redMeatDaysPerWeek: 3, dairyHeavy: false, vegetarian: false },
      energy: { kwhPerMonth: 100, heating: 'electric' },
    };
    const signals = computeSignals(profile, state);
    expect(signals.topCategory).toBe('transport');

    const plan = decide(profile, state, signals);

    const rec = plan.recommendations.find(r => r.id === 'flag-long-haul');
    expect(rec).toBeDefined();
    // flag-long-haul: 2 × 1640 saving, effort 3, category=transport=topCategory → 1.5×
    const expectedScore = Math.round((2 * 1640 / 3) * 1.5);
    expect(rec?.score).toBe(expectedScore);
  });

  it('non-topCategory rule score uses flat 1× weight', () => {
    const profile: Profile = { householdSize: 1, region: 'United Kingdom', homeType: 'apartment' };
    const state: UserState = {
      transport: { carType: 'petrol', kmPerWeek: 50, flightsPerYear: { shortHaul: 0, longHaul: 2 }, cyclesRegularly: false },
      diet: { redMeatDaysPerWeek: 3, dairyHeavy: false, vegetarian: false },
      energy: { kwhPerMonth: 100, heating: 'electric' },
    };
    const signals = computeSignals(profile, state);
    const plan = decide(profile, state, signals);

    const rec = plan.recommendations.find(r => r.id === 'reduce-red-meat');
    expect(rec).toBeDefined();
    // diet ≠ topCategory → no multiplier
    const expectedScore = Math.round(rec!.annualSavingCo2e / 2 * 1.0);
    expect(rec?.score).toBe(expectedScore);
  });
});

describe('policy — projectedTotalCo2e', () => {
  it('equals totalAnnualCo2e minus top-3 savings', () => {
    const signals = computeSignals(UK_PROFILE, FULL_STATE);
    const plan = decide(UK_PROFILE, FULL_STATE, signals);

    const top3Saving = plan.recommendations.slice(0, 3).reduce((s, r) => s + r.annualSavingCo2e, 0);
    expect(plan.projectedTotalCo2e).toBe(Math.max(0, signals.totalAnnualCo2e - top3Saving));
  });

  it('is never negative', () => {
    // Artificially small footprint to trigger the Math.max(0) floor
    const profile: Profile = { householdSize: 1, region: 'United Kingdom', homeType: 'apartment' };
    const state: UserState = {
      transport: { carType: 'none', kmPerWeek: 0, flightsPerYear: { shortHaul: 0, longHaul: 3 }, cyclesRegularly: false },
      diet: { redMeatDaysPerWeek: 0, dairyHeavy: false, vegetarian: true },
      energy: { kwhPerMonth: 10, heating: 'electric' },
    };
    const signals = computeSignals(profile, state);
    const plan = decide(profile, state, signals);
    expect(plan.projectedTotalCo2e).toBeGreaterThanOrEqual(0);
  });
});

describe('policy — never recommends a net-negative action', () => {
  it('skips heat-pump-upgrade on a carbon-intensive grid where it would increase emissions', () => {
    // India grid (0.708 kgCO₂e/kWh) / COP 3 ≈ 0.236 > gas (0.18288) → heat pump is worse
    const profile: Profile = { householdSize: 2, region: 'India', homeType: 'house' };
    const state: UserState = {
      transport: { carType: 'petrol', kmPerWeek: 150, flightsPerYear: { shortHaul: 2, longHaul: 1 }, cyclesRegularly: false },
      diet: { redMeatDaysPerWeek: 4, dairyHeavy: false, vegetarian: false },
      energy: { kwhPerMonth: 300, heating: 'gas' },
    };
    const signals = computeSignals(profile, state);
    const plan = decide(profile, state, signals);

    // Not in recommendations…
    expect(plan.recommendations.find(r => r.id === 'heat-pump-upgrade')).toBeUndefined();
    // …and the trace explains why it was skipped
    const step = plan.trace.find(t => t.ruleId === 'heat-pump-upgrade');
    expect(step?.fired).toBe(false);
    expect(step?.reason).toContain('would not beat gas');

    // No recommendation should ever carry a non-positive saving
    for (const rec of plan.recommendations) {
      expect(rec.annualSavingCo2e).toBeGreaterThan(0);
    }
  });

  it('still fires heat-pump-upgrade on a clean grid where it genuinely saves', () => {
    // UK grid (0.233) / COP 3 ≈ 0.078 < gas (0.18288) → heat pump wins
    const profile: Profile = { householdSize: 2, region: 'United Kingdom', homeType: 'house' };
    const state: UserState = {
      transport: { carType: 'none', kmPerWeek: 0, flightsPerYear: { shortHaul: 0, longHaul: 0 }, cyclesRegularly: false },
      diet: { redMeatDaysPerWeek: 0, dairyHeavy: false, vegetarian: true },
      energy: { kwhPerMonth: 400, heating: 'gas' },
    };
    const signals = computeSignals(profile, state);
    const plan = decide(profile, state, signals);

    const rec = plan.recommendations.find(r => r.id === 'heat-pump-upgrade');
    expect(rec).toBeDefined();
    expect(rec!.annualSavingCo2e).toBeGreaterThan(0);
  });
});
