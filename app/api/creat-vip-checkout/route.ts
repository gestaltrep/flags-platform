import Stripe from "stripe";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {

  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { count } = await supabase
    .from("ticket_codes")
    .select("*", { count: "exact", head: true })
    .eq("vip", true);

  const vipSold = count ?? 0;

  if (vipSold >= 150) {
    return new Response("VIP Sold Out", { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({

    mode: "payment",

    payment_method_types: ["card"],

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "VIP Entry Token"
          },
          unit_amount: 10000
        },
        quantity: 1
      }
    ],

    metadata: {
      user_id: userId,
      vip: "true"
    },

    success_url: "https://flags-platform.vercel.app/dashboard",
    cancel_url: "https://flags-platform.vercel.app/dashboard"

  });

  return Response.json({ url: session.url });

}