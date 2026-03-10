import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {

  const body = await req.json();

  const quantity = body.quantity || 1;
  const userId = body.userId;

  const session = await stripe.checkout.sessions.create({

    mode: "payment",

    payment_method_types: ["card"],

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Event Ticket"
          },
          unit_amount: 2000
        },
        quantity: quantity
      }
    ],

    metadata: {
      user_id: userId,
      quantity: quantity
    },

    success_url: "https://flags-platform.vercel.app/dashboard",
    cancel_url: "https://flags-platform.vercel.app/register"

  });

  return Response.json({ url: session.url });

}