import { useState, useRef, useEffect } from 'react';
import { fetchChat } from '../lib/api';
import type { AdviseResponse } from '../lib/types';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface Props {
  signals: AdviseResponse['signals'];
  plan: AdviseResponse['plan'];
}

export function Chat({ signals, plan }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.scrollTop = liveRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const { reply } = await fetchChat({ question: q, signals, plan });
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="chat-panel" aria-labelledby="chat-heading">
      <h3 id="chat-heading">Ask a follow-up question</h3>
      <p className="chat-intro">
        Ask why a rule was skipped, what the numbers mean, or how to get started.
        All figures come from the engine above — the advisor will not invent new numbers.
      </p>

      {messages.length > 0 && (
        <ul
          ref={liveRef}
          className="chat-messages"
          aria-live="polite"
          aria-label="Conversation history"
        >
          {messages.map((m, i) => (
            <li key={i} className={`chat-msg chat-msg--${m.role}`}>
              <span className="chat-msg-label">{m.role === 'user' ? 'You' : 'Advisor'}</span>
              <p className="chat-msg-text">{m.text}</p>
            </li>
          ))}
          {loading && (
            <li className="chat-msg chat-msg--assistant chat-msg--loading" aria-label="Advisor is typing">
              <span className="chat-msg-label">Advisor</span>
              <span className="chat-dots" aria-hidden="true">···</span>
            </li>
          )}
        </ul>
      )}

      {error && (
        <p className="chat-error" role="alert">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="chat-form" aria-label="Ask a question">
        <label htmlFor="chat-input" className="sr-only">Your question</label>
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. Why wasn't cycling suggested for me?"
          disabled={loading}
          maxLength={500}
          aria-describedby={loading ? 'chat-status' : undefined}
          className="chat-input"
        />
        <button type="submit" disabled={loading || !input.trim()} className="chat-submit">
          {loading ? 'Sending…' : 'Ask'}
        </button>
        {loading && <span id="chat-status" className="sr-only">Waiting for response…</span>}
      </form>
    </section>
  );
}
