// ─────────────────────────────────────────────
// components/BetLogger.jsx
// Log bets manually or via "Log this bet" button
// Shows all logged bets with P/L
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';

export default function BetLogger({ bets, onAddBet, onUpdateResult, prefill, onClearPrefill }) {
  const [form, setForm] = useState({
    match: '',
    league: 'Eliteserien',
    market: 'Over 2.5',
    odds: '',
    stake: '',
    result: 'Pending',
  });

  // Pre-fill from "Log this bet" click on DailyBets
  useEffect(() => {
    if (prefill) {
      setForm((f) => ({
        ...f,
        match: prefill.match || '',
        league: prefill.league || 'Eliteserien',
        odds: prefill.odds || '',
        stake: prefill.stake || '',
      }));
      onClearPrefill();
    }
  }, [prefill, onClearPrefill]);

  const handleSubmit = () => {
    if (!form.match || !form.odds || !form.stake) return;
    onAddBet({ ...form, odds: parseFloat(form.odds), stake: parseFloat(form.stake) });
    setForm({ match: '', league: 'Eliteserien', market: 'Over 2.5', odds: '', stake: '', result: 'Pending' });
  };

  const totalPL = bets.reduce((sum, b) => sum + (b.profitLoss || 0), 0);

  return (
    <div style={{ padding: '12px' }}>
      <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
        Log a bet
      </p>

      {/* ── Form ── */}
      <div style={{ background: 'var(--color-background-primary)', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)', padding: '14px', marginBottom: '16px' }}>
        {[
          { label: 'Match', id: 'match', type: 'text', placeholder: 'e.g. Bodø vs Tromsø' },
          { label: 'Odds taken', id: 'odds', type: 'number', placeholder: 'e.g. 1.90' },
          { label: 'Stake (₦)', id: 'stake', type: 'number', placeholder: 'e.g. 1500' },
        ].map((field) => (
          <div key={field.id} style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '5px' }}>{field.label}</label>
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={form[field.id]}
              onChange={(e) => setForm((f) => ({ ...f, [field.id]: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '8px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}
            />
          </div>
        ))}

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '5px' }}>League</label>
          <select value={form.league} onChange={(e) => setForm((f) => ({ ...f, league: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '8px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}>
            {['Eliteserien', 'Allsvenskan', 'Veikkausliiga', 'Eredivisie'].map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '5px' }}>Result</label>
          <select value={form.result} onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '8px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}>
            {['Pending', 'Won', 'Lost'].map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>

        <button onClick={handleSubmit}
          style={{ width: '100%', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
          Save bet
        </button>
      </div>

      {/* ── Bet log table ── */}
      {bets.length > 0 && (
        <div style={{ background: 'var(--color-background-primary)', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '6px', padding: '10px 12px', background: 'var(--color-background-secondary)', fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            <span>Match</span><span>Odds</span><span>Stake</span><span>Result</span><span>P/L</span>
          </div>
          {bets.map((b) => {
            const plColor = b.profitLoss > 0 ? '#1D9E75' : b.profitLoss < 0 ? '#E24B4A' : '#BA7517';
            const plStr = b.profitLoss > 0 ? `+₦${b.profitLoss.toLocaleString()}` : b.profitLoss < 0 ? `-₦${Math.abs(b.profitLoss).toLocaleString()}` : '—';
            return (
              <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '6px', padding: '10px 12px', borderTop: '0.5px solid var(--color-border-tertiary)', fontSize: '12px', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.match}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{parseFloat(b.odds).toFixed(2)}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>₦{parseFloat(b.stake).toLocaleString()}</span>
                <select value={b.result} onChange={(e) => onUpdateResult(b.id, e.target.value)}
                  style={{ fontSize: '11px', color: plColor, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
                  {['Pending', 'Won', 'Lost'].map((r) => <option key={r}>{r}</option>)}
                </select>
                <span style={{ color: plColor, fontWeight: 500 }}>{plStr}</span>
              </div>
            );
          })}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '6px', padding: '10px 12px', borderTop: '0.5px solid var(--color-border-tertiary)', fontSize: '12px', fontWeight: 500 }}>
            <span style={{ color: 'var(--color-text-primary)' }}>Total</span>
            <span /><span /><span />
            <span style={{ color: totalPL >= 0 ? '#1D9E75' : '#E24B4A' }}>
              {totalPL >= 0 ? '+' : ''}₦{totalPL.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
