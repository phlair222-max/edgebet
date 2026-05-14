// ─────────────────────────────────────────────
// hooks/useBets.js
// Manages all logged bets
// Saves to Supabase when connected
// Falls back to localStorage during development
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react';
// import { supabase } from '../utils/supabaseClient'; // Uncomment when Supabase is ready

export function useBets() {
  const [bets, setBets] = useState(() => {
    try {
      const saved = localStorage.getItem('edgebet_bets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('edgebet_bets', JSON.stringify(bets));
  }, [bets]);

  const addBet = (bet) => {
    const newBet = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      ...bet,
      profitLoss: calcPL(bet),
    };
    setBets((prev) => [newBet, ...prev]);

    // ── Supabase insert (uncomment when ready) ──
    // supabase.from('bets').insert([newBet]);
  };

  const updateBetResult = (id, result) => {
    setBets((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, result, profitLoss: calcPL({ ...b, result }) }
          : b
      )
    );
  };

  const deleteBet = (id) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  // ── Derived stats ─────────────────────────────
  const settledBets = bets.filter((b) => b.result !== 'Pending');
  const wonBets = bets.filter((b) => b.result === 'Won');
  const totalStaked = settledBets.reduce((sum, b) => sum + b.stake, 0);
  const totalPL = bets.reduce((sum, b) => sum + (b.profitLoss || 0), 0);
  const winRate = settledBets.length
    ? +((wonBets.length / settledBets.length) * 100).toFixed(1)
    : 0;
  const roi = totalStaked
    ? +((totalPL / totalStaked) * 100).toFixed(1)
    : 0;

  return {
    bets,
    addBet,
    updateBetResult,
    deleteBet,
    stats: {
      total: bets.length,
      settled: settledBets.length,
      won: wonBets.length,
      totalStaked,
      totalPL,
      winRate,
      roi,
    },
  };
}

function calcPL(bet) {
  if (bet.result === 'Won') return Math.round(bet.stake * (bet.odds - 1));
  if (bet.result === 'Lost') return -bet.stake;
  return 0;
}
