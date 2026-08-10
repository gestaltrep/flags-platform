import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getEventTiers, netPerTicketCents, totalCapacity } from "@/lib/tier";
import {
  getActiveSalesEvent,
  getEventById,
  getEventBySlug,
  getLiveEvent,
  type Event,
} from "@/lib/events";

export const dynamic = "force-dynamic";

/** Venue charges $10 per under-21 admission, for at most 80 of them. */
const UNDER_21_FEE_CENTS = 1000;
const UNDER_21_FEE_MAX_HEADS = 80;
const UNDER_21_FEE_CAP_CENTS = 80000;

function authorized(req: Request): boolean {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return false; // fail closed when unconfigured

  const header = req.headers.get("Authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const pad = (s: string | number, n: number) => String(s).padEnd(n);
const padL = (s: string | number, n: number) => String(s).padStart(n);

export async function GET(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const eventId = url.searchParams.get("event_id");
  const slug = url.searchParams.get("slug");

  let event: Event | null = null;
  if (eventId) event = await getEventById(eventId);
  else if (slug) event = await getEventBySlug(slug);
  else event = (await getActiveSalesEvent()) ?? (await getLiveEvent());

  if (!event) {
    return Response.json(
      { error: "No event selected. Pass ?event_id= or ?slug=." },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const tiers = await getEventTiers(event.id);

  // ── Paid admissions, per tier ────────────────────────────────────────────
  const { data: paidRows } = await supabase
    .from("ticket_codes")
    .select("tier_id")
    .eq("event_id", event.id)
    .eq("comp", false)
    .not("buyer_user_id", "is", null)
    .is("refunded_at", null);

  const soldByTier = new Map<string, number>();
  let untiered = 0;
  for (const row of (paidRows as { tier_id: string | null }[] | null) ?? []) {
    if (row.tier_id) soldByTier.set(row.tier_id, (soldByTier.get(row.tier_id) ?? 0) + 1);
    else untiered += 1;
  }

  const byTier = tiers.map((t) => {
    const sold = soldByTier.get(t.id) ?? 0;
    return {
      name: t.name,
      sortOrder: t.sort_order,
      priceCents: t.price_cents,
      capacity: t.capacity,
      sold,
      remaining: Math.max(0, t.capacity - sold),
      grossCents: t.price_cents * sold,
      netCents: netPerTicketCents(t.price_cents) * sold,
    };
  });

  const totalPaid = byTier.reduce((s, t) => s + t.sold, 0) + untiered;
  const capacity = totalCapacity(tiers);
  const grossCents = byTier.reduce((s, t) => s + t.grossCents, 0);
  const netCents = byTier.reduce((s, t) => s + t.netCents, 0);

  // ── Sales by promo code ──────────────────────────────────────────────────
  // promo_code_uses carries no event_id, so uses are windowed from the event
  // row's creation time. Override with ?since=<ISO8601> if a tighter window is
  // needed. Figures are attributed to this event on that basis only.
  const since = url.searchParams.get("since") || event.created_at;
  const { data: useRows } = await supabase
    .from("promo_code_uses")
    .select("ticket_quantity, amount_paid, amount_saved, created_at, promo_codes(code, label)")
    .gte("created_at", since);

  type UseRow = {
    ticket_quantity: number;
    amount_paid: number;
    amount_saved: number;
    promo_codes: { code: string; label: string | null } | { code: string; label: string | null }[] | null;
  };

  const byCodeMap = new Map<
    string,
    { code: string; label: string | null; uses: number; tickets: number; paidCents: number; savedCents: number }
  >();
  for (const row of (useRows as UseRow[] | null) ?? []) {
    const promo = Array.isArray(row.promo_codes) ? row.promo_codes[0] : row.promo_codes;
    const code = promo?.code ?? "(unknown)";
    const entry = byCodeMap.get(code) ?? {
      code,
      label: promo?.label ?? null,
      uses: 0,
      tickets: 0,
      paidCents: 0,
      savedCents: 0,
    };
    entry.uses += 1;
    entry.tickets += row.ticket_quantity ?? 0;
    entry.paidCents += row.amount_paid ?? 0;
    entry.savedCents += row.amount_saved ?? 0;
    byCodeMap.set(code, entry);
  }
  const byCode = [...byCodeMap.values()].sort((a, b) => b.tickets - a.tickets);

  // ── Under-21 admissions (settlement) ─────────────────────────────────────
  // Every admitted token, comps included.
  const { count: under21 } = await supabase
    .from("ticket_codes")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("claimed", true)
    .eq("admitted_under_21", true);

  const under21Count = under21 ?? 0;
  const venueFeeCents = Math.min(
    Math.min(under21Count, UNDER_21_FEE_MAX_HEADS) * UNDER_21_FEE_CENTS,
    UNDER_21_FEE_CAP_CENTS
  );

  const payload = {
    event: { id: event.id, name: event.name, slug: event.slug, status: event.status },
    salesByTier: byTier,
    untieredPaid: untiered,
    salesByCode: byCode,
    promoWindowSince: since,
    totals: {
      paid: totalPaid,
      capacity,
      remaining: Math.max(0, capacity - totalPaid),
      grossCents,
      netCents,
    },
    under21: {
      admitted: under21Count,
      billableHeads: Math.min(under21Count, UNDER_21_FEE_MAX_HEADS),
      venueFeeCents,
    },
  };

  if (url.searchParams.get("format") === "json") {
    return Response.json(payload);
  }

  const lines: string[] = [];
  lines.push(`${event.name}  [${event.status}]  ${event.slug}`);
  lines.push("=".repeat(72));
  lines.push("");
  lines.push("SALES BY TIER");
  lines.push(
    `  ${pad("TIER", 14)}${padL("PRICE", 9)}${padL("SOLD", 7)}${padL("CAP", 6)}${padL("GROSS", 12)}${padL("NET", 12)}`
  );
  for (const t of byTier) {
    lines.push(
      `  ${pad(t.name, 14)}${padL(usd(t.priceCents), 9)}${padL(t.sold, 7)}${padL(t.capacity, 6)}` +
        `${padL(usd(t.grossCents), 12)}${padL(usd(t.netCents), 12)}`
    );
  }
  if (untiered > 0) {
    lines.push(`  ${pad("(no tier)", 14)}${padL("-", 9)}${padL(untiered, 7)}${padL("-", 6)}${padL("-", 12)}${padL("-", 12)}`);
  }
  lines.push(
    `  ${pad("TOTAL", 14)}${padL("", 9)}${padL(totalPaid, 7)}${padL(capacity, 6)}${padL(usd(grossCents), 12)}${padL(usd(netCents), 12)}`
  );
  lines.push("");
  lines.push(`PAID ${totalPaid} / CAPACITY ${capacity}   (${Math.max(0, capacity - totalPaid)} remaining)`);
  lines.push("");
  lines.push(`SALES BY CODE   (promo uses since ${since})`);
  if (byCode.length === 0) {
    lines.push("  (none)");
  } else {
    lines.push(`  ${pad("CODE", 20)}${padL("USES", 6)}${padL("TICKETS", 9)}${padL("PAID", 12)}${padL("SAVED", 12)}`);
    for (const c of byCode) {
      lines.push(
        `  ${pad(c.code, 20)}${padL(c.uses, 6)}${padL(c.tickets, 9)}${padL(usd(c.paidCents), 12)}${padL(usd(c.savedCents), 12)}`
      );
    }
  }
  lines.push("");
  lines.push("UNDER 21");
  lines.push(`  ADMITTED:        ${under21Count}`);
  lines.push(`  BILLABLE HEADS:  ${Math.min(under21Count, UNDER_21_FEE_MAX_HEADS)}  (capped at ${UNDER_21_FEE_MAX_HEADS})`);
  lines.push(`  IMPLIED FEE:     ${usd(venueFeeCents)}  (max ${usd(UNDER_21_FEE_CAP_CENTS)})`);
  lines.push("");
  lines.push("Net per ticket = price/1.07 - (price*0.029 + $0.30). Prices are tax-inclusive.");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
