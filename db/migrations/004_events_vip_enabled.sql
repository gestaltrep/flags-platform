-- 004 — Per-event VIP switch. Applied 2026-08-10.
-- Additive: nullable column with a false default. Event one keeps its VIP
-- surfaces; event two has no VIP tier, so its VIP UI never renders.

alter table public.events
  add column if not exists vip_enabled boolean default false;

comment on column public.events.vip_enabled is
  'When true the VIP purchase surfaces render for this event. Event one had VIP; event two does not.';

update public.events set vip_enabled = true  where id = 'd61cd74b-a259-4c80-b280-446850b4723b';
update public.events set vip_enabled = false where id = 'f8850950-1658-48d2-9952-c9c33fd14d23';
