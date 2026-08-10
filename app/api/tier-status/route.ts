import { createClient } from "@supabase/supabase-js";
import { getEventTiers, totalCapacity } from "@/lib/tier";
import { getActiveSalesEvent } from "@/lib/events";

/**
 * Public published-counts endpoint.
 *
 * Counts are paid admissions only (comp=false, not refunded, buyer set), so the
 * published numbers never jitter with transient checkout holds. Capacity gating
 * for an actual purchase is decided by reserve_ga_capacity, which does account
 * for live holds.
 */
export async function GET() {
  const event = await getActiveSalesEvent();
  if (!event) {
    return Response.json({
      tiers: [],
      activeTierId: null,
      activeTierSortOrder: null,
      totalPaid: 0,
      totalCapacity: 0,
      soldOut: false,
      vipSold: 0,
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const tiers = await getEventTiers(event.id);

  const { data: paidRows } = await supabase
    .from("ticket_codes")
    .select("tier_id")
    .eq("event_id", event.id)
    .eq("comp", false)
    .not("buyer_user_id", "is", null)
    .is("refunded_at", null);

  const soldByTier = new Map<string, number>();
  for (const row of (paidRows as { tier_id: string | null }[] | null) ?? []) {
    if (!row.tier_id) continue;
    soldByTier.set(row.tier_id, (soldByTier.get(row.tier_id) ?? 0) + 1);
  }

  const tierStatus = tiers.map((t) => {
    const sold = soldByTier.get(t.id) ?? 0;
    return {
      id: t.id,
      name: t.name,
      sortOrder: t.sort_order,
      priceCents: t.price_cents,
      capacity: t.capacity,
      sold,
      remaining: Math.max(0, t.capacity - sold),
    };
  });

  // Active tier: lowest sort_order with room left.
  const active = tierStatus.find((t) => t.remaining > 0) ?? null;

  const { count: vipCount } = await supabase
    .from("ticket_codes")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("is_vip", true)
    .eq("comp", false)
    .not("buyer_user_id", "is", null)
    .is("refunded_at", null);

  const totalPaid = tierStatus.reduce((sum, t) => sum + t.sold, 0);
  const capacity = totalCapacity(tiers);

  return Response.json({
    tiers: tierStatus.map((t) => ({ ...t, active: active?.id === t.id })),
    activeTierId: active?.id ?? null,
    activeTierSortOrder: active?.sortOrder ?? null,
    totalPaid,
    totalCapacity: capacity,
    soldOut: tiers.length > 0 && active === null,
    vipSold: vipCount ?? 0,
  });
}
