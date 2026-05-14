// ─────────────────────────────────────────────
// utils/poissonModel.js
// Core maths engine for EdgeBet
// Poisson distribution + EV + Kelly calculator
// ─────────────────────────────────────────────

const LEAGUE_AVG_GOALS = 2.6; // Average goals per game across target leagues

// ── Poisson probability: P(X = k) ────────────
export function poissonProb(lambda, k) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let prob = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) {
    prob *= lambda / i;
  }
  return prob;
}

// ── P(total goals > 2.5) using Poisson ───────
export function over25Probability(homeExpected, awayExpected) {
  let under = 0;
  // Sum all combinations where total goals <= 2
  for (let h = 0; h <= 2; h++) {
    for (let a = 0; a <= 2 - h; a++) {
      under += poissonProb(homeExpected, h) * poissonProb(awayExpected, a);
    }
  }
  return 1 - under;
}

// ── Expected goals for a team in this match ──
// Formula: AttackStrength × DefenseWeakness × LeagueAvg
export function expectedGoals(teamAvgScored, opponentAvgConceded, leagueAvg = LEAGUE_AVG_GOALS) {
  const attackStrength = teamAvgScored / leagueAvg;
  const defenseWeakness = opponentAvgConceded / leagueAvg;
  return attackStrength * defenseWeakness * leagueAvg;
}

// ── Convert decimal odds → implied probability ─
export function oddsToImpliedProb(decimalOdds) {
  return 1 / decimalOdds;
}

// ── Expected Value calculation ────────────────
// EV = (myProb × profit) - (1 - myProb) × stake
// Returned as a percentage
export function calcEV(myProb, decimalOdds) {
  const profit = decimalOdds - 1; // profit per 1 unit staked
  return ((myProb * profit) - (1 - myProb)) * 100;
}

// ── Kelly Criterion stake sizing ──────────────
// f = (bp - q) / b
// b = odds - 1, p = win prob, q = lose prob
export function kellyStake(myProb, decimalOdds, bankroll, fraction = 0.25) {
  const b = decimalOdds - 1;
  const p = myProb;
  const q = 1 - myProb;
  const fullKelly = (b * p - q) / b;
  const fractionalKelly = fullKelly * fraction;
  if (fractionalKelly <= 0) return 0;
  // Round to nearest 100 NGN
  return Math.round((bankroll * fractionalKelly) / 100) * 100;
}

// ── Full fixture analysis ─────────────────────
// Takes a fixture object, returns all calculated values
export function analyseFixture(fixture, bookOdds, bankroll, kellyFraction, minEVThreshold) {
  const homeExp = expectedGoals(
    fixture.homeAvgScored,
    fixture.awayAvgConceded
  );
  const awayExp = expectedGoals(
    fixture.awayAvgScored,
    fixture.homeAvgConceded
  );

  const myProb = over25Probability(homeExp, awayExp);
  const bookProb = oddsToImpliedProb(bookOdds);
  const ev = calcEV(myProb, bookOdds);
  const edge = (myProb - bookProb) * 100;
  const stake = kellyStake(myProb, bookOdds, bankroll, kellyFraction);

  const isValue = ev >= minEVThreshold;
  const isBorderline = ev >= 2 && ev < minEVThreshold;

  return {
    homeExpectedGoals: +homeExp.toFixed(2),
    awayExpectedGoals: +awayExp.toFixed(2),
    myProb: +(myProb * 100).toFixed(1),
    bookProb: +(bookProb * 100).toFixed(1),
    ev: +ev.toFixed(1),
    edge: +edge.toFixed(1),
    stake,
    isValue,
    isBorderline,
    signal: isValue ? 'BET' : isBorderline ? 'WATCH' : 'SKIP',
  };
}
