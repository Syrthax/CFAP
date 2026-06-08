import type { FastifyInstance } from 'fastify';
import { AdviseRequestSchema } from '../engine/validate.js';
import type { AdviseResponse } from '../engine/types.js';

export async function adviseRoute(app: FastifyInstance) {
  app.post<{ Body: unknown }>('/advise', async (request, reply) => {
    const parsed = AdviseRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid input', details: parsed.error.flatten() });
    }

    // Phase 1 stub — replaced in Phase 2 with the real engine
    const stub: AdviseResponse = {
      signals: {
        annualCo2eByCategory: {
          transport: 2100,
          diet: 1800,
          energy: 1600,
          goods: 800,
        },
        totalAnnualCo2e: 6300,
        topCategory: 'transport',
        vsRegionalAvg: 1.2,
      },
      plan: {
        recommendations: [
          {
            id: 'reduce-red-meat',
            category: 'diet',
            title: 'Reduce red meat to 1–2 days per week',
            annualSavingCo2e: 340,
            effort: 2,
            score: 255,
          },
          {
            id: 'efficiency-behavioral',
            category: 'energy',
            title: 'Lower thermostat by 1°C and switch to LED lighting',
            annualSavingCo2e: 180,
            effort: 1,
            score: 270,
          },
          {
            id: 'shift-short-car-trips',
            category: 'transport',
            title: 'Replace short car trips with cycling or walking',
            annualSavingCo2e: 420,
            effort: 2,
            score: 315,
          },
        ],
        projectedTotalCo2e: 5360,
        trace: [
          {
            ruleId: 'shift-short-car-trips',
            reason: 'Transport is 33% of your footprint and you don\'t cycle yet.',
            fired: true,
          },
          {
            ruleId: 'reduce-red-meat',
            reason: 'Red meat consumption is a large, low-effort lever.',
            fired: true,
          },
          {
            ruleId: 'efficiency-behavioral',
            reason: 'Energy usage is above the benchmark for your household size.',
            fired: true,
          },
          {
            ruleId: 'reduce-dairy',
            reason: 'Dairy intake not marked as heavy — rule skipped.',
            fired: false,
          },
          {
            ruleId: 'heat-pump-upgrade',
            reason: 'Gas heating detected but effort-3 cost makes it lower priority.',
            fired: false,
          },
        ],
      },
    };

    return reply.send(stub);
  });
}
