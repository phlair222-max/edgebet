// ─────────────────────────────────────────────
// components/DailyBets.jsx
// Home screen — shows today's value bets
// Runs Poisson model on every fixture
// ─────────────────────────────────────────────

import React, { useMemo } from 'react';
import { analyseFixture } from '../utils/poissonModel';
import { mockFixtures } from '../data/mockFixtures';

export default function DailyBets({ settings, onLogBet, stats }) {
  const analysed = useMemo(() => {
    return mockFixtures
      .filter((f) => settings.leagues[f.league])
      .map((f) => ({
        ...f,
        ...analyseFixture(f, f.bookOdds, settings.bankroll, settings.kellyFraction, settings.minEV),
      }))
      .sort((a, b) => b.ev - a.ev);
  }, [settings]);

  const valueBets = analysed.filter((f) => f.isValue);

  return (
    <div style={{ padding: '12px' }}>

      {/* ── Summary metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
        <MetricCard label="Today's bets" value={valueBets.length} color="#1D9E75" />
        <MetricCard label="Monthly ROI" value={`${stats.roi > 0 ? '+' : ''}${stats.roi}%`} color={stats.roi >= 0 ? '#1D9E75' : '#E24B4A'} />
        <MetricCard label="Total P/L" value={`₦${stats.totalPL.toLocaleString()}`} color={stats.totalPL >= 0 ? '#1D9E75' : '#E24B4A'} />
      </div>

      {/* ── Section title ── */}
      <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
        Today's fixtures — over 2.5 goals
      </p>

      {/* ── Bet cards ── */}
      {analysed.map((f) => (
        <BetCard key={f.id} fixture={f} onLogBet={onLogBet} />
      ))}
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '10px 12px' }}>
      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 500, color }}>{value}</div>
    </div>
  );
}

function BetCard({ fixture: f, onLogBet }) {
  const isValue = f.isValue;
  const isBorderline = f.isBorderline;
  const borderColor = isValue ? '#1D9E75' : isBorderline ? '#BA7517' : 'var(--color-border-tertiary)';
  const badgeBg = isValue ? '#EAF3DE' : isBorderline ? '#FAEEDA' : '#FCEBEB';
  const badgeColor = isValue ? '#3B6D11' : isBorderline ? '#854F0B' : '#A32D2D';

  return (
    <div style={{
      background: 'var(--color-background-primary)',
      borderRadius: '12px',
      border: '0.5px solid var(--color-border-tertiary)',
      borderLeft: `3px solid ${borderColor}`,
      padding: '14px',
      marginBottom: '10px',
      opacity: isValue || isBorderline ? 1 : 0.55,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {f.home} vs {f.away}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {f.league} · {f.time} · Over 2.5 Goals
          </div>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: badgeBg, color: badgeColor, whiteSpace: 'nowrap' }}>
          {f.ev > 0 ? '+' : ''}{f.ev.toFixed(1)}% EV
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
        {[
          { label: 'My prob', value: `${f.myProb}%`, highlight: true },
          { label: 'Book prob', value: `${f.bookProb}%` },
          { label: 'Book odds', value: f.bookOdds.toFixed(2) },
          { label: 'Edge', value: `${f.edge > 0 ? '+' : ''}${f.edge.toFixed(1)}%`, highlight: isValue },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>{s.label}</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: s.highlight ? '#1D9E75' : 'var(--color-text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isValue ? (
          <>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Kelly stake: <strong style={{ color: 'var(--color-text-primary)' }}>₦{f.stake.toLocaleString()}</strong>
            </div>
            <button
              onClick={() => onLogBet(f)}
              style={{ fontSize: '12px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: 500 }}
            >
              Log this bet
            </button>
          </>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
            {isBorderline ? 'Borderline — skip or watch' : 'No value — do not bet'}
          </div>
        )}
      </div>
    </div>
  );
}
