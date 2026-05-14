// ─────────────────────────────────────────────
// components/DailyBets.jsx
// Fetches real fixtures from API-Football
// Falls back to mock data only if API fails
// ─────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { analyseFixture } from '../utils/poissonModel';
import { fetchTodaysFixtures, ENV } from '../utils/apiService';
import { mockFixtures } from '../data/mockFixtures';

export default function DailyBets({ settings, onLogBet, stats }) {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [usingMock, setUsingMock] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  const loadFixtures = useCallback(async () => {
    setLoading(true);
    setErrors([]);

    // If no API key at all — use mock immediately
    if (!ENV.apiFootball) {
      console.warn('No API-Football key — using mock data');
      setFixtures(mockFixtures);
      setUsingMock(true);
      setLoading(false);
      return;
    }

    try {
      const { fixtures: real, errors: apiErrors } = await fetchTodaysFixtures(settings.leagues);

      if (real.length > 0) {
        setFixtures(real);
        setUsingMock(false);
        setErrors(apiErrors);
      } else if (apiErrors.length > 0) {
        // API returned errors — fall back to mock
        console.warn('API errors — falling back to mock data', apiErrors);
        setFixtures(mockFixtures);
        setUsingMock(true);
        setErrors(apiErrors);
      } else {
        // API worked but genuinely no games today
        setFixtures([]);
        setUsingMock(false);
      }
    } catch (err) {
      console.error('Fatal fetch error:', err);
      setFixtures(mockFixtures);
      setUsingMock(true);
      setErrors([{ league: 'All', error: err.message }]);
    }

    setLastFetched(new Date().toLocaleTimeString());
    setLoading(false);
  }, [settings.leagues]);

  useEffect(() => {
    loadFixtures();
  }, [loadFixtures]);

  const analysed = fixtures
    .filter((f) => settings.leagues[f.league] !== false)
    .map((f) => ({
      ...f,
      ...analyseFixture(f, f.bookOdds, settings.bankroll, settings.kellyFraction, settings.minEV),
    }))
    .sort((a, b) => b.ev - a.ev);

  const valueBets = analysed.filter((f) => f.isValue);

  return (
    <div style={{ padding: '12px' }}>

      {/* ── Status bar ── */}
      {usingMock && (
        <div style={{ background: '#2a1f00', border: '0.5px solid #BA7517', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#ffcc44', marginBottom: '12px', lineHeight: 1.5 }}>
          ⚠️ Showing mock data — {ENV.apiFootball ? 'API returned no fixtures' : 'API key not found'}
          {errors.length > 0 && (
            <div style={{ marginTop: '4px', fontSize: '11px', opacity: 0.8 }}>
              {errors.map((e, i) => <div key={i}>{e.league}: {e.error}</div>)}
            </div>
          )}
        </div>
      )}

      {errors.length > 0 && !usingMock && (
        <div style={{ background: '#1a0000', border: '0.5px solid #E24B4A', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#ff8888', marginBottom: '12px' }}>
          ⚠️ Some leagues failed to load:
          {errors.map((e, i) => <div key={i} style={{ marginTop: '3px' }}>{e.league}: {e.error}</div>)}
        </div>
      )}

      {/* ── Metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
        <MetricCard label="Today's bets" value={loading ? '…' : valueBets.length} color="#1D9E75" />
        <MetricCard label="Monthly ROI" value={`${stats.roi > 0 ? '+' : ''}${stats.roi}%`} color={stats.roi >= 0 ? '#1D9E75' : '#E24B4A'} />
        <MetricCard label="Total P/L" value={`₦${stats.totalPL.toLocaleString()}`} color={stats.totalPL >= 0 ? '#1D9E75' : '#E24B4A'} />
      </div>

      {/* ── Section title ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Today's fixtures — over 2.5 goals
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {lastFetched && (
            <span style={{ fontSize: '10px', color: '#555' }}>updated {lastFetched}</span>
          )}
          <button onClick={loadFixtures} disabled={loading}
            style={{ fontSize: '11px', background: 'rgba(29,158,117,0.15)', color: '#1D9E75', border: '0.5px solid #1D9E75', borderRadius: '6px', padding: '4px 10px', cursor: loading ? 'default' : 'pointer' }}>
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* ── Loading state ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '28px', marginBottom: '12px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Scanning today's fixtures…</div>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '6px' }}>Fetching from API-Football</div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── No games today ── */}
      {!loading && analysed.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>📅</div>
          <div style={{ fontSize: '14px' }}>No fixtures today in your active leagues</div>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '6px' }}>Try enabling more leagues in Settings</div>
        </div>
      )}

      {/* ── Bet cards ── */}
      {!loading && analysed.map((f) => (
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
  const borderColor = f.isValue ? '#1D9E75' : f.isBorderline ? '#BA7517' : 'var(--color-border-tertiary)';
  const badgeBg = f.isValue ? '#EAF3DE' : f.isBorderline ? '#FAEEDA' : '#FCEBEB';
  const badgeColor = f.isValue ? '#3B6D11' : f.isBorderline ? '#854F0B' : '#A32D2D';

  return (
    <div style={{
      background: 'var(--color-background-primary)',
      borderRadius: '12px',
      border: '0.5px solid var(--color-border-tertiary)',
      borderLeft: `3px solid ${borderColor}`,
      padding: '14px',
      marginBottom: '10px',
      opacity: f.isValue || f.isBorderline ? 1 : 0.5,
    }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
        {[
          { label: 'My prob', value: `${f.myProb}%`, highlight: true },
          { label: 'Book prob', value: `${f.bookProb}%` },
          { label: 'Odds', value: f.bookOdds.toFixed(2) },
          { label: 'Edge', value: `${f.edge > 0 ? '+' : ''}${f.edge.toFixed(1)}%`, highlight: f.isValue },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>{s.label}</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: s.highlight ? '#1D9E75' : 'var(--color-text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {f.isValue ? (
          <>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Kelly stake: <strong style={{ color: 'var(--color-text-primary)' }}>₦{f.stake.toLocaleString()}</strong>
            </div>
            <button onClick={() => onLogBet(f)}
              style={{ fontSize: '12px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: 500 }}>
              Log this bet
            </button>
          </>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
            {f.isBorderline ? 'Borderline — skip or watch' : 'No value — do not bet'}
          </div>
        )}
      </div>
    </div>
  );
}
