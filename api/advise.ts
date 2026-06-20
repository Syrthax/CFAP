import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AdviseRequestSchema } from '../server/src/engine/validate.js';
import { computeSignals } from '../server/src/engine/footprint.js';
import { decide } from '../server/src/engine/policy.js';
import type { Profile, UserState, AdviseResponse } from '../server/src/engine/types.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = AdviseRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  // zod has already validated shape; cast to engine types for TypeScript
  const { profile, state } = parsed.data as { profile: Profile; state: UserState };
  const signals = computeSignals(profile, state);
  const plan = decide(profile, state, signals);

  const response: AdviseResponse = { signals, plan };
  return res.status(200).json(response);
}
