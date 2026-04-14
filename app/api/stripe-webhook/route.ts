export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const EVENT_ID = "d61cd74b-a259-4c80-b280-446850b4723b";

function makeCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("❌ Webhook signature error:", err);
    return Response.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  try {
    if (event.type !== "payment_intent.succeeded") {
      return new Response("ok");
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const userId = paymentIntent.metadata?.user_id;
    const quantity = parseInt(paymentIntent.metadata?.quantity || "1", 10);
    const isVip = paymentIntent.metadata?.is_vip === "true";
    const eventId = paymentIntent.metadata?.event_id || EVENT_ID;
    const promoCodeId = paymentIntent.metadata?.promo_code_id || "";
    const discountApplied = Number(paymentIntent.metadata?.discount_applied ?? 0);

    if (!userId) {
      console.error("Missing user_id in metadata");
      return new Response("Missing user_id", { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existingTransaction } = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("stripe_session_id", paymentIntent.id)
      .maybeSingle();

    if (existingTransaction) {
      return new Response("ok");
    }

    const { error: walletError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: userId,
        event_id: eventId,
        amount: quantity,
        type: isVip ? "vip_registration" : "registration",
        stripe_session_id: paymentIntent.id,
      });

    if (walletError) {
      console.error("Wallet insert error:", walletError);
      return new Response("Wallet insert failed", { status: 500 });
    }

    const rows = Array.from({ length: quantity }).map(() => ({
      event_id: eventId,
      buyer_user_id: userId,
      code: makeCode(),
      is_vip: isVip,
      vip: isVip,
      claimed: false,
      claimed_by_user: null,
      claimed_at: null,
    }));

    const { error: ticketError } = await supabase
      .from("ticket_codes")
      .insert(rows)
      .select();

    if (ticketError) {
      console.error("Ticket insert error:", ticketError);
      return new Response("Ticket insert failed", { status: 500 });
    }

    if (promoCodeId) {
      const { error: promoUseError } = await supabase.from("promo_code_uses").insert({
        promo_code_id: promoCodeId,
        user_id: userId,
        ticket_quantity: quantity,
        amount_paid: paymentIntent.amount,
        amount_saved: discountApplied,
        is_vip: isVip,
      });
      if (promoUseError) {
        console.error("Promo use insert error:", promoUseError);
      }
    }

    return new Response("ok");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return new Response("Webhook error", { status: 500 });
  }
}
