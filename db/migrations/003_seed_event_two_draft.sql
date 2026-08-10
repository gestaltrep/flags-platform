-- 003 — Seed event two as a draft. Applied 2026-08-09.
--
-- status='draft' keeps it invisible to getActiveSalesEvent() and every public
-- list. sales_open_at is deliberately not set and the status is deliberately
-- not flipped to 'upcoming' — that is a separate, later step.
--
-- The three tiers below are PROVISIONAL placeholders, to be confirmed when
-- capacity papers land. Prices are tax-inclusive.

insert into events (name, slug, status, location, start_time)
values ('RAVE_Exp_1.html', 'rave-exp-1-2026-09', 'draft', null, null);

insert into ticket_tiers (event_id, name, sort_order, price_cents, capacity)
select e.id, v.name, v.sort_order, v.price_cents, v.capacity
from events e,
     (values
       ('Phase 1', 1, 3500, 50),
       ('Phase 2', 2, 4700, 100),
       ('Phase 3', 3, 5900, 50)
     ) as v(name, sort_order, price_cents, capacity)
where e.slug = 'rave-exp-1-2026-09';
