import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 512;

// Reuse client instances per API key within a function invocation lifetime
const _clients = new Map<string, Anthropic>();

function getClient(apiKey: string): Anthropic {
  let client = _clients.get(apiKey);
  if (!client) {
    client = new Anthropic({ apiKey });
    _clients.set(apiKey, client);
  }
  return client;
}

/** Call the LLM with a bounded system prompt. Throws 'NO_API_KEY' if no key is available. */
export async function callLlm(systemPrompt: string, userMessage: string, apiKey?: string): Promise<string> {
  const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('NO_API_KEY');

  const msg = await getClient(key).messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = msg.content[0];
  if (block.type !== 'text') throw new Error('Unexpected non-text response from LLM');
  return block.text;
}
