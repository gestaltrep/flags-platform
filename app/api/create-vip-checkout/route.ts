import Stripe from "stripe";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const EVENT_ID = "d61cd74b-a259-4c80-b280-446850b4723b";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const quantity = Math.max(1, Math.min(10, Number(body.quantity || 1)));

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
    const remaining = 150 - vipSold;

    if (remaining <= 0) {
      return Response.json({ error: "VIP sold out" }, { status: 400 });
    }

    if (quantity > remaining) {
      return Response.json(
        { error: `Only ${remaining} VIP tokens remain.` },
        { status: 400 }
      );
    }

    const origin = new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity,
          price_data: {
            currency: "usd",
            product_data: {
              name: "VIP Token",
            },
            unit_amount: 10000,
          },
        },
      ],
      metadata: {
        user_id: userId,
        quantity: String(quantity),
        is_vip: "true",
        event_id: EVENT_ID,
      },
      success_url: `${origin}/dashboard?purchase=success`,
      cancel_url: `${origin}/dashboard?purchase=cancelled`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("VIP checkout error:", error);
    return Response.json({ error: "VIP checkout creation failed" }, { status: 500 });
  }
}