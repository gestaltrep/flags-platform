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
  console.log("⚡ Stripe webhook received:", req.method);

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

  console.log("✅ Webhook verified, event type:", event.type);
  console.log("WEBHOOK EVENT TYPE:", event.type);

  try {
    if (event.type !== "payment_intent.succeeded") {
      return new Response("ok");
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    console.log("RAW_METADATA_KEYS:", Object.keys(paymentIntent.metadata || {}).join(","));
    console.log("RAW_PROMO_ID:", paymentIntent.metadata?.promo_code_id);
    console.log("WEBHOOK METADATA:", paymentIntent.metadata);
    console.log("WEBHOOK PAYMENT INTENT ID:", paymentIntent.id);

    const userId = paymentIntent.metadata?.user_id;
    const quantity = parseInt(paymentIntent.metadata?.quantity || "1", 10);
    const isVip = paymentIntent.metadata?.is_vip === "true";
    const eventId = paymentIntent.metadata?.event_id || EVENT_ID;
    const promoCodeId = paymentIntent.metadata?.promo_code_id || "";
    const discountApplied = Number(paymentIntent.metadata?.discount_applied ?? 0);

    console.log("PARSED VALUES:", {
      userId,
      quantity,
      isVip,
      eventId,
      promoCodeId,
    });

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
      console.log("Webhook already processed for payment intent:", paymentIntent.id);
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

    console.log("ROWS TO INSERT:", rows);

    const { data: insertedTickets, error: ticketError } = await supabase
      .from("ticket_codes")
      .insert(rows)
      .select();

    if (ticketError) {
      console.error("Ticket insert error:", ticketError);
      return new Response("Ticket insert failed", { status: 500 });
    }

    console.error("WEBHOOK_PROMO_ID:", paymentIntent.metadata?.promo_code_id);
    console.error("WEBHOOK_PROMO_ID_LENGTH:", (paymentIntent.metadata?.promo_code_id || "").length);
    console.error("INSERTED_TICKETS_COUNT:", insertedTickets?.length);
    console.error("PROMO_CODE_ID_PRESENT:", !!promoCodeId, promoCodeId?.length);

    if (promoCodeId && insertedTickets) {
      console.error("PROMO_INSERT_ATTEMPT", promoCodeId, insertedTickets?.length);
      for (const ticketCode of insertedTickets) {
        console.error("INSERTING_PROMO_USE:", { promo_code_id: promoCodeId, ticket_code_id: ticketCode.id });
        const { error: promoUseError } = await supabase.from("promo_code_uses").insert({
          promo_code_id: promoCodeId,
          ticket_code_id: ticketCode.id,
          user_id: userId,
          amount_paid: paymentIntent.amount,
          discount_applied: discountApplied,
        });
        if (promoUseError) {
          console.error("PROMO_USE_INSERT_ERROR:", JSON.stringify(promoUseError));
        } else {
          console.error("PROMO_USE_INSERT_SUCCESS");
        }
      }
    }

    console.log("Webhook completed successfully");

    return new Response("ok");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return new Response("Webhook error", { status: 500 });
  }
}
