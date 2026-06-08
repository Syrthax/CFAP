import { describe, it, expect } from 'vitest';
import { AdviseRequestSchema } from '../src/engine/validate.js';

const VALID_BODY = {
  profile: { householdSize: 2, region: 'United Kingdom', homeType: 'house' },
  state: {
    transport: { carType: 'petrol', kmPerWeek: 150, flightsPerYear: { shortHaul: 2, longHaul: 1 }, cyclesRegularly: false },
    diet: { redMeatDaysPerWeek: 4, dairyHeavy: false, vegetarian: false },
    energy: { kwhPerMonth: 300, heating: 'gas' },
  },
};

describe('validate — valid body passes', () => {
  it('accepts a fully valid request body', () => {
    const result = AdviseRequestSchema.safeParse(VALID_BODY);
    expect(result.success).toBe(true);
  });
});

describe('validate — malformed body rejected', () => {
  it('rejects missing profile', () => {
    const body = { state: VALID_BODY.state };
    expect(AdviseRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects missing state', () => {
    const body = { profile: VALID_BODY.profile };
    expect(AdviseRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects wrong homeType', () => {
    const body = { ...VALID_BODY, profile: { ...VALID_BODY.profile, homeType: 'mansion' } };
    expect(AdviseRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects wrong carType', () => {
    const body = {
      ...VALID_BODY,
      state: { ...VALID_BODY.state, transport: { ...VALID_BODY.state.transport, carType: 'hydrogen' } },
    };
    expect(AdviseRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects wrong heating type', () => {
    const body = {
      ...VALID_BODY,
      state: { ...VALID_BODY.state, energy: { ...VALID_BODY.state.energy, heating: 'wood' } },
    };
    expect(AdviseRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects non-numeric householdSize', () => {
    const body = { ...VALID_BODY, profile: { ...VALID_BODY.profile, householdSize: 'two' } };
    expect(AdviseRequestSchema.safeParse(body).success).toBe(false);
  });
});

describe('validate — out-of-range values rejected', () => {
  it('rejects redMeatDaysPerWeek=9 (max is 7)', () => {
    const body = {
      ...VALID_BODY,
      state: { ...VALID_BODY.state, diet: { ...VALID_BODY.state.diet, redMeatDaysPerWeek: 9 } },
    };
    expect(AdviseRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects negative kmPerWeek', () => {
    const body = {
      ...VALID_BODY,
      state: { ...VALID_BODY.state, transport: { ...VALID_BODY.state.transport, kmPerWeek: -10 } },
    };
    expect(AdviseRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects householdSize=0', () => {
    const body = { ...VALID_BODY, profile: { ...VALID_BODY.profile, householdSize: 0 } };
    expect(AdviseRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects householdSize=25 (max is 20)', () => {
    const body = { ...VALID_BODY, profile: { ...VALID_BODY.profile, householdSize: 25 } };
    expect(AdviseRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects kwhPerMonth=15000 (max is 10000)', () => {
    const body = {
      ...VALID_BODY,
      state: { ...VALID_BODY.state, energy: { ...VALID_BODY.state.energy, kwhPerMonth: 15000 } },
    };
    expect(AdviseRequestSchema.safeParse(body).success).toBe(false);
  });
});
