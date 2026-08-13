import { timingSafeEqual } from "node:crypto";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  getEventTiers,
  totalCapacity,
  netCents,
  taxableBaseCents,
  estimatedStripeFeeCents,
  TAX_INCLUSIVE_DIVISOR,
} from "@/lib/tier";
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

/** Round only here — every figure is carried unrounded until it is displayed. */
const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const pad = (s: string | number, n: number) => String(s).padEnd(n);
const padL = (s: string | number, n: number) => String(s).padStart(n);

/**
 * Actual Stripe fee per PaymentIntent, in cents, from its balance transaction.
 * Anything that cannot be resolved is simply absent from the map and the caller
 * falls back to the formula for that transaction.
 */
async function actualStripeFees(paymentIntentIds: string[]): Promise<Map<string, number>> {
  const fees = new Map<string, number>();
  if (!process.env.STRIPE_SECRET_KEY || paymentIntentIds.length === 0) return fees;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const CONCURRENCY = 8;

  for (let i = 0; i < paymentIntentIds.length; i += CONCURRENCY) {
    const batch = paymentIntentIds.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (id) => {
        try {
          const pi = await stripe.paymentIntents.retrieve(id, {
            expand: ["latest_charge.balance_transaction"],
          });
          const charge = pi.latest_charge as Stripe.Charge | null;
          const txn = charge?.balance_transaction as Stripe.BalanceTransaction | string | null;
          if (txn && typeof txn !== "string" && typeof txn.fee === "number") {
            fees.set(id, txn.fee);
          }
        } catch (err) {
          // Leave it unresolved; the formula covers this transaction.
          console.error("Stripe fee lookup failed for", id, (err as Error)?.message);
        }
      })
    );
  }

  return fees;
}

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
  // Tickets are grouped by PaymentIntent because the $0.30 is charged once per
  // transaction, not per ticket. A PaymentIntent never spans tiers.
  const { data: paidRows } = await supabase
    .from("ticket_codes")
    .select("id, tier_id, payment_intent_id")
    .eq("event_id", event.id)
    .eq("comp", false)
    .not("buyer_user_id", "is", null)
    .is("refunded_at", null);

  type PaidRow = { id: string; tier_id: string | null; payment_intent_id: string | null };
  const rows = (paidRows as PaidRow[] | null) ?? [];

  const soldByTier = new Map<string, number>();
  // tier id -> transaction key -> tickets in that transaction
  const txByTier = new Map<string, Map<string, number>>();
  let untiered = 0;

  for (const row of rows) {
    if (!row.tier_id) {
      untiered += 1;
      continue;
    }
    soldByTier.set(row.tier_id, (soldByTier.get(row.tier_id) ?? 0) + 1);
    // A ticket with no PaymentIntent is counted as its own transaction so the
    // fixed fee is never silently dropped.
    const key = row.payment_intent_id ?? `no-pi:${row.id}`;
    const perTx = txByTier.get(row.tier_id) ?? new Map<string, number>();
    perTx.set(key, (perTx.get(key) ?? 0) + 1);
    txByTier.set(row.tier_id, perTx);
  }

  // Prefer real Stripe fees; ?fees=formula forces the estimate (forecast parity).
  const forceFormula = url.searchParams.get("fees") === "formula";
  const realPiIds = [...new Set(rows.map((r) => r.payment_intent_id).filter((v): v is string => !!v))];
  const feeByPi = forceFormula ? new Map<string, number>() : await actualStripeFees(realPiIds);

  let txActual = 0;
  let txEstimated = 0;

  const byTier = tiers.map((t) => {
    const sold = soldByTier.get(t.id) ?? 0;
    const perTx = txByTier.get(t.id) ?? new Map<string, number>();
    const grossCents = t.price_cents * sold;

    // Fee per transaction: actual where Stripe resolved it, formula otherwise.
    let feeCents = 0;
    for (const [key, ticketsInTx] of perTx) {
      const actual = feeByPi.get(key);
      if (actual !== undefined) {
        feeCents += actual;
        txActual += 1;
      } else {
        feeCents += estimatedStripeFeeCents(t.price_cents * ticketsInTx, 1);
        txEstimated += 1;
      }
    }

    return {
      name: t.name,
      sortOrder: t.sort_order,
      priceCents: t.price_cents,
      capacity: t.capacity,
      sold,
      transactions: perTx.size,
      remaining: Math.max(0, t.capacity - sold),
      grossCents,
      feeCents,
      netCents: netCents(grossCents, feeCents),
    };
  });

  const totalPaid = byTier.reduce((s, t) => s + t.sold, 0) + untiered;
  const capacity = totalCapacity(tiers);
  const grossCents = byTier.reduce((s, t) => s + t.grossCents, 0);
  const feeCents = byTier.reduce((s, t) => s + t.feeCents, 0);
  const netTotalCents = byTier.reduce((s, t) => s + t.netCents, 0);
  const transactions = byTier.reduce((s, t) => s + t.transactions, 0);

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
      transactions,
      grossCents,
      taxableBaseCents: taxableBaseCents(grossCents),
      feeCents,
      netCents: netTotalCents,
    },
    feeBasis: {
      taxInclusiveDivisor: TAX_INCLUSIVE_DIVISOR,
      transactionsWithActualStripeFees: txActual,
      transactionsEstimatedByFormula: txEstimated,
      forcedFormula: forceFormula,
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
    `  ${pad("TIER", 14)}${padL("PRICE", 9)}${padL("SOLD", 6)}${padL("TXNS", 6)}${padL("CAP", 6)}` +
      `${padL("GROSS", 12)}${padL("FEES", 11)}${padL("NET", 12)}`
  );
  for (const t of byTier) {
    lines.push(
      `  ${pad(t.name, 14)}${padL(usd(t.priceCents), 9)}${padL(t.sold, 6)}${padL(t.transactions, 6)}${padL(t.capacity, 6)}` +
        `${padL(usd(t.grossCents), 12)}${padL(usd(t.feeCents), 11)}${padL(usd(t.netCents), 12)}`
    );
  }
  if (untiered > 0) {
    lines.push(
      `  ${pad("(no tier)", 14)}${padL("-", 9)}${padL(untiered, 6)}${padL("-", 6)}${padL("-", 6)}` +
        `${padL("-", 12)}${padL("-", 11)}${padL("-", 12)}`
    );
  }
  lines.push(
    `  ${pad("TOTAL", 14)}${padL("", 9)}${padL(totalPaid, 6)}${padL(transactions, 6)}${padL(capacity, 6)}` +
      `${padL(usd(grossCents), 12)}${padL(usd(feeCents), 11)}${padL(usd(netTotalCents), 12)}`
  );
  lines.push(
    `  ${pad("", 14)}${padL("", 9)}${padL("", 6)}${padL("", 6)}${padL("taxable base", 6)}` +
      `${padL(usd(taxableBaseCents(grossCents)), 12)}`
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
  lines.push("FEE BASIS");
  lines.push(`  ACTUAL (Stripe balance txn): ${txActual} txn${txActual === 1 ? "" : "s"}`);
  lines.push(`  ESTIMATED (formula):         ${txEstimated} txn${txEstimated === 1 ? "" : "s"}${forceFormula ? "  [forced via ?fees=formula]" : ""}`);
  lines.push("");
  lines.push(`Net = gross/${TAX_INCLUSIVE_DIVISOR} - card fees. Fees are the actual Stripe balance-transaction`);
  lines.push("fee where available, otherwise 2.9% + $0.30 PER TRANSACTION. Prices are");
  lines.push(`tax-inclusive; ${TAX_INCLUSIVE_DIVISOR} is Lee County (6% state + 0.5% surtax). Figures are`);
  lines.push("carried unrounded and rounded only for display.");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
