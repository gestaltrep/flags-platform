-- 002 — Atomic, all-or-nothing capacity reservation within a single tier.
-- Applied to the Supabase project on 2026-08-09.
--
-- Serialization: the tier row is taken FOR UPDATE in sort_order before any
-- counting happens, so two buyers racing for the same last seat queue on that
-- row lock. Under READ COMMITTED the loser re-reads the committed counts after
-- the lock is released and either rolls to the next tier or gets nothing.
-- Locking in sort_order gives every caller the same lock order, so tier
-- rollover cannot deadlock.
--
-- `remaining` is availability in the active tier *before* this call's hold, in
-- both the granted and the refused branch. The refused branch is what feeds the
-- buyer-facing "only N remain at this price" message.

create or replace function public.reserve_ga_capacity(
  p_event_id uuid,
  p_qty int,
  p_payment_intent_id text,
  p_ttl_seconds int
)
returns table (
  tier_id uuid,
  price_cents int,
  reserved_qty int,
  remaining int,
  reservation_id uuid
)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  t          record;
  v_paid     int;
  v_reserved int;
  v_left     int;
  v_res_id   uuid;
begin
  if p_qty is null or p_qty < 1 then
    raise exception 'reserve_ga_capacity: p_qty must be >= 1';
  end if;

  -- 1. Drop expired holds for this event's tiers so their seats are re-counted.
  delete from tier_reservations r
  using ticket_tiers tt
  where r.tier_id = tt.id
    and tt.event_id = p_event_id
    and r.expires_at <= now();

  -- 2. Walk tiers cheapest-first, locking each row before counting against it.
  for t in
    select tt.id, tt.price_cents, tt.capacity
    from ticket_tiers tt
    where tt.event_id = p_event_id
    order by tt.sort_order
    for update
  loop
    select count(*) into v_paid
    from ticket_codes tc
    where tc.tier_id = t.id
      and tc.comp = false
      and tc.refunded_at is null
      and tc.buyer_user_id is not null;

    select coalesce(sum(r.quantity), 0) into v_reserved
    from tier_reservations r
    where r.tier_id = t.id
      and r.expires_at > now();

    v_left := t.capacity - (v_paid + v_reserved);

    if v_left > 0 then
      -- 3. First tier with room is the active tier. All-or-nothing inside it;
      --    a reservation never spans tiers.
      if p_qty <= v_left then
        insert into tier_reservations (tier_id, payment_intent_id, quantity, expires_at)
        values (t.id, p_payment_intent_id, p_qty, now() + make_interval(secs => p_ttl_seconds))
        returning id into v_res_id;

        tier_id        := t.id;
        price_cents    := t.price_cents;
        reserved_qty   := p_qty;
        remaining      := v_left;
        reservation_id := v_res_id;
      else
        tier_id        := t.id;
        price_cents    := t.price_cents;
        reserved_qty   := 0;
        remaining      := v_left;
        reservation_id := null;
      end if;

      return next;
      return;
    end if;
  end loop;

  -- 4. Every tier is full: hard stop.
  tier_id        := null;
  price_cents    := null;
  reserved_qty   := 0;
  remaining      := 0;
  reservation_id := null;
  return next;
  return;
end;
$$;

-- Only the server (service role) may take capacity holds.
revoke all on function public.reserve_ga_capacity(uuid, int, text, int) from public;
revoke all on function public.reserve_ga_capacity(uuid, int, text, int) from anon, authenticated;
grant execute on function public.reserve_ga_capacity(uuid, int, text, int) to service_role;
