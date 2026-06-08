import type { Profile, UserState, Signals, ActionPlan } from './types.js';
import { evaluateRules } from './rules.js';

export function decide(profile: Profile, state: UserState, signals: Signals): ActionPlan {
  const { recommendations, trace } = evaluateRules(profile, state, signals);

  const top3Saving = recommendations
    .slice(0, 3)
    .reduce((sum, r) => sum + r.annualSavingCo2e, 0);

  const projectedTotalCo2e = Math.max(0, signals.totalAnnualCo2e - top3Saving);

  return { recommendations, projectedTotalCo2e, trace };
}
