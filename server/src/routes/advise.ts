import type { FastifyInstance } from 'fastify';
import { AdviseRequestSchema } from '../engine/validate.js';
import { computeSignals } from '../engine/footprint.js';
import { decide } from '../engine/policy.js';
import type { AdviseResponse } from '../engine/types.js';

export async function adviseRoute(app: FastifyInstance) {
  app.post<{ Body: unknown }>('/advise', async (request, reply) => {
    const parsed = AdviseRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid input', details: parsed.error.flatten() });
    }

    const { profile, state } = parsed.data;
    const signals = computeSignals(profile, state);
    const plan = decide(profile, state, signals);

    const response: AdviseResponse = { signals, plan };
    return reply.send(response);
  });
}
