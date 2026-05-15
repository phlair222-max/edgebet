// ─────────────────────────────────────────────
// utils/apiService.js
// Uses football-data.org — free, current season
// ─────────────────────────────────────────────

export const ENV = {
  export const ENV = {
  footballData: process.env.REACT_APP_FOOTBALLDATA_KEY || '36f65f997b7c4e698fe90b8741745505',
  oddsApi: process.env.REACT_APP_ODDS_API_KEY || '',
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL || '',
  supabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
};

export function logEnvStatus() {
  console.group('EdgeBet — Environment Variables');
  console.log('FOOTBALLDATA_KEY:', ENV.footballData ? `✅ loaded (${ENV.footballData.slice(0,8)}...)` : '❌ MISSING');
  console.log('ODDS_API_KEY:', ENV.oddsApi ? `✅ loaded` : '❌ MISSING');
  console.log('SUPABASE_URL:', ENV.supabaseUrl ? '✅ loaded' : '❌ MISSING');
  console.log('SUPABASE_KEY:', ENV.supabaseKey ? '✅ loaded' : '❌ MISSING');
  console.groupEnd();
}

export const LEAGUES = [
  { name: 'Eredivisie', code: 'DED' },
  { name: 'Bundesliga', code: 'BL1' },
  { name: 'Ligue 1', code: 'FL1' },
  { name: 'Championship', code: 'ELC' },
];

function today() {
  return new Date().toISOString().split('T')[0];
}

async function fetchFixturesForLeague(code, leagueName) {
  if (!ENV.footballData) throw new Error('No API key');

  const url = `https://api.football-data.org/v4/matches?competitions=${code}&dateFrom=${today()}&dateTo=${today()}`;
  console.log(`Fetching ${leagueName}...`, url);

  const res = await fetch(url, {
    headers: { 'X-Auth-Token': ENV.footballData },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const data = await res.json();
  console.log(`${leagueName}: ${data.matches?.length || 0} fixtures`);
  return data.matches || [];
}

async function fetchTeamRecentForm(teamId) {
  if (!ENV.footballData) return null;
  try {
    const res = await fetch(
      `https://api.football-data.org/v4/teams/${teamId}/matches?status=FINISHED&limit=10`,
      { headers: { 'X-Auth-Token': ENV.footballData } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const matches = data.matches || [];
    if (matches.length === 0) return null;

    let scored = 0;
    let conceded = 0;

    matches.forEach((m) => {
      const isHome = m.homeTeam?.id === teamId;
      const homeGoals = m.score?.fullTime?.home ?? 0;
      const awayGoals = m.score?.fullTime?.away ?? 0;
      if (isHome) {
        scored += homeGoals;
        conceded += awayGoals;
      } else {
        scored += awayGoals;
        conceded += homeGoals;
      }
    });

    return {
      avgScored: +(scored / matches.length).toFixed(2),
      avgConceded: +(conceded / matches.length).toFixed(2),
    };
  } catch {
    return null;
  }
}

function transformMatch(match, leagueName, homeStats, awayStats) {
  const home = match.homeTeam?.name;
  const away = match.awayTeam?.name;
  if (!home || !away) return null;

  const kickoff = match.utcDate
    ? new Date(match.utcDate).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--';

  return {
    id: match.id,
    home,
    away,
    league: leagueName,
    time: kickoff,
    homeAvgScored: homeStats?.avgScored ?? 1.5,
    homeAvgConceded: homeStats?.avgConceded ?? 1.2,
    awayAvgScored: awayStats?.avgScored ?? 1.2,
    awayAvgConceded: awayStats?.avgConceded ?? 1.5,
    bookOdds: 1.85,
    homeTeamId: match.homeTeam?.id,
    awayTeamId: match.awayTeam?.id,
  };
}

export async function fetchTodaysFixtures(enabledLeagues = {}) {
  const results = [];
  const errors = [];

  if (!ENV.footballData) {
    return {
      fixtures: [],
      errors: [{ league: 'All', error: 'No API key — add REACT_APP_FOOTBALLDATA_KEY in Vercel' }],
    };
  }

  for (const league of LEAGUES) {
    if (enabledLeagues[league.name] === false) continue;

    try {
      const matches = await fetchFixturesForLeague(league.code, league.name);

      // Fetch team form for each match in parallel
      const enriched = await Promise.all(
        matches.map(async (m) => {
          const [homeStats, awayStats] = await Promise.all([
            fetchTeamRecentForm(m.homeTeam?.id),
            fetchTeamRecentForm(m.awayTeam?.id),
          ]);
          return transformMatch(m, league.name, homeStats, awayStats);
        })
      );

      results.push(...enriched.filter(Boolean));
    } catch (err) {
      console.error(`Failed ${league.name}:`, err.message);
      errors.push({ league: league.name, error: err.message });
    }
  }

  return { fixtures: results, errors };
}

export async function checkApiStatus() {
  const status = {
    footballData: { present: !!ENV.footballData, working: false, error: null },
    oddsApi: { present: !!ENV.oddsApi, working: false, error: null },
    supabase: {
      present: !!(ENV.supabaseUrl && ENV.supabaseKey),
      working: false,
      error: null,
    },
  };

  if (ENV.footballData) {
    try {
      const res = await fetch('https://api.football-data.org/v4/competitions', {
        headers: { 'X-Auth-Token': ENV.footballData },
      });
      if (res.ok) {
        status.footballData.working = true;
      } else {
        status.footballData.error = `HTTP ${res.status} — check your key`;
      }
    } catch (e) {
      status.footballData.error = e.message;
    }
  }

  if (ENV.oddsApi) {
    try {
      const res = await fetch(
        `https://api.the-odds-api.com/v4/sports/?apiKey=${ENV.oddsApi}`
      );
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
