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
 * Tax-inclusive divisor for the venue's combined admissions rate.
 *
 * Bonita Springs is Lee County: 6% state + 0.5% discretionary surtax (effective
 * 2019-2028 per the 2026 DR-15DSS) = 6.5%. The old 1.07 was Charlotte County,
 * carried over from PGICA. Whether admissions are taxable at all, and the exact
 * DR-15 line treatment, is a Tax & Compliance question — this constant only
 * backs a tax-inclusive price out to its taxable base for reporting.
 */
export const TAX_INCLUSIVE_DIVISOR = 1.065;

/** Stripe standard card pricing: 2.9% + $0.30 per TRANSACTION, not per ticket. */
export const STRIPE_PERCENT_FEE = 0.029;
export const STRIPE_FIXED_FEE_CENTS = 30;

/** Taxable base for a tax-inclusive gross. Unrounded — callers round at display. */
export function taxableBaseCents(grossCents: number): number {
  return grossCents / TAX_INCLUSIVE_DIVISOR;
}

/**
 * Estimated Stripe fee for `transactionCount` charges totalling `grossCents`.
 * Only a fallback: prefer the actual balance-transaction fee when Stripe can be
 * reached. Unrounded.
 */
export function estimatedStripeFeeCents(grossCents: number, transactionCount: number): number {
  return grossCents * STRIPE_PERCENT_FEE + STRIPE_FIXED_FEE_CENTS * transactionCount;
}

/**
 * Reference net, in cents: taxable base minus card fees. Pass actual fees when
 * available. No intermediate rounding anywhere in this chain.
 */
export function netCents(grossCents: number, feeCents: number): number {
  return taxableBaseCents(grossCents) - feeCents;
}
