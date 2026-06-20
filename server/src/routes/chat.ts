import type { FastifyInstance } from 'fastify';
import { ChatRequestSchema, LlmOutputSchema } from '../engine/validate.js';
import { buildSystemPrompt } from '../llm/prompt.js';
import { callLlm } from '../llm/client.js';

const FALLBACK = 'I wasn\'t able to generate a response right now. Please try again.';

function parseReply(raw: string): string {
  // Primary: LLM returned {"reply": "..."}
  try {
    const parsed = LlmOutputSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data.reply;
  } catch {
    // fall through to repair
  }

  // Repair: LLM returned plain text — validate it directly
  const repaired = LlmOutputSchema.safeParse({ reply: raw.trim() });
  if (repaired.success) return repaired.data.reply;

  return FALLBACK;
}

export async function chatRoute(app: FastifyInstance) {
  app.post<{ Body: unknown }>('/chat', async (request, reply) => {
    const parsed = ChatRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid input', details: parsed.error.flatten() });
    }

    const { question, signals, plan, apiKey } = parsed.data;
    const systemPrompt = buildSystemPrompt(signals, plan);

    try {
      const raw = await callLlm(systemPrompt, question, apiKey);
      const text = parseReply(raw);
      return reply.send({ reply: text });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'LLM unavailable';
      if (msg === 'NO_API_KEY') {
        return reply.status(400).send({ error: 'API key required. Enter your Anthropic API key in the chat panel.' });
      }
      app.log.error({ err }, 'LLM call failed');
      return reply.send({ reply: FALLBACK, _error: msg });
    }
  });
}
