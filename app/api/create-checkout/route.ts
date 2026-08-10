import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getActiveSalesEvent } from "@/lib/events";
import { getVerifiedUserId } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/** How long a reserved seat is held while the buyer completes payment. */
const RESERVATION_TTL_SECONDS = 900;

export async function POST(req: Request) {
  try {
    const userId = await getVerifiedUserId();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: knownUser } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    ).from("users").select("id").eq("id", userId).maybeSingle();
    if (!knownUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const event = await getActiveSalesEvent();
    if (!event) {
      return Response.json(
        { error: "No event currently on sale." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const quantity = Math.max(1, Math.min(10, Number(body.quantity || 1)));
    const promoCode: string | undefined = body.promoCode;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Capacity gate. One atomic call picks the active tier, holds the seats
    // all-or-nothing within that single tier, and never spans tiers.
    const { data: reservationRows, error: reserveError } = await supabase.rpc(
      "reserve_ga_capacity",
      {
        p_event_id: event.id,
        p_qty: quantity,
        p_payment_intent_id: null,
        p_ttl_seconds: RESERVATION_TTL_SECONDS,
      }
    );

    if (reserveError) {
      console.error("Reservation error:", reserveError);
      return Response.json({ error: "Checkout creation failed" }, { status: 500 });
    }

    const reservation = Array.isArray(reservationRows) ? reservationRows[0] : reservationRows;
    if (!reservation) {
      return Response.json({ error: "Checkout creation failed" }, { status: 500 });
    }

    const {
      tier_id: tierId,
      price_cents: priceCents,
      reserved_qty: reservedQty,
      remaining,
      reservation_id: reservationId,
    } = reservation as {
      tier_id: string | null;
      price_cents: number | null;
      reserved_qty: number;
      remaining: number;
      reservation_id: string | null;
    };

    if (reservedQty === 0) {
      // Nothing was held — never charge for a partial quantity.
      if (!tierId) {
        return Response.json({ error: "General admission sold out" }, { status: 400 });
      }
      return Response.json(
        {
          error:
            `Only ${remaining} remain at this price. ` +
            `Reduce your quantity to ${remaining} — the rest are a separate purchase at the next tier.`,
          remaining,
        },
        { status: 400 }
      );
    }

    const baseAmount = priceCents! * reservedQty;

    let discountPercent = 0;
    let promoCodeId: string | null = null;

    if (promoCode && typeof promoCode === "string" && promoCode.trim().length > 0) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const promoRes = await fetch(
          `${supabaseUrl}/rest/v1/promo_codes?code=eq.${encodeURIComponent(promoCode.toUpperCase().trim())}&select=id,active,discount_percent&limit=1`,
          {
            signal: controller.signal,
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        clearTimeout(timeout);
        const promoRows = await promoRes.json();
        const promo = Array.isArray(promoRows) && promoRows.length > 0 ? promoRows[0] : null;

        if (promo?.active) {
          discountPercent = promo.discount_percent ?? 0;
          promoCodeId = promo.id;
        }
      } catch (fetchErr: unknown) {
        console.error("Promo fetch error:", (fetchErr as Error)?.name, (fetchErr as Error)?.message);
        // proceed without discount
      } finally {
        clearTimeout(timeout);
      }
    }

    const finalAmount = discountPercent > 0
      ? Math.round(baseAmount * (1 - discountPercent / 100))
      : baseAmount;

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: finalAmount,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        payment_method_options: {
          card: {
            setup_future_usage: undefined,
          },
        },
        metadata: {
          user_id: userId,
          quantity: String(reservedQty),
          is_vip: "false",
          event_id: event.id,
          tier_id: tierId!,
          reservation_id: reservationId ?? "",
          promo_code_id: promoCodeId ?? "",
          discount_applied: String(discountPercent > 0 ? Math.round(baseAmount * discountPercent / 100) : 0),
        },
      });
    } catch (stripeErr) {
      // Release the hold immediately rather than leaving seats parked for the TTL.
      if (reservationId) {
        await supabase.from("tier_reservations").delete().eq("id", reservationId);
      }
      throw stripeErr;
    }

    // Bind the hold to the PaymentIntent so the webhook can retire it on success.
    if (reservationId) {
      const { error: bindError } = await supabase
        .from("tier_reservations")
        .update({ payment_intent_id: paymentIntent.id })
        .eq("id", reservationId);
      if (bindError) console.error("Reservation bind error:", bindError);
    }

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json({ error: "Checkout creation failed" }, { status: 500 });
  }
}
