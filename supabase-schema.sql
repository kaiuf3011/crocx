-- CrocX Command Console — Supabase Schema
-- Run this in the Supabase SQL Editor

-- Telemetry readings
create table if not exists telemetry (
  id bigint generated always as identity primary key,
  sensor_id text not null,
  value numeric not null,
  unit text not null,
  status text not null default 'nominal',
  created_at timestamptz not null default now()
);

-- Anomaly events
create table if not exists anomalies (
  id bigint generated always as identity primary key,
  sensor_id text not null,
  drift numeric not null,
  severity text not null default 'low',
  description text,
  created_at timestamptz not null default now()
);

-- Risk state snapshots
create table if not exists risk_events (
  id bigint generated always as identity primary key,
  score numeric not null,
  persistence numeric not null default 1.0,
  anomaly_pct numeric not null default 0,
  status text not null default 'nominal',
  created_at timestamptz not null default now()
);

-- Alerts
create table if not exists alerts (
  id bigint generated always as identity primary key,
  type text not null,
  message text not null,
  severity text not null default 'info',
  acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable realtime
alter publication supabase_realtime add table telemetry;
alter publication supabase_realtime add table anomalies;
alter publication supabase_realtime add table risk_events;
alter publication supabase_realtime add table alerts;

-- Row-Level Security
alter table telemetry enable row level security;
alter table anomalies enable row level security;
alter table risk_events enable row level security;
alter table alerts enable row level security;

create policy "Allow read access" on telemetry for select using (true);
create policy "Allow read access" on anomalies for select using (true);
create policy "Allow read access" on risk_events for select using (true);
create policy "Allow read access" on alerts for select using (true);
