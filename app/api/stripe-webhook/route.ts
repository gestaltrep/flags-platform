export const runtime = "nodejs";

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {

  try {

    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {

      const session: any = event.data.object;

      const quantity = parseInt(session.metadata?.quantity || "1");

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const eventId = "d61cd74b-a259-4c80-b280-446850b4723b";

      console.log("Stripe tickets purchased:", quantity);

      // record purchase
      const walletInsert = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: null,
          event_id: eventId,
          amount: quantity,
          type: "registration"
        });

      if (walletInsert.error) {
        console.error("Wallet insert error:", walletInsert.error);
      }

      // generate ticket codes
      for (let i = 0; i < quantity; i++) {

        const code = crypto.randomBytes(3).toString("hex").toUpperCase();

        const { error } = await supabase
          .from("ticket_codes")
          .insert({
            event_id: eventId,
            buyer_user_id: null,
            code: code
          });

        if (error) {
          console.error("Ticket code insert error:", error);
        }

      }

      console.log("Ticket codes generated:", quantity);

    }

    return new Response("ok");

  } catch (err) {

    console.error("Webhook error:", err);

    return new Response("Webhook error", { status: 500 });

  }

}