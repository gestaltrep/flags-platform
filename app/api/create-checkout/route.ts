import Stripe from "stripe";
import { cookies, headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const EVENT_ID = "d61cd74b-a259-4c80-b280-446850b4723b";

function buildGeneralAdmissionLineItems(quantity: number, sold: number) {
  const tiers = [
    { cap: 333, price: 3500, name: "Tier 1 Token" },
    { cap: 666, price: 5000, name: "Tier 2 Token" },
    { cap: 1000, price: 6500, name: "Tier 3 Token" },
  ];

  let remaining = quantity;
  let position = sold;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const tier of tiers) {
    if (remaining <= 0) break;
    if (position >= tier.cap) continue;

    const availableInTier = tier.cap - position;
    const take = Math.min(remaining, availableInTier);

    lineItems.push({
      quantity: take,
      price_data: {
        currency: "usd",
        product_data: { name: tier.name },
        unit_amount: tier.price,
      },
    });

    remaining -= take;
    position += take;
  }

  if (remaining > 0) throw new Error("General admission sold out");

  return lineItems;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const quantity = Math.max(1, Math.min(10, Number(body.quantity || 1)));

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { count } = await supabase
      .from("ticket_codes")
      .select("*", { count: "exact", head: true })
      .eq("event_id", EVENT_ID)
      .eq("is_vip", false)
      .not("buyer_user_id", "is", null);

    const sold = count ?? 0;
    const remaining = 1000 - sold;

    if (remaining <= 0) {
      return Response.json({ error: "General admission sold out" }, { status: 400 });
    }

    if (quantity > remaining) {
      return Response.json(
        { error: `Only ${remaining} general admission tokens remain.` },
        { status: 400 }
      );
    }

    const lineItems = buildGeneralAdmissionLineItems(quantity, sold);

    const h = await headers();
    const forwardedProto = h.get("x-forwarded-proto");
    const forwardedHost = h.get("x-forwarded-host");
    const origin =
      forwardedProto && forwardedHost
        ? `${forwardedProto}://${forwardedHost}`
        : new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata: {
        user_id: userId,
        quantity: String(quantity),
        is_vip: "false",
        event_id: EVENT_ID,
      },
      return_url: `${origin}/dashboard?purchase=complete`,
    });

    return Response.json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return Response.json({ error: "Checkout creation failed" }, { status: 500 });
  }
}
