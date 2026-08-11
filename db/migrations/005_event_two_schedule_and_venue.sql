-- 005 — Event two schedule and venue. Applied 2026-08-10.
--
-- Scoped by id to the draft event only. name, slug, status and the sales
-- window (sales_open_at / sales_close_at) are untouched, and no other event
-- row is read or written.
--
-- Doors 8:00 PM Saturday 2026-09-26 America/New_York, close 2:00 AM the
-- FOLLOWING day. Stored as timestamptz, i.e. 2026-09-27T00:00Z / 06:00Z.

update public.events
set start_time = timestamptz '2026-09-26 20:00:00-04:00',
    end_time   = timestamptz '2026-09-27 02:00:00-04:00',
    location   = 'Disco Bean Coffee Company'
where id = 'f8850950-1658-48d2-9952-c9c33fd14d23';
