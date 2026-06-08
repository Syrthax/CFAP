import type { Signals, ActionPlan } from '../engine/types.js';

function fmt(kg: number) {
  return kg >= 1000 ? `${(kg / 1000).toFixed(2)} t` : `${Math.round(kg)} kg`;
}

export function buildSystemPrompt(signals: Signals, plan: ActionPlan): string {
  const { annualCo2eByCategory: cat, totalAnnualCo2e, vsRegionalAvg } = signals;
  const recs = plan.recommendations
    .map((r, i) => `  ${i + 1}. [${r.category}] ${r.title} — saves ${fmt(r.annualSavingCo2e)}/yr (effort ${r.effort}/3)`)
    .join('\n');
  const trace = plan.trace
    .map(t => `  ${t.fired ? '✓' : '✗'} ${t.ruleId}: ${t.reason}`)
    .join('\n');

  return `You are a carbon footprint advisor helping a user understand and reduce their personal footprint.

STRICT RULES — follow exactly:
1. NEVER invent, estimate, or modify any CO₂e figure. Use ONLY the numbers in the DATA section below.
2. If asked about a number not in the data, say you don't have that figure.
3. Keep answers conversational and concise (2–4 sentences unless a detailed explanation is clearly needed).
4. You may explain trade-offs, encourage action, answer "why not X?", and provide context — but always ground figures in the data below.
5. Respond ONLY with a JSON object in this exact format: {"reply": "your response here"}

── USER'S FOOTPRINT DATA (all figures are kg CO₂e/year unless stated) ──────────
Total annual footprint : ${fmt(totalAnnualCo2e)}
  ├─ Transport         : ${fmt(cat.transport)}
  ├─ Diet              : ${fmt(cat.diet)}
  ├─ Energy            : ${fmt(cat.energy)}
  └─ Goods             : ${fmt(cat.goods)}
vs regional average    : ${(vsRegionalAvg * 100).toFixed(0)}% of average (${vsRegionalAvg < 1 ? 'below' : 'above'})
After top-3 changes    : ${fmt(plan.projectedTotalCo2e)} (saves ${fmt(totalAnnualCo2e - plan.projectedTotalCo2e)})

TOP RECOMMENDATIONS:
${recs}

DECISION TRACE (why each rule fired or was skipped):
${trace}
────────────────────────────────────────────────────────────────────────────────`;
}
