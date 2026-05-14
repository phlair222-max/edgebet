// ─────────────────────────────────────────────
// components/Dashboard.jsx
// Performance analytics — ROI, win rate, profits
// Uses Recharts for charts
// ─────────────────────────────────────────────

import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard({ bets, stats }) {
  // ── ROI over time (cumulative) ────────────────
  const roiOverTime = useMemo(() => {
    let cumStake = 0;
    let cumPL = 0;
    return bets
      .slice()
      .reverse()
      .filter((b) => b.result !== 'Pending')
      .map((b, i) => {
        cumStake += b.stake;
        cumPL += b.profitLoss;
        const roi = cumStake ? +((cumPL / cumStake) * 100).toFixed(1) : 0;
        return { bet: i + 1, roi };
      });
  }, [bets]);

  // ── Profit by league ──────────────────────────
  const leagueData = useMemo(() => {
    const map = {};
    bets.forEach((b) => {
      if (!map[b.league]) map[b.league] = 0;
      map[b.league] += b.profitLoss || 0;
    });
    return Object.entries(map).map(([league, profit]) => ({
      league: league.replace('Veikkausliiga', 'Veikk.').replace('Eredivisie', 'Erediv.'),
      profit: Math.round(profit),
    }));
  }, [bets]);

  const metricCards = [
    { label: 'Total bets', value: stats.total },
    { label: 'Win rate', value: `${stats.winRate}%`, color: stats.winRate >= 50 ? '#1D9E75' : '#E24B4A' },
    { label: 'ROI', value: `${stats.roi > 0 ? '+' : ''}${stats.roi}%`, color: stats.roi >= 0 ? '#1D9E75' : '#E24B4A' },
    { label: 'Won', value: stats.won, color: '#1D9E75' },
    { label: 'Settled', value: stats.settled },
    { label: 'Total P/L', value: `₦${stats.totalPL.toLocaleString()}`, color: stats.totalPL >= 0 ? '#1D9E75' : '#E24B4A' },
  ];

  return (
    <div style={{ padding: '12px' }}>

      {/* ── Metric cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
        {metricCards.map((m) => (
          <div key={m.label} style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{m.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 500, color: m.color || 'var(--color-text-primary)' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* ── ROI chart ── */}
      <ChartCard title="ROI over time (%)">
        {roiOverTime.length > 1 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={roiOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis dataKey="bet" tick={{ fontSize: 11, fill: '#888' }} label={{ value: 'Bets', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#888' }} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, 'ROI']} contentStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="roi" stroke="#1D9E75" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState text="Log more bets to see your ROI trend" />
        )}
      </ChartCard>

      {/* ── League profit chart ── */}
      <ChartCard title="Profit by league (₦)">
        {leagueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={leagueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis dataKey="league" tick={{ fontSize: 11, fill: '#888' }} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(v) => `₦${v}`} />
              <Tooltip formatter={(v) => [`₦${v}`, 'Profit']} contentStyle={{ fontSize: '12px' }} />
              <Bar dataKey="profit" fill="#1D9E75" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState text="Log bets to see league performance" />
        )}
      </ChartCard>

      {/* ── Win rate progress ── */}
      <ChartCard title="Market performance">
        <ProgressBar label="Over 2.5 Goals" value={stats.winRate} max={100} suffix="% hit rate" />
        <ProgressBar label="BTTS (coming soon)" value={0} max={100} suffix="—" color="#BA7517" />
      </ChartCard>

    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: 'var(--color-background-primary)', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)', padding: '16px', marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '12px' }}>{title}</div>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
      {text}
    </div>
  );
}

function ProgressBar({ label, value, max, suffix, color = '#1D9E75' }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
        <span>{label}</span><span>{value > 0 ? `${value}${suffix}` : suffix}</span>
      </div>
      <div style={{ height: '8px', background: 'var(--color-background-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}
