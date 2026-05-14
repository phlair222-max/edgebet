# EdgeBet — Football Value Bet Scanner

A personal football betting tool that uses the Poisson distribution model to find value bets in Scandinavian and Dutch leagues.

**The goal:** Identify when bookmaker odds are statistically mispriced — not predict winners.

---

## How It Works

1. Pulls today's fixtures from target leagues
2. Calculates expected goals using team attack/defense strength
3. Converts to Over 2.5 probability using Poisson distribution
4. Compares your model probability vs bookmaker implied probability
5. Flags bets where the gap (EV) exceeds your threshold
6. Kelly formula calculates the correct stake size

---

## Project Structure

```
edgebet/
├── src/
│   ├── components/
│   │   ├── DailyBets.jsx       ← Home screen, value bet cards
│   │   ├── BetLogger.jsx       ← Log your bets + bet history
│   │   ├── Dashboard.jsx       ← ROI charts and stats
│   │   └── Settings.jsx        ← Bankroll, Kelly, league toggles
│   ├── utils/
│   │   ├── poissonModel.js     ← Core maths (Poisson + EV + Kelly)
│   │   ├── supabaseClient.js   ← Database connection
│   │   └── apiService.js       ← API-Football + The Odds API
│   ├── hooks/
│   │   ├── useSettings.js      ← Settings state + localStorage
│   │   └── useBets.js          ← Bet logging + stats
│   ├── data/
│   │   └── mockFixtures.js     ← Sample data for development
│   ├── App.jsx                 ← Root component + navigation
│   └── App.css                 ← Global dark theme styles
├── supabase_schema.sql         ← Run this in Supabase SQL editor
├── .env.example                ← Copy to .env.local and fill in keys
└── package.json
```

---

## Setup Instructions

### Step 1 — Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/edgebet.git
cd edgebet
npm install
```

### Step 2 — Get your free API keys

| Service | URL | Free tier |
|---------|-----|-----------|
| API-Football | https://api-football.com | 100 calls/day |
| The Odds API | https://the-odds-api.com | 500 calls/month |
| Supabase | https://supabase.com | Free forever |

### Step 3 — Set up environment variables

```bash
cp .env.example .env.local
```

Then fill in your keys in `.env.local`.

### Step 4 — Set up Supabase database

1. Create a free project at supabase.com
2. Go to SQL Editor
3. Paste contents of `supabase_schema.sql` and run it

### Step 5 — Run locally

```bash
npm start
```

---

## Deploying to Vercel

1. Push code to GitHub
2. Go to vercel.com → New Project → Import from GitHub
3. Add environment variables in Vercel dashboard (same as .env.local)
4. Deploy — Vercel auto-deploys on every git push

---

## Connecting to Lovable

1. Push this code to a GitHub repo
2. In Lovable → click "Import from GitHub"
3. Paste your repo URL
4. Lovable will load the existing code and you can continue building

Tell Lovable:
> "This is my existing EdgeBet app. Continue building — connect the Supabase hooks in useBets.js and useSettings.js, and wire up the real API calls in apiService.js to replace the mock fixtures."

---

## Target Leagues

| League | Country | Why |
|--------|---------|-----|
| Eliteserien | Norway | High goals, weak bookmaker modeling |
| Allsvenskan | Sweden | Predictable styles, good data |
| Veikkausliiga | Finland | Less efficient odds |
| Eredivisie | Netherlands | Very high scoring, attacking football |

**Start with Eliteserien Over 2.5 only.** Add leagues only after 3 months of positive data.

---

## The Math

### Expected Goals
```
HomeExpectedGoals = (HomeAvgScored / LeagueAvg) × (AwayAvgConceded / LeagueAvg) × LeagueAvg
```

### Expected Value
```
EV = (MyProbability × (Odds - 1)) - (1 - MyProbability)
```

### Kelly Criterion
```
Stake = Bankroll × KellyFraction × ((Odds - 1) × p - (1 - p)) / (Odds - 1)
```

Only bet when EV is positive. Use 0.25 Kelly fraction as a beginner.

---

## Disclaimer

This tool is for personal research and education. It does not guarantee profit. Betting involves risk. Always bet within your means. Start with paper trading for at least 4-6 weeks before risking real money.
