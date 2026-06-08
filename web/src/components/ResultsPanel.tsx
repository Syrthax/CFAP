import type { AdviseResponse } from '../lib/types';
import { Chat } from './Chat';

interface Props {
  result: AdviseResponse;
  onReset: () => void;
}

const EFFORT_LABELS: Record<number, string> = { 1: 'Easy', 2: 'Moderate', 3: 'High effort' };
const CATEGORY_LABELS: Record<string, string> = {
  transport: 'Transport', diet: 'Diet', energy: 'Energy', goods: 'Goods',
};

function fmt(kg: number) {
  return kg >= 1000
    ? `${(kg / 1000).toFixed(1)} t CO₂e`
    : `${Math.round(kg)} kg CO₂e`;
}

export function ResultsPanel({ result, onReset }: Props) {
  const { signals, plan } = result;
  const topRecs = plan.recommendations.slice(0, 3);
  const savingTotal = topRecs.reduce((s, r) => s + r.annualSavingCo2e, 0);
  const sortedCats = (Object.entries(signals.annualCo2eByCategory) as [string, number][])
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="results-panel">
      <header className="results-header">
        <div>
          <h2>Your annual footprint</h2>
          <p className="total-co2">{fmt(signals.totalAnnualCo2e)}</p>
          <p className="vs-avg">
            {signals.vsRegionalAvg >= 1
              ? `${Math.round((signals.vsRegionalAvg - 1) * 100)}% above regional average`
              : `${Math.round((1 - signals.vsRegionalAvg) * 100)}% below regional average`}
          </p>
        </div>
        <div className="projection">
          <p className="projection-label">After top 3 changes</p>
          <p className="projected-co2">{fmt(plan.projectedTotalCo2e)}</p>
          <p className="saving">−{fmt(savingTotal)} / year</p>
        </div>
      </header>

      {/* Footprint breakdown — bar chart with accessible data table */}
      <section aria-labelledby="breakdown-heading">
        <h3 id="breakdown-heading">Footprint breakdown</h3>

        {/* Visual bars */}
        <ul className="breakdown-list" role="list" aria-label="Footprint breakdown by category">
          {sortedCats.map(([cat, kg]) => {
            const pct = Math.round((kg / signals.totalAnnualCo2e) * 100);
            return (
              <li key={cat}>
                <span className="cat-label">{CATEGORY_LABELS[cat]}</span>
                <div className="bar-track" aria-hidden="true">
                  <div className={`bar-fill cat-${cat}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="cat-value">{fmt(kg)}</span>
              </li>
            );
          })}
        </ul>

        {/* Visually-hidden data table — axe / screen-reader equivalent */}
        <table className="sr-only" aria-label="Footprint breakdown data table">
          <caption>Annual CO₂e by category</caption>
          <thead>
            <tr><th scope="col">Category</th><th scope="col">kg CO₂e / year</th><th scope="col">% of total</th></tr>
          </thead>
          <tbody>
            {sortedCats.map(([cat, kg]) => (
              <tr key={cat}>
                <td>{CATEGORY_LABELS[cat]}</td>
                <td>{Math.round(kg)}</td>
                <td>{Math.round((kg / signals.totalAnnualCo2e) * 100)}%</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Total</th>
              <td>{Math.round(signals.totalAnnualCo2e)}</td>
              <td>100%</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Recommendations */}
      <section aria-labelledby="recs-heading">
        <h3 id="recs-heading">Top recommendations for you</h3>
        <ol className="recs-list">
          {topRecs.map(r => (
            <li key={r.id} className="rec-card">
              <div className="rec-top">
                <span className={`rec-category cat-tag cat-${r.category}`}>{CATEGORY_LABELS[r.category]}</span>
                <span className="rec-effort">{EFFORT_LABELS[r.effort]}</span>
              </div>
              <p className="rec-title">{r.title}</p>
              <p className="rec-saving">Saves ~{fmt(r.annualSavingCo2e)} / year</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Decision trace — the "Why these?" panel */}
      <section aria-labelledby="trace-heading">
        <h3 id="trace-heading">Why these? (decision trace)</h3>
        <p className="trace-intro">Every rule was evaluated. Here's what fired and what was skipped — and why.</p>
        <ul className="trace-list">
          {plan.trace.map(t => (
            <li key={t.ruleId} className={`trace-step ${t.fired ? 'fired' : 'skipped'}`}>
              <span className="trace-badge">{t.fired ? '✓ Applied' : '✗ Skipped'}</span>
              <code className="trace-rule">{t.ruleId}</code>
              <span className="trace-reason">{t.reason}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Chat follow-up */}
      <Chat signals={signals} plan={plan} />

      <button className="reset-btn" onClick={onReset}>Start over</button>
    </div>
  );
}
