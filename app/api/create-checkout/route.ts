import Stripe from "stripe";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {

  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { quantity } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { count } = await supabase
    .from("ticket_codes")
    .select("*", { count: "exact", head: true })
    .eq("vip", false);

  const sold = count ?? 0;

  let price = 3500;
  let tier = 1;

  if (sold >= 333 && sold < 666) {
    price = 5000;
    tier = 2;
  }

  if (sold >= 666) {
    price = 6500;
    tier = 3;
  }

  const session = await stripe.checkout.sessions.create({

    mode: "payment",

    payment_method_types: ["card"],

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Entry Token — Tier ${tier}`
          },
          unit_amount: price
        },
        quantity: quantity
      }
    ],

    metadata: {
      user_id: userId,
      quantity: quantity,
      tier: tier
    },

    success_url: "https://flags-platform.vercel.app/dashboard",
    cancel_url: "https://flags-platform.vercel.app/dashboard"

  });

  return Response.json({ url: session.url });

}