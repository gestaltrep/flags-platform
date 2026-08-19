-- 006 — promo_code_uses.event_id. Applied 2026-08-19 directly in Supabase.
--
-- Recorded here so the repo matches the database. Every statement is
-- IF NOT EXISTS, so re-applying this file against production is a no-op: the
-- column and both indexes already exist there.
--
-- Before this, a redemption could only be tied to an event by its created_at
-- falling inside that event's sales window. That is an inference, not a fact,
-- and it breaks as soon as two events sell at once. event_id records it.
--
-- Nullable on purpose. The write-time stamp in the stripe webhook is new and
-- unproven by a live purchase, and the reporting queries still fall back to
-- the created_at window for rows where event_id is null, so a null must stay
-- legal. NOT NULL belongs in a later migration, once a real purchase has been
-- seen to arrive stamped.
--
-- The 76 pre-existing rows were backfilled to event one separately; this file
-- deliberately contains no backfill, so running it cannot restamp anything.

alter table promo_code_uses
  add column if not exists event_id uuid references events(id);

-- Reporting filters on event_id alone (sales by event).
create index if not exists promo_code_uses_event_idx
  on promo_code_uses (event_id);

-- Kickback payout groups by code within one event.
create index if not exists promo_code_uses_code_event_idx
  on promo_code_uses (promo_code_id, event_id);
