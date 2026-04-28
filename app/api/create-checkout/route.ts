import Stripe from "stripe";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const EVENT_ID = "d61cd74b-a259-4c80-b280-446850b4723b";

function buildAmount(quantity: number, sold: number): number {
  const tiers = [
    { cap: 50,   price: 2778, label: "Tier 1 Token" },
    { cap: 125,  price: 3889, label: "Tier 2 Token" },
    { cap: 1000, price: 5000, label: "Tier 3 Token" },
  ];
  let remaining = quantity;
  let position = sold;
  let total = 0;
  for (const tier of tiers) {
    if (remaining <= 0) break;
    if (position >= tier.cap) continue;
    const availableInTier = tier.cap - position;
    const take = Math.min(remaining, availableInTier);
    total += take * tier.price;
    remaining -= take;
    position += take;
  }
  if (remaining > 0) throw new Error("General admission sold out");
  return total;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
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
      .eq("is_vip", false)
      .not("buyer_user_id", "is", null)
      .is("refunded_at", null);

    const sold = count ?? 0;
    const remaining = 1000 - sold;
    if (remaining <= 0) return Response.json({ error: "General admission sold out" }, { status: 400 });
    if (quantity > remaining) return Response.json({ error: `Only ${remaining} tokens remain.` }, { status: 400 });

    const baseAmount = buildAmount(quantity, sold);

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
        is_vip: "false",
        event_id: EVENT_ID,
        promo_code_id: promoCodeId ?? "",
        discount_applied: String(discountPercent > 0 ? Math.round(baseAmount * discountPercent / 100) : 0),
      },
    });

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json({ error: "Checkout creation failed" }, { status: 500 });
  }
}
