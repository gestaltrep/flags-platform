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

      const session = event.data.object as any;

      const userId = session.metadata?.user_id || "test-user";
      const quantity = Number(session.metadata?.quantity || 1);

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const eventId = "d61cd74b-a259-4c80-b280-446850b4723b";

      console.log("Stripe payment received:", quantity);

      // record purchase
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        event_id: eventId,
        amount: quantity,
        type: "ticket_purchase"
      });

      // generate ticket codes
      for (let i = 0; i < quantity; i++) {

        const code = crypto.randomBytes(3).toString("hex").toUpperCase();

        await supabase.from("ticket_codes").insert({
          event_id: eventId,
          buyer_user_id: userId,
          code: code
        });

      }

      console.log("Ticket codes generated");

    }

    return new Response("ok");

  } catch (err) {

    console.error("Webhook error:", err);

    return new Response("Webhook error", { status: 500 });

  }

}