// ─────────────────────────────────────────────
// components/Settings.jsx
// Bankroll, Kelly fraction, league toggles, min EV
// ─────────────────────────────────────────────

import React from 'react';

const LEAGUES = ['Eliteserien', 'Allsvenskan', 'Veikkausliiga', 'Eredivisie'];

export default function Settings({ settings, onUpdateBankroll, onUpdateKelly, onUpdateMinEV, onToggleLeague }) {
  return (
    <div style={{ padding: '12px' }}>

      {/* ── Disclaimer ── */}
      <div style={{ background: '#FAEEDA', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#854F0B', marginBottom: '16px', lineHeight: 1.5 }}>
        This app identifies statistical value — it does not guarantee profit. Only bet what you can afford to lose. Start with paper trading.
      </div>

      <SettingSection title="Bankroll" desc="Your total betting bankroll. Kelly stakes are calculated from this number.">
        <input
          type="number"
          value={settings.bankroll}
          onChange={(e) => onUpdateBankroll(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '8px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', marginTop: '6px' }}
        />
      </SettingSection>

      <SettingSection
        title={`Kelly fraction: ${settings.kellyFraction.toFixed(2)}`}
        desc="0.25 = bet 25% of full Kelly. Lower = more conservative. Recommended for beginners: 0.25."
      >
        <input
          type="range" min="0.1" max="1" step="0.05"
          value={settings.kellyFraction}
          onChange={(e) => onUpdateKelly(e.target.value)}
          style={{ width: '100%', marginTop: '8px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
          <span>0.10 (safest)</span><span>1.00 (full Kelly)</span>
        </div>
      </SettingSection>

      <SettingSection
        title={`Min EV threshold: ${settings.minEV}%`}
        desc="Only show bets where EV is above this. Higher = fewer but stronger bets. Recommended: 5%."
      >
        <input
          type="range" min="2" max="15" step="1"
          value={settings.minEV}
          onChange={(e) => onUpdateMinEV(e.target.value)}
          style={{ width: '100%', marginTop: '8px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
          <span>2% (more bets)</span><span>15% (fewer, stronger)</span>
        </div>
      </SettingSection>

      <SettingSection title="Active leagues" desc="Only leagues that are on will appear in your daily bets feed.">
        <div style={{ marginTop: '8px' }}>
          {LEAGUES.map((league) => (
            <div key={league} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>{league}</span>
              <Toggle active={settings.leagues[league]} onToggle={() => onToggleLeague(league)} />
            </div>
          ))}
        </div>
      </SettingSection>

      <SettingSection title="How the model works" desc="">
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginTop: '4px' }}>
          <p style={{ marginBottom: '6px' }}>The app uses a <strong style={{ color: 'var(--color-text-primary)' }}>Poisson distribution model</strong> to estimate the probability that a match will have more than 2.5 goals.</p>
          <p style={{ marginBottom: '6px' }}>It calculates expected goals based on each team's attack and defense strength relative to the league average.</p>
          <p>It then compares your model probability against the bookmaker's implied probability. When the gap is large enough (above your min EV), it flags the bet as value.</p>
        </div>
      </SettingSection>

    </div>
  );
}

function SettingSection({ title, desc, children }) {
  return (
    <div style={{ background: 'var(--color-background-primary)', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)', padding: '14px 16px', marginBottom: '10px' }}>
      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px' }}>{title}</div>
      {desc && <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{desc}</div>}
      {children}
    </div>
  );
}

function Toggle({ active, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      width: '36px', height: '20px',
      background: active ? '#1D9E75' : 'var(--color-background-secondary)',
      borderRadius: '10px', position: 'relative', cursor: 'pointer',
      transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', width: '16px', height: '16px',
        background: 'white', borderRadius: '50%', top: '2px',
        left: active ? '18px' : '2px', transition: 'left 0.2s',
      }} />
    </div>
  );
}
