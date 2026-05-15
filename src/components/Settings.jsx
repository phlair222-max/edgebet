import React, { useState } from 'react';
import { checkApiStatus, ENV } from '../utils/apiService';

const LEAGUES = ['Eredivisie', 'Bundesliga', 'Ligue 1', 'Championship'];

export default function Settings({ settings, onUpdateBankroll, onUpdateKelly, onUpdateMinEV, onToggleLeague }) {
  const [apiStatus, setApiStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  const runCheck = async () => {
    setChecking(true);
    const status = await checkApiStatus();
    setApiStatus(status);
    setChecking(false);
  };

  return (
    <div style={{ padding: '12px' }}>

      <div style={{ background: '#2a1f00', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#ffcc44', marginBottom: '16px', lineHeight: 1.5 }}>
        This app finds statistical value bets — not guaranteed profit. Paper trade for 4–6 weeks first.
      </div>

      {/* ── API Debug Panel ── */}
      <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>API Status</p>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)', padding: '14px', marginBottom: '16px' }}>

        {/* Env var presence */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Environment Variables</div>
          {[
            { label: 'REACT_APP_API_FOOTBALL_KEY', present: !!ENV.apiFootball },
            { label: 'REACT_APP_ODDS_API_KEY', present: !!ENV.oddsApi },
            { label: 'REACT_APP_SUPABASE_URL', present: !!ENV.supabaseUrl },
            { label: 'REACT_APP_SUPABASE_ANON_KEY', present: !!ENV.supabaseKey },
          ].map((v) => (
            <div key={v.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: '11px' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{v.label}</span>
              <span style={{ color: v.present ? '#1D9E75' : '#E24B4A', fontWeight: 500 }}>{v.present ? '✅ loaded' : '❌ missing'}</span>
            </div>
          ))}
        </div>

        {/* Live connection test */}
        <button onClick={runCheck} disabled={checking}
          style={{ width: '100%', background: checking ? 'rgba(29,158,117,0.1)' : 'rgba(29,158,117,0.15)', color: '#1D9E75', border: '0.5px solid #1D9E75', borderRadius: '8px', padding: '8px', fontSize: '13px', cursor: checking ? 'default' : 'pointer', marginBottom: apiStatus ? '12px' : 0 }}>
          {checking ? 'Testing connections…' : 'Test API Connections'}
        </button>

        {apiStatus && (
          <div style={{ fontSize: '12px' }}>
            {/* API-Football */}
            <div style={{ padding: '8px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>API-Football</span>
                <span style={{ color: apiStatus.apiFootball.working ? '#1D9E75' : '#E24B4A' }}>
                  {apiStatus.apiFootball.working ? '✅ connected' : '❌ failed'}
                </span>
              </div>
              {apiStatus.apiFootball.working && (
                <div style={{ color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                  Requests today: {apiStatus.apiFootball.requestsToday} / {apiStatus.apiFootball.requestsLimit}
                </div>
              )}
              {apiStatus.apiFootball.error && (
                <div style={{ color: '#E24B4A', marginTop: '3px' }}>{apiStatus.apiFootball.error}</div>
              )}
            </div>

            {/* Odds API */}
            <div style={{ padding: '8px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>The Odds API</span>
                <span style={{ color: apiStatus.oddsApi.working ? '#1D9E75' : '#E24B4A' }}>
                  {apiStatus.oddsApi.working ? '✅ connected' : apiStatus.oddsApi.present ? '❌ failed' : '⚪ no key'}
                </span>
              </div>
              {apiStatus.oddsApi.requestsRemaining && (
                <div style={{ color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                  Requests remaining: {apiStatus.oddsApi.requestsRemaining}
                </div>
              )}
              {apiStatus.oddsApi.error && (
                <div style={{ color: '#E24B4A', marginTop: '3px' }}>{apiStatus.oddsApi.error}</div>
              )}
            </div>

            {/* Supabase */}
            <div style={{ paddingTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Supabase</span>
                <span style={{ color: apiStatus.supabase.present ? '#1D9E75' : '#E24B4A' }}>
                  {apiStatus.supabase.present ? '✅ keys loaded' : '❌ keys missing'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bankroll ── */}
      <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Bankroll</p>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)', padding: '14px', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Your total betting bankroll in NGN. Kelly stakes are calculated from this.</div>
        <input type="number" value={settings.bankroll} onChange={(e) => onUpdateBankroll(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '8px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }} />
      </div>

      {/* ── Kelly ── */}
      <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Kelly Fraction: {settings.kellyFraction.toFixed(2)}</p>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)', padding: '14px', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>0.25 = bet 25% of full Kelly. Recommended for beginners.</div>
        <input type="range" min="0.1" max="1" step="0.05" value={settings.kellyFraction} onChange={(e) => onUpdateKelly(e.target.value)} style={{ width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          <span>0.10 safest</span><span>1.00 full Kelly</span>
        </div>
      </div>

      {/* ── Min EV ── */}
      <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Min EV Threshold: {settings.minEV}%</p>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)', padding: '14px', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Only show bets where edge exceeds this. Recommended: 5%.</div>
        <input type="range" min="2" max="15" step="1" value={settings.minEV} onChange={(e) => onUpdateMinEV(e.target.value)} style={{ width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          <span>2% more bets</span><span>15% stronger bets</span>
        </div>
      </div>

      {/* ── Leagues ── */}
      <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Active Leagues</p>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)', padding: '4px 14px', marginBottom: '10px' }}>
        {LEAGUES.map((league) => (
          <div key={league} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>{league}</span>
            <Toggle active={settings.leagues[league]} onToggle={() => onToggleLeague(league)} />
          </div>
        ))}
      </div>

    </div>
  );
}

function Toggle({ active, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width: '36px', height: '20px', background: active ? '#1D9E75' : 'rgba(255,255,255,0.1)', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: '16px', height: '16px', background: 'white', borderRadius: '50%', top: '2px', left: active ? '18px' : '2px', transition: 'left 0.2s' }} />
    </div>
  );
}
