import { createClient } from "@supabase/supabase-js";

/**
 * Tiers are capacity-gated and configured in the database. There is no date
 * logic and no hardcoded price anywhere in this module: ticket_tiers is the
 * single source of truth for both price and capacity.
 *
 * Prices are tax-inclusive. Nothing is ever added at checkout.
 */
export type TicketTier = {
  id: string;
  event_id: string;
  name: string;
  sort_order: number;
  price_cents: number;
  capacity: number;
  created_at: string;
};

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Every tier configured for an event, cheapest-first. */
export async function getEventTiers(eventId: string): Promise<TicketTier[]> {
  const { data } = await admin()
    .from("ticket_tiers")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  return (data as TicketTier[] | null) ?? [];
}

/** Sum of every tier's capacity — the hard ceiling on paid admissions. */
export function totalCapacity(tiers: TicketTier[]): number {
  return tiers.reduce((sum, t) => sum + t.capacity, 0);
}

/**
 * Reference net-per-ticket for reporting only, in cents:
 *   price / 1.07  -  (price * 0.029 + $0.30)
 *
 * The 1.07 divisor backs the tax-inclusive price out to the taxable base; the
 * remainder is the card fee. This never touches what a buyer is charged.
 */
export function netPerTicketCents(priceCents: number): number {
  return Math.round(priceCents / 1.07 - (priceCents * 0.029 + 30));
}

/** Reference net for n tickets at a given tier price, in cents. */
export function netForTicketsCents(priceCents: number, count: number): number {
  return netPerTicketCents(priceCents) * count;
}
