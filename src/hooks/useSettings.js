// ─────────────────────────────────────────────
// hooks/useSettings.js
// Global settings state — bankroll, kelly, leagues
// Persists to localStorage until Supabase is connected
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react';

const DEFAULTS = {
  bankroll: 50000,
  kellyFraction: 0.25,
  minEV: 5,
  leagues: {
    Eliteserien: true,
    Allsvenskan: true,
    Veikkausliiga: true,
    Eredivisie: true,
  },
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('edgebet_settings');
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem('edgebet_settings', JSON.stringify(settings));
  }, [settings]);

  const updateBankroll = (val) =>
    setSettings((s) => ({ ...s, bankroll: parseFloat(val) || 50000 }));

  const updateKelly = (val) =>
    setSettings((s) => ({ ...s, kellyFraction: parseFloat(val) }));

  const updateMinEV = (val) =>
    setSettings((s) => ({ ...s, minEV: parseFloat(val) }));

  const toggleLeague = (league) =>
    setSettings((s) => ({
      ...s,
      leagues: { ...s.leagues, [league]: !s.leagues[league] },
    }));

  return { settings, updateBankroll, updateKelly, updateMinEV, toggleLeague };
}
