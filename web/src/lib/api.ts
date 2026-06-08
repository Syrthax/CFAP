import type { AdviseRequest, AdviseResponse } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export interface ChatRequest {
  question: string;
  signals: AdviseResponse['signals'];
  plan: AdviseResponse['plan'];
}

export async function fetchChat(body: ChatRequest): Promise<{ reply: string }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<{ reply: string }>;
}

export async function fetchAdvise(body: AdviseRequest): Promise<AdviseResponse> {
  const res = await fetch(`${API_BASE}/advise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<AdviseResponse>;
}
