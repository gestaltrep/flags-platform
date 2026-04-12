import Stripe from "stripe";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const EVENT_ID = "d61cd74b-a259-4c80-b280-446850b4723b";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const quantity = Math.max(1, Math.min(10, Number(body.quantity || 1)));
    const promoCode: string | undefined = body.promoCode;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { count } = await supabase
      .from("ticket_codes")
      .select("*", { count: "exact", head: true })
      .eq("event_id", EVENT_ID)
      .eq("is_vip", true)
      .not("buyer_user_id", "is", null);

    const vipSold = count ?? 0;
    const remaining = 50 - vipSold;
    if (remaining <= 0) return Response.json({ error: "VIP sold out" }, { status: 400 });
    if (quantity > remaining) return Response.json({ error: `Only ${remaining} VIP tokens remain.` }, { status: 400 });

    const baseAmount = 6667 * quantity;

    let discountPercent = 0;
    let promoCodeId: string | null = null;

    if (promoCode && typeof promoCode === "string" && promoCode.trim().length > 0) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const promoRes = await fetch(
          `${supabaseUrl}/rest/v1/promo_codes?code=eq.${encodeURIComponent(promoCode.toUpperCase().trim())}&select=id,active&limit=1`,
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
          discountPercent = 10;
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
      ? Math.round(baseAmount * 0.9)
      : baseAmount;

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
        event_id: EVENT_ID,
        promo_code_id: promoCodeId ?? "",
        discount_applied: String(discountPercent > 0 ? Math.round(baseAmount * 0.1) : 0),
      },
    });

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("VIP checkout error:", error);
    return Response.json({ error: "VIP checkout creation failed" }, { status: 500 });
  }
}
