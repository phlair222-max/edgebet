-- ─────────────────────────────────────────────
-- EdgeBet Supabase Schema
-- Run this in your Supabase SQL editor
-- supabase.com > your project > SQL editor
-- ─────────────────────────────────────────────

-- Bets table — stores every logged bet
create table bets (
  id          bigint generated always as identity primary key,
  created_at  timestamp with time zone default now(),
  date        date not null default current_date,
  match       text not null,
  league      text not null,
  market      text not null default 'Over 2.5',
  odds        numeric(5,2) not null,
  stake       numeric(10,2) not null,
  result      text not null default 'Pending' check (result in ('Pending','Won','Lost')),
  profit_loss numeric(10,2) default 0
);

-- Settings table — one row per user (when auth is added)
create table settings (
  id              bigint generated always as identity primary key,
  updated_at      timestamp with time zone default now(),
  bankroll        numeric(12,2) default 50000,
  kelly_fraction  numeric(4,2) default 0.25,
  min_ev          numeric(4,1) default 5.0,
  leagues_enabled jsonb default '{"Eliteserien":true,"Allsvenskan":true,"Veikkausliiga":true,"Eredivisie":true}'::jsonb
);

-- Row Level Security (enable when you add auth)
-- alter table bets enable row level security;
-- alter table settings enable row level security;

-- Sample data to test the schema
insert into bets (match, league, market, odds, stake, result, profit_loss) values
  ('Bodø/Glimt vs Tromsø', 'Eliteserien', 'Over 2.5', 1.95, 1500, 'Won', 1425),
  ('Malmö FF vs Djurgården', 'Allsvenskan', 'Over 2.5', 1.90, 1200, 'Lost', -1200),
  ('Ajax vs PSV', 'Eredivisie', 'Over 2.5', 1.70, 1800, 'Won', 1260),
  ('Rosenborg vs Viking', 'Eliteserien', 'Over 2.5', 1.80, 1000, 'Pending', 0);
