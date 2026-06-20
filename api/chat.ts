import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ChatRequestSchema, LlmOutputSchema } from '../server/src/engine/validate.js';
import { buildSystemPrompt } from '../server/src/llm/prompt.js';
import { callLlm } from '../server/src/llm/client.js';

const FALLBACK = "I wasn't able to generate a response right now. Please try again.";

function parseReply(raw: string): string {
  try {
    const parsed = LlmOutputSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data.reply;
  } catch {
    // fall through to repair
  }
  const repaired = LlmOutputSchema.safeParse({ reply: raw.trim() });
  if (repaired.success) return repaired.data.reply;
  return FALLBACK;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { question, signals, plan } = parsed.data;
  const systemPrompt = buildSystemPrompt(signals, plan);

  try {
    const raw = await callLlm(systemPrompt, question);
    const text = parseReply(raw);
    return res.status(200).json({ reply: text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LLM unavailable';
    return res.status(200).json({ reply: FALLBACK, _error: msg });
  }
}
