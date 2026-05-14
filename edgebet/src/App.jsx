// ─────────────────────────────────────────────
// App.jsx
// Root component — navigation + state wiring
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import DailyBets from './components/DailyBets';
import BetLogger from './components/BetLogger';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { useSettings } from './hooks/useSettings';
import { useBets } from './hooks/useBets';
import './App.css';

const NAV = [
  { id: 'bets', label: 'Value Bets', icon: '◎' },
  { id: 'logger', label: 'Log Bet', icon: '✎' },
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export default function App() {
  const [page, setPage] = useState('bets');
  const [prefill, setPrefill] = useState(null);
  const { settings, updateBankroll, updateKelly, updateMinEV, toggleLeague } = useSettings();
  const { bets, addBet, updateBetResult, stats } = useBets();

  const handleLogBet = (fixture) => {
    setPrefill({
      match: `${fixture.home} vs ${fixture.away}`,
      league: fixture.league,
      odds: fixture.bookOdds,
      stake: fixture.stake,
    });
    setPage('logger');
  };

  return (
    <div className="app-root">
      {/* ── Top bar ── */}
      <div className="topbar">
        <div className="logo">Edge<span>Bet</span></div>
        <div className="bankroll-pill">
          Bankroll: <strong>₦{settings.bankroll.toLocaleString()}</strong>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-btn ${page === n.id ? 'active' : ''}`}
            onClick={() => setPage(n.id)}
          >
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{n.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Page content ── */}
      <main className="main-content">
        {page === 'bets' && (
          <DailyBets
            settings={settings}
            onLogBet={handleLogBet}
            stats={stats}
          />
        )}
        {page === 'logger' && (
          <BetLogger
            bets={bets}
            onAddBet={addBet}
            onUpdateResult={updateBetResult}
            prefill={prefill}
            onClearPrefill={() => setPrefill(null)}
          />
        )}
        {page === 'dashboard' && (
          <Dashboard bets={bets} stats={stats} />
        )}
        {page === 'settings' && (
          <Settings
            settings={settings}
            onUpdateBankroll={updateBankroll}
            onUpdateKelly={updateKelly}
            onUpdateMinEV={updateMinEV}
            onToggleLeague={toggleLeague}
          />
        )}
      </main>
    </div>
  );
}
