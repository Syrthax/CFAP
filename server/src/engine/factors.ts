type Factor = { source: string; year: number };

// ── Transport ──────────────────────────────────────────────────────────────
// DEFRA Greenhouse Gas Conversion Factors 2024, Table 3a (passenger vehicles)
export const CAR_KG_CO2E_PER_KM: Record<string, number & Factor> = {} as never;

export const CAR_FACTORS: Record<string, { kgCo2ePerKm: number } & Factor> = {
  petrol: { kgCo2ePerKm: 0.1727, source: 'DEFRA 2024', year: 2024 },
  diesel: { kgCo2ePerKm: 0.1632, source: 'DEFRA 2024', year: 2024 },
  hybrid: { kgCo2ePerKm: 0.1063, source: 'DEFRA 2024', year: 2024 },
  ev:     { kgCo2ePerKm: 0.0533, source: 'DEFRA 2024', year: 2024 },
  none:   { kgCo2ePerKm: 0,      source: 'N/A',        year: 2024 },
};

// DEFRA 2024, Table 7a (air travel, economy class, without RFI uplift).
// Per-journey figures use representative distances:
//   short haul return ≈ 1629 pkm  →  0.15694 × 1629 ≈ 255 kg CO₂e
//   long  haul return ≈ 8400 pkm  →  0.19525 × 8400 ≈ 1640 kg CO₂e
export const FLIGHT_FACTORS = {
  shortHaul: {
    kgCo2ePerPassengerReturn: 255,
    kgCo2ePerPkm: 0.15694,
    source: 'DEFRA 2024',
    year: 2024,
  },
  longHaul: {
    kgCo2ePerPassengerReturn: 1640,
    kgCo2ePerPkm: 0.19525,
    source: 'DEFRA 2024',
    year: 2024,
  },
  // National rail — used to compute saving when replacing a short-haul flight
  rail: { kgCo2ePerPkm: 0.00596, source: 'DEFRA 2024', year: 2024 },
};

// ── Grid electricity (kgCO₂e / kWh) ──────────────────────────────────────
// UK: DEFRA 2024 Table 1 (grid average).
// US: EPA eGRID 2023 national average.
// Others: IEA World Energy Outlook 2023 / regional grid operators.
export const GRID_INTENSITY: Record<string, { kgCo2ePerKwh: number; dirty: boolean } & Factor> = {
  'United Kingdom': { kgCo2ePerKwh: 0.23314, dirty: false, source: 'DEFRA 2024',              year: 2024 },
  'United States':  { kgCo2ePerKwh: 0.38600, dirty: false, source: 'EPA eGRID 2023',           year: 2023 },
  'European Union': { kgCo2ePerKwh: 0.27600, dirty: false, source: 'EEA 2023',                 year: 2023 },
  'Australia':      { kgCo2ePerKwh: 0.51000, dirty: true,  source: 'DCCEEW 2023',              year: 2023 },
  'Canada':         { kgCo2ePerKwh: 0.13000, dirty: false, source: 'Environment Canada 2023',  year: 2023 },
  'India':          { kgCo2ePerKwh: 0.70800, dirty: true,  source: 'CEA India 2023',           year: 2023 },
  'Other':          { kgCo2ePerKwh: 0.35000, dirty: false, source: 'IEA world average 2023',   year: 2023 },
};

export const DEFAULT_GRID = GRID_INTENSITY['Other'];

// ── Heating (kgCO₂e / kWh of delivered energy) ───────────────────────────
// Gas and "other" from DEFRA 2024 Table 1 (natural gas, gross calorific value).
// Heat pump treated as electric / COP; COP = 3.0 is conservative UK average.
export const HEATING_FACTORS = {
  gas:       { kgCo2ePerKwh: 0.18288, source: 'DEFRA 2024', year: 2024 },
  other:     { kgCo2ePerKwh: 0.18288, source: 'DEFRA 2024 (gas proxy)', year: 2024 },
  electric:  { usesGridIntensity: true as const, source: 'DEFRA 2024', year: 2024 },
  heatpump:  { usesGridIntensity: true as const, cop: 3.0, source: 'DEFRA 2024', year: 2024 },
};

// Effective emissions intensity of a green-tariff electricity contract
export const GREEN_TARIFF_KG_CO2E_PER_KWH = 0.05;

// ── Diet ──────────────────────────────────────────────────────────────────
// Poore & Nemecek 2018 (Science 360:987-992).
// Per-day figures derived from per-kg food supply chain values:
//   beef ~27 kgCO₂e/kg, ~250 g/day serving → ~6.75 kg; add cookery/waste → 6.85
//   vegetarian day (grains, legumes, veg): ~1.52 kgCO₂e
export const DIET_FACTORS = {
  redMeatDay:            { kgCo2ePerDay: 6.85, source: 'Poore & Nemecek 2018', year: 2018 },
  vegDay:                { kgCo2ePerDay: 1.52, source: 'Poore & Nemecek 2018', year: 2018 },
  dairyHeavyAddonPerYear: { kgCo2e: 182,       source: 'Poore & Nemecek 2018', year: 2018 },
};

// ── Goods / consumption ───────────────────────────────────────────────────
// DEFRA 2024 household consumption estimates, per person per year.
export const GOODS_FACTORS = {
  house:     { kgCo2ePerPersonPerYear: 870, source: 'DEFRA 2024', year: 2024 },
  apartment: { kgCo2ePerPersonPerYear: 720, source: 'DEFRA 2024', year: 2024 },
};

// ── Regional averages (per person per year) ──────────────────────────────
export const REGIONAL_AVERAGES: Record<string, { kgCo2ePerPersonPerYear: number } & Factor> = {
  'United Kingdom': { kgCo2ePerPersonPerYear:  8500, source: 'ONS/DEFRA 2023',           year: 2023 },
  'United States':  { kgCo2ePerPersonPerYear: 14000, source: 'EPA 2023',                  year: 2023 },
  'European Union': { kgCo2ePerPersonPerYear:  7000, source: 'EEA 2023',                  year: 2023 },
  'Australia':      { kgCo2ePerPersonPerYear: 15000, source: 'DCCEEW 2023',               year: 2023 },
  'Canada':         { kgCo2ePerPersonPerYear: 13000, source: 'Environment Canada 2023',   year: 2023 },
  'India':          { kgCo2ePerPersonPerYear:  2000, source: 'TERI 2023',                 year: 2023 },
  'Other':          { kgCo2ePerPersonPerYear:  8000, source: 'IEA world average 2023',    year: 2023 },
};

// ── Energy benchmark ─────────────────────────────────────────────────────
// kWh/month per person — used to flag above-average energy use
export const ENERGY_BENCHMARK_KWH_PER_PERSON_PER_MONTH = 150;
