// ─────────────────────────────────────────────
// utils/apiService.js
// Real API calls — API-Football + The Odds API
// ─────────────────────────────────────────────

export const ENV = {
  apiFootball: process.env.REACT_APP_API_FOOTBALL_KEY || '',
  oddsApi: process.env.REACT_APP_ODDS_API_KEY || '',
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL || '',
  supabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
};

export function logEnvStatus() {
  console.group('EdgeBet — Environment Variables');
  console.log('API_FOOTBALL_KEY:', ENV.apiFootball ? `✅ loaded (${ENV.apiFootball.slice(0,8)}...)` : '❌ MISSING');
  console.log('ODDS_API_KEY:', ENV.oddsApi ? `✅ loaded (${ENV.oddsApi.slice(0,8)}...)` : '❌ MISSING');
  console.log('SUPABASE_URL:', ENV.supabaseUrl ? '✅ loaded' : '❌ MISSING');
  console.log('SUPABASE_KEY:', ENV.supabaseKey ? '✅ loaded' : '❌ MISSING');
  console.groupEnd();
}

export const LEAGUES = [
  { name: 'Eliteserien', id: 103, country: 'Norway' },
  { name: 'Allsvenskan', id: 113, country: 'Sweden' },
  { name: 'Veikkausliiga', id: 244, country: 'Finland' },
  { name: 'Eredivisie', id: 88, country: 'Netherlands' },
];

export const ODDS_KEYS = {
  Eliteserien: 'soccer_norway_eliteserien',
  Allsvenskan: 'soccer_sweden_allsvenskan',
  Veikkausliiga: 'soccer_finland_veikkausliiga',
  Eredivisie: 'soccer_netherlands_eredivisie',
};

function today() {
  return new Date().toISOString().split('T')[0];
}

function season() {
  return new Date().getFullYear();
}

export async function fetchFixturesForLeague(leagueId, leagueName) {
  if (!ENV.apiFootball) {
    throw new Error(`API-Football key missing`);
  }
  const url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&date=${today()}&season=${season()}`;
  console.log(`Fetching ${leagueName}...`, url);
  const res = await fetch(url, {
    headers: { 'x-apisports-key': ENV.apiFootball },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(JSON.stringify(data.errors));
  }
  console.log(`${leagueName}: ${data.response?.length || 0} fixtures`);
  return data.response || [];
}

export async function fetchTeamStats(teamId, leagueId) {
  if (!ENV.apiFootball) return null;
  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/teams/statistics?team=${teamId}&league=${leagueId}&season=${season()}`,
      { headers: { 'x-apisports-key': ENV.apiFootball } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const s = data.response;
    if (!s) return null;
    const played = s.fixtures?.played?.total || 1;
    return {
      avgScored: +(( s.goals?.for?.total?.total || 0) / played).toFixed(2),
      avgConceded: +((s.goals?.against?.total?.total || 0) / played).toFixed(2),
    };
  } catch { return null; }
}

export async function fetchOver25Odds(sportKey) {
  if (!ENV.oddsApi) return [];
  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${ENV.oddsApi}&regions=eu&markets=totals&oddsFormat=decimal`
    );
    if (!res.ok) return [];
    return await res.json() || [];
  } catch { return []; }
}

export function extractOver25Odds(oddsData, homeTeam, awayTeam) {
  if (!oddsData?.length) return null;
  const match = oddsData.find((m) => {
    const h = m.home_team?.toLowerCase() || '';
    const a = m.away_team?.toLowerCase() || '';
    return h.includes(homeTeam.toLowerCase().split(' ')[0]) ||
           a.includes(awayTeam.toLowerCase().split(' ')[0]);
  });
  if (!match) return null;
  for (const bk of match.bookmakers || []) {
    const market = bk.markets?.find((m) => m.key === 'totals');
    const over = market?.outcomes?.find((o) => o.name === 'Over' && o.point === 2.5);
    if (over) return over.price;
  }
  return null;
}

export async function transformFixture(apiFixture, leagueName) {
  const home = apiFixture.teams?.home;
  const away = apiFixture.teams?.away;
  const leagueId = apiFixture.league?.id;
  if (!home || !away) return null;

  const [homeStats, awayStats] = await Promise.all([
    fetchTeamStats(home.id, leagueId),
    fetchTeamStats(away.id, leagueId),
  ]);

  const kickoff = apiFixture.fixture?.date
    ? new Date(apiFixture.fixture.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return {
    id: apiFixture.fixture?.id,
    home: home.name,
    away: away.name,
    league: leagueName,
    time: kickoff,
    homeAvgScored: homeStats?.avgScored ?? 1.4,
    homeAvgConceded: homeStats?.avgConceded ?? 1.2,
    awayAvgScored: awayStats?.avgScored ?? 1.2,
    awayAvgConceded: awayStats?.avgConceded ?? 1.4,
    bookOdds: 1.85,
    leagueId,
  };
}

export async function fetchTodaysFixtures(enabledLeagues = {}) {
  const results = [];
  const errors = [];

  for (const league of LEAGUES) {
    if (enabledLeagues[league.name] === false) continue;
    try {
      const fixtures = await fetchFixturesForLeague(league.id, league.name);
      const transformed = await Promise.all(
        fixtures.map((f) => transformFixture(f, league.name))
      );
      const valid = transformed.filter(Boolean);

      if (ENV.oddsApi && ODDS_KEYS[league.name]) {
        try {
          const oddsData = await fetchOver25Odds(ODDS_KEYS[league.name]);
          valid.forEach((fix) => {
            const odds = extractOver25Odds(oddsData, fix.home, fix.away);
            if (odds) fix.bookOdds = odds;
          });
        } catch (e) {
          console.warn(`Odds fetch failed for ${league.name}:`, e.message);
        }
      }

      results.push(...valid);
    } catch (err) {
      console.error(`Failed ${league.name}:`, err.message);
      errors.push({ league: league.name, error: err.message });
    }
  }

  return { fixtures: results, errors };
}

export async function checkApiStatus() {
  const status = {
    apiFootball: { present: !!ENV.apiFootball, working: false, error: null },
    oddsApi: { present: !!ENV.oddsApi, working: false, error: null },
    supabase: { present: !!(ENV.supabaseUrl && ENV.supabaseKey), working: false, error: null },
  };

  if (ENV.apiFootball) {
    try {
      const res = await fetch('https://v3.football.api-sports.io/status', {
        headers: { 'x-apisports-key': ENV.apiFootball },
      });
      const data = await res.json();
      if (data.response?.account) {
        status.apiFootball.working = true;
        status.apiFootball.requestsToday = data.response.requests?.current;
        status.apiFootball.requestsLimit = data.response.requests?.limit_day;
      } else {
        status.apiFootball.error = 'Invalid key or no account found';
      }
    } catch (e) {
      status.apiFootball.error = e.message;
    }
  }

  if (ENV.oddsApi) {
    try {
      const res = await fetch(`https://api.the-odds-api.com/v4/sports/?apiKey=${ENV.oddsApi}`);
      if (res.ok) {
        status.oddsApi.working = true;
        status.oddsApi.requestsRemaining = res.headers.get('x-requests-remaining');
      } else {
        status.oddsApi.error = `HTTP ${res.status}`;
      }
    } catch (e) {
      status.oddsApi.error = e.message;
    }
  }

  return status;
}
