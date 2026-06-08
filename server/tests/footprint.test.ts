import { describe, it, expect } from 'vitest';
import { computeSignals } from '../src/engine/footprint.js';
import { CAR_FACTORS, FLIGHT_FACTORS, DIET_FACTORS, HEATING_FACTORS, GOODS_FACTORS } from '../src/engine/factors.js';
import type { Profile, UserState } from '../src/engine/types.js';

const UK_PROFILE: Profile = { householdSize: 2, region: 'United Kingdom', homeType: 'house' };

const BASE_STATE: UserState = {
  transport: { carType: 'petrol', kmPerWeek: 100, flightsPerYear: { shortHaul: 0, longHaul: 0 }, cyclesRegularly: false },
  diet: { redMeatDaysPerWeek: 5, dairyHeavy: false, vegetarian: false },
  energy: { kwhPerMonth: 300, heating: 'gas' },
};

describe('footprint — known input produces expected total', () => {
  it('total is within ±10 kg of hand-calculated value', () => {
    const s = computeSignals(UK_PROFILE, BASE_STATE);
    // 100×52×0.1727 + (5×6.85+2×1.52)×52 + 300×12×0.18288 + 2×870
    const expected = 898.04 + 1939.08 + 658.368 + 1740; // 5235.488
    expect(s.totalAnnualCo2e).toBeCloseTo(expected, 0); // within 0.5 kg
  });
});

describe('footprint — each category independently', () => {
  it('transport only: petrol car 200 km/wk, no flights', () => {
    const state: UserState = {
      ...BASE_STATE,
      transport: { carType: 'petrol', kmPerWeek: 200, flightsPerYear: { shortHaul: 0, longHaul: 0 }, cyclesRegularly: false },
      diet: { redMeatDaysPerWeek: 0, dairyHeavy: false, vegetarian: true },
    };
    const s = computeSignals({ ...UK_PROFILE, householdSize: 1, homeType: 'apartment' }, state);
    const expectedCar = 200 * 52 * CAR_FACTORS.petrol.kgCo2ePerKm;
    expect(s.annualCo2eByCategory.transport).toBeCloseTo(expectedCar, 0);
  });

  it('flights add correctly on top of car emissions', () => {
    const state: UserState = {
      ...BASE_STATE,
      transport: { carType: 'none', kmPerWeek: 0, flightsPerYear: { shortHaul: 2, longHaul: 1 }, cyclesRegularly: false },
      diet: { redMeatDaysPerWeek: 0, dairyHeavy: false, vegetarian: true },
    };
    const s = computeSignals(UK_PROFILE, state);
    const expected = 2 * FLIGHT_FACTORS.shortHaul.kgCo2ePerPassengerReturn
      + 1 * FLIGHT_FACTORS.longHaul.kgCo2ePerPassengerReturn;
    expect(s.annualCo2eByCategory.transport).toBeCloseTo(expected, 0);
  });

  it('diet: red meat days scale correctly', () => {
    const state: UserState = {
      ...BASE_STATE,
      transport: { carType: 'none', kmPerWeek: 0, flightsPerYear: { shortHaul: 0, longHaul: 0 }, cyclesRegularly: false },
    };
    const s = computeSignals(UK_PROFILE, state);
    const expected = (5 * DIET_FACTORS.redMeatDay.kgCo2ePerDay + 2 * DIET_FACTORS.vegDay.kgCo2ePerDay) * 52;
    expect(s.annualCo2eByCategory.diet).toBeCloseTo(expected, 0);
  });

  it('energy: gas heating at known kWh', () => {
    const state: UserState = {
      ...BASE_STATE,
      transport: { carType: 'none', kmPerWeek: 0, flightsPerYear: { shortHaul: 0, longHaul: 0 }, cyclesRegularly: false },
      diet: { redMeatDaysPerWeek: 0, dairyHeavy: false, vegetarian: true },
    };
    const s = computeSignals(UK_PROFILE, state);
    const expected = 300 * 12 * HEATING_FACTORS.gas.kgCo2ePerKwh;
    expect(s.annualCo2eByCategory.energy).toBeCloseTo(expected, 0);
  });

  it('goods: scales with household size and home type', () => {
    const profile: Profile = { householdSize: 3, region: 'United Kingdom', homeType: 'apartment' };
    const state: UserState = {
      transport: { carType: 'none', kmPerWeek: 0, flightsPerYear: { shortHaul: 0, longHaul: 0 }, cyclesRegularly: false },
      diet: { redMeatDaysPerWeek: 0, dairyHeavy: false, vegetarian: true },
      energy: { kwhPerMonth: 0, heating: 'electric' },
    };
    const s = computeSignals(profile, state);
    const expected = 3 * GOODS_FACTORS.apartment.kgCo2ePerPersonPerYear;
    expect(s.annualCo2eByCategory.goods).toBeCloseTo(expected, 0);
  });
});

describe('footprint — carType none zeroes car term', () => {
  it('carType none with high kmPerWeek still produces zero car emissions', () => {
    const state: UserState = {
      ...BASE_STATE,
      transport: { carType: 'none', kmPerWeek: 500, flightsPerYear: { shortHaul: 0, longHaul: 0 }, cyclesRegularly: false },
      diet: { redMeatDaysPerWeek: 0, dairyHeavy: false, vegetarian: true },
    };
    const s = computeSignals(UK_PROFILE, state);
    expect(s.annualCo2eByCategory.transport).toBe(0);
  });
});

describe('footprint — vegetarian zeroes red meat term', () => {
  it('vegetarian=true forces all diet days to veg regardless of redMeatDaysPerWeek', () => {
    const stateVeg: UserState = {
      ...BASE_STATE,
      transport: { carType: 'none', kmPerWeek: 0, flightsPerYear: { shortHaul: 0, longHaul: 0 }, cyclesRegularly: false },
      diet: { redMeatDaysPerWeek: 7, dairyHeavy: false, vegetarian: true },
    };
    const stateOmni: UserState = {
      ...stateVeg,
      diet: { redMeatDaysPerWeek: 0, dairyHeavy: false, vegetarian: false },
    };
    const sVeg  = computeSignals(UK_PROFILE, stateVeg);
    const sOmni = computeSignals(UK_PROFILE, stateOmni);
    // Both should produce the same diet (all veg days)
    expect(sVeg.annualCo2eByCategory.diet).toBeCloseTo(sOmni.annualCo2eByCategory.diet, 0);
  });
});
