import { useState, useRef, useEffect } from 'react';
import { IntakeForm } from './components/IntakeForm';
import { ResultsPanel } from './components/ResultsPanel';
import { fetchAdvise } from './lib/api';
import type { AdviseRequest, AdviseResponse } from './lib/types';
import './App.css';

export default function App() {
  const [result, setResult] = useState<AdviseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (result) {
      mainRef.current?.focus();
    }
  }, [result]);

  async function handleSubmit(data: AdviseRequest) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdvise(data);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
  }

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>

      <header className="site-header">
        <div className="site-header-inner">
          <span className="site-logo" aria-hidden="true">🌱</span>
          <div>
            <h1 className="site-title">Carbon Footprint Advisor</h1>
            <p className="site-tagline">Ranked by impact-per-effort, not generic tips</p>
          </div>
        </div>
      </header>

      <nav className="sr-only" aria-label="Page navigation">
        <a href="#main">Skip to main content</a>
      </nav>

      <main ref={mainRef} tabIndex={-1} className="main-content" id="main">
        {error && (
          <div className="error-banner" role="alert" aria-live="assertive">
            {error}
          </div>
        )}
        {result ? (
          <ResultsPanel result={result} onReset={handleReset} />
        ) : (
          <IntakeForm onSubmit={handleSubmit} loading={loading} />
        )}
      </main>

      <footer className="site-footer">
        <p>
          Estimates only — methodology disclosed in the README.
          Sources: DEFRA 2024, EPA, Poore &amp; Nemecek 2018.
        </p>
      </footer>
    </>
  );
}
