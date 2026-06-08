export type CarType = 'none' | 'petrol' | 'diesel' | 'hybrid' | 'ev';
export type HomeType = 'apartment' | 'house';
export type HeatingType = 'gas' | 'electric' | 'heatpump' | 'other';
export type Category = 'transport' | 'diet' | 'energy' | 'goods';

export interface Profile {
  householdSize: number;
  region: string;
  homeType: HomeType;
}

export interface Transport {
  carType: CarType;
  kmPerWeek: number;
  flightsPerYear: { shortHaul: number; longHaul: number };
  cyclesRegularly: boolean;
}

export interface Diet {
  redMeatDaysPerWeek: number;
  dairyHeavy: boolean;
  vegetarian: boolean;
}

export interface Energy {
  kwhPerMonth: number;
  heating: HeatingType;
}

export interface UserState {
  transport: Transport;
  diet: Diet;
  energy: Energy;
}

export interface Signals {
  annualCo2eByCategory: Record<Category, number>;
  totalAnnualCo2e: number;
  topCategory: Category;
  vsRegionalAvg: number;
}

export interface Recommendation {
  id: string;
  category: Category;
  title: string;
  annualSavingCo2e: number;
  effort: 1 | 2 | 3;
  score: number;
}

export interface TraceStep {
  ruleId: string;
  reason: string;
  fired: boolean;
}

export interface ActionPlan {
  recommendations: Recommendation[];
  projectedTotalCo2e: number;
  trace: TraceStep[];
}

export interface AdviseRequest {
  profile: Profile;
  state: UserState;
}

export interface AdviseResponse {
  signals: Signals;
  plan: ActionPlan;
}
