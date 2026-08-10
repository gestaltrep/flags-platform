-- 001 — Capacity-gated, config-driven ticket tiers (additive only).
-- Applied to the Supabase project on 2026-08-09.
-- No existing column or row is altered, dropped, or backfilled.

create table if not exists public.ticket_tiers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id),
  name text not null,
  sort_order int not null,
  price_cents int not null,
  capacity int not null,
  created_at timestamptz default now()
);

comment on table public.ticket_tiers is
  'Per-event price/capacity configuration. DB is the single source of truth for tier prices and capacity. Tiers advance on capacity only - never on date.';

alter table public.ticket_codes
  add column if not exists tier_id uuid references public.ticket_tiers(id);

alter table public.ticket_codes
  add column if not exists admitted_under_21 boolean;

comment on column public.ticket_codes.admitted_under_21 is
  'Null until set at check-in. True when the admitted holder selected UNDER 21. Settlement input for the venue under-21 fee.';

create table if not exists public.tier_reservations (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.ticket_tiers(id),
  payment_intent_id text,
  quantity int not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

comment on table public.tier_reservations is
  'Short-lived capacity holds taken at PaymentIntent creation. Rows are deleted on webhook fulfilment or lazily purged once expired.';

create index if not exists ticket_codes_event_id_tier_id_idx
  on public.ticket_codes (event_id, tier_id);

create index if not exists tier_reservations_tier_id_expires_at_idx
  on public.tier_reservations (tier_id, expires_at);

alter table public.ticket_tiers enable row level security;
alter table public.tier_reservations enable row level security;
