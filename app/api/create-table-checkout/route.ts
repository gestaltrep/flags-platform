import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getActiveSalesEvent } from "@/lib/events";
import { getVerifiedUserId } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

    const body = await req.json().catch(() => ({}));
    const promoCode: string | undefined = body.promoCode;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { count } = await supabase
      .from("ticket_codes")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("is_table", true)
      .is("refunded_at", null);

    const tablesSold = Math.floor((count ?? 0) / 6);
    if (tablesSold >= 5) return Response.json({ error: "TABLES SOLD OUT" }, { status: 400 });

    const quantity = 6;
    const baseAmount = 66667;

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
      } finally {
        clearTimeout(timeout);
      }
    }

    const finalAmount = discountPercent > 0 ? Math.round(66667 * (1 - discountPercent / 100)) : 66667;

    const paymentIntent = await stripe.paymentIntents.create({
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
        quantity: String(quantity),
        is_vip: "true",
        is_table: "true",
        event_id: event.id,
        promo_code_id: promoCodeId ?? "",
        discount_applied: String(discountPercent > 0 ? Math.round(baseAmount * discountPercent / 100) : 0),
      },
    });

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Table checkout error:", error);
    return Response.json({ error: "Table checkout creation failed" }, { status: 500 });
  }
}
