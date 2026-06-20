import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ResultsPanel } from './ResultsPanel';
import type { AdviseResponse } from '../lib/types';

const RESULT: AdviseResponse = {
  signals: {
    annualCo2eByCategory: { transport: 3000, diet: 1500, energy: 800, goods: 1740 },
    totalAnnualCo2e: 7040,
    topCategory: 'transport',
    vsRegionalAvg: 1.2,
  },
  plan: {
    recommendations: [
      { id: 'flag-long-haul', category: 'transport', title: 'Reduce long-haul flights', annualSavingCo2e: 1640, effort: 3, score: 820 },
      { id: 'reduce-red-meat', category: 'diet', title: 'Cut red meat to 1 day per week', annualSavingCo2e: 1109, effort: 2, score: 554 },
    ],
    projectedTotalCo2e: 4291,
    trace: [
      { ruleId: 'flag-long-haul', reason: 'One long-haul flight/yr — single largest lever.', fired: true },
      { ruleId: 'shift-short-car-trips', reason: 'You already cycle regularly — rule skipped.', fired: false },
    ],
  },
};

describe('ResultsPanel — footprint and projection', () => {
  it('renders the total and projected footprint', () => {
    render(<ResultsPanel result={RESULT} onReset={vi.fn()} />);
    // fmt() renders values >= 1000 kg as tonnes
    expect(screen.getByText('7.0 t CO₂e')).toBeDefined();
    expect(screen.getByText('4.3 t CO₂e')).toBeDefined();
  });

  it('shows how far above the regional average the user is', () => {
    render(<ResultsPanel result={RESULT} onReset={vi.fn()} />);
    expect(screen.getByText(/20% above regional average/)).toBeDefined();
  });
});

describe('ResultsPanel — "Why these?" decision trace', () => {
  it('renders both fired and skipped rules with their reasons', () => {
    render(<ResultsPanel result={RESULT} onReset={vi.fn()} />);

    // Fired rule is present and marked applied
    expect(screen.getByText('flag-long-haul')).toBeDefined();
    expect(screen.getByText('✓ Applied')).toBeDefined();

    // Skipped rule (the differentiator) is present with its skip reason
    expect(screen.getByText('shift-short-car-trips')).toBeDefined();
    expect(screen.getByText('✗ Skipped')).toBeDefined();
    expect(screen.getByText(/already cycle regularly/)).toBeDefined();
  });
});

describe('ResultsPanel — accessibility', () => {
  it('provides a visually-hidden data table equivalent for the chart', () => {
    render(<ResultsPanel result={RESULT} onReset={vi.fn()} />);
    const table = screen.getByRole('table', { name: /footprint breakdown data table/i });
    // Every category and the total row should be reachable as table data
    expect(within(table).getByText('Transport')).toBeDefined();
    expect(within(table).getByText('Total')).toBeDefined();
  });
});
