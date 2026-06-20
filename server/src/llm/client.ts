import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 512;

export async function callLlm(systemPrompt: string, userMessage: string, apiKey?: string): Promise<string> {
  const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('NO_API_KEY');

  const client = new Anthropic({ apiKey: key });
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = msg.content[0];
  if (block.type !== 'text') throw new Error('Unexpected non-text response from LLM');
  return block.text;
}
