export const ENV = {
  footballData: process.env.REACT_APP_FOOTBALLDATA_KEY || '36f65f997b7c4e698fe90b8741745505',
  oddsApi: process.env.REACT_APP_ODDS_API_KEY || '',
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL || '',
  supabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
};

export function logEnvStatus() {
  console.group('EdgeBet — Environment Variables');
  console.log('FOOTBALLDATA_KEY:', ENV.footballData ? '✅ loaded' : '❌ MISSING');
  console.log('ODDS_API_KEY:', ENV.oddsApi ? '✅ loaded' : '❌ MISSING');
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
  const url = '/api/fixtures?competitions=' + code + '&dateFrom=' + today() + '&dateTo=' + today();
  console.log('Fetching ' + leagueName + '...', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
  const data = await res.json();
  console.log(leagueName + ': ' + (data.matches ? data.matches.length : 0) + ' fixtures');
  return data.matches || [];
}

function transformMatch(match, leagueName) {
  var home = match.homeTeam && match.homeTeam.name;
  var away = match.awayTeam && match.awayTeam.name;
  if (!home || !away) return null;
  var kickoff = '--:--';
  if (match.utcDate) {
    kickoff = new Date(match.utcDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  return {
    id: match.id,
    home: home,
    away: away,
    league: leagueName,
    time: kickoff,
    homeAvgScored: 1.5,
    homeAvgConceded: 1.2,
    awayAvgScored: 1.2,
    awayAvgConceded: 1.5,
    bookOdds: 1.85,
  };
}

export async function fetchTodaysFixtures(enabledLeagues) {
  var results = [];
  var errors = [];
  if (!enabledLeagues) enabledLeagues = {};

  if (!ENV.footballData) {
    return { fixtures: [], errors: [{ league: 'All', error: 'No API key' }] };
  }

  for (var i = 0; i < LEAGUES.length; i++) {
    var league = LEAGUES[i];
    if (enabledLeagues[league.name] === false) continue;
    try {
      var matches = await fetchFixturesForLeague(league.code, league.name);
      var enriched = matches.map(function(m) { return transformMatch(m, league.name); });
      var valid = enriched.filter(function(x) { return x !== null; });
      results = results.concat(valid);
    } catch (err) {
      console.error('Failed ' + league.name + ':', err.message);
      errors.push({ league: league.name, error: err.message });
    }
  }

  return { fixtures: results, errors: errors };
}

export async function checkApiStatus() {
  var status = {
    footballData: { present: !!ENV.footballData, working: false, error: null },
    oddsApi: { present: !!ENV.oddsApi, working: false, error: null },
    supabase: { present: !!(ENV.supabaseUrl && ENV.supabaseKey), working: false, error: null },
  };

  if (ENV.footballData) {
    try {
      var res = await fetch('/api/fixtures?competitions=DED&dateFrom=' + today() + '&dateTo=' + today());
      if (res.ok) {
        status.footballData.working = true;
      } else {
        status.footballData.error = 'HTTP ' + res.status;
      }
    } catch (e) {
      status.footballData.error = e.message;
    }
  }

  return status;
}
