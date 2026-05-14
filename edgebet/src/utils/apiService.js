// ─────────────────────────────────────────────
// utils/apiService.js
// Fetches real fixtures + odds from free APIs
// API-Football: fixtures + team stats
// The Odds API: bookmaker odds
// ─────────────────────────────────────────────

const API_FOOTBALL_KEY = process.env.REACT_APP_API_FOOTBALL_KEY;
const ODDS_API_KEY = process.env.REACT_APP_ODDS_API_KEY;

// ── League IDs on API-Football ────────────────
export const LEAGUE_IDS = {
  Eliteserien: 103,
  Allsvenskan: 113,
  Veikkausliiga: 244,
  Eredivisie: 88,
  BelgianProLeague: 144,
  Bundesliga: 78,
};

// ── Odds API sport keys ───────────────────────
export const ODDS_SPORT_KEYS = {
  Eliteserien: 'soccer_norway_eliteserien',
  Allsvenskan: 'soccer_sweden_allsvenskan',
  Veikkausliiga: 'soccer_finland_veikkausliiga',
  Eredivisie: 'soccer_netherlands_eredivisie',
};

// ── Fetch today's fixtures for a league ───────
export async function fetchFixtures(leagueId) {
  const today = new Date().toISOString().split('T')[0];
  const response = await fetch(
    `https://v3.football.api-sports.io/fixtures?league=${leagueId}&date=${today}&season=${new Date().getFullYear()}`,
    {
      headers: {
        'x-apisports-key': API_FOOTBALL_KEY,
      },
    }
  );
  const data = await response.json();
  return data.response || [];
}

// ── Fetch team stats (last 10 games avg) ──────
export async function fetchTeamStats(teamId, leagueId) {
  const season = new Date().getFullYear();
  const response = await fetch(
    `https://v3.football.api-sports.io/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`,
    {
      headers: {
        'x-apisports-key': API_FOOTBALL_KEY,
      },
    }
  );
  const data = await response.json();
  const stats = data.response;
  if (!stats) return null;

  const played = stats.fixtures?.played?.total || 1;
  const goalsFor = stats.goals?.for?.total?.total || 0;
  const goalsAgainst = stats.goals?.against?.total?.total || 0;

  return {
    avgScored: +(goalsFor / played).toFixed(2),
    avgConceded: +(goalsAgainst / played).toFixed(2),
  };
}

// ── Fetch bookmaker odds for over 2.5 ─────────
export async function fetchOdds(sportKey) {
  const response = await fetch(
    `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=totals&oddsFormat=decimal`
  );
  const data = await response.json();
  return data || [];
}

// ── Parse over 2.5 odds from Odds API response ─
export function extractOver25Odds(oddsData, homeTeam, awayTeam) {
  const match = oddsData.find(
    (m) =>
      m.home_team.toLowerCase().includes(homeTeam.toLowerCase()) ||
      m.away_team.toLowerCase().includes(awayTeam.toLowerCase())
  );
  if (!match) return null;

  for (const bookmaker of match.bookmakers) {
    const totalsMarket = bookmaker.markets.find((m) => m.key === 'totals');
    if (!totalsMarket) continue;
    const over25 = totalsMarket.outcomes.find(
      (o) => o.name === 'Over' && o.point === 2.5
    );
    if (over25) return over25.price;
  }
  return null;
}
