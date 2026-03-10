import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {

  try {

    const body = await req.json();

    const quantity = body.quantity || 1;
    const userId = body.userId || "test-user";

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

      success_url: "https://flags-platform.vercel.app/register?success=true",
      cancel_url: "https://flags-platform.vercel.app/register?canceled=true"

    });

    return Response.json({
      url: session.url
    });

  } catch (error) {

    console.error("Stripe checkout error:", error);

    return new Response(
      JSON.stringify({ error: "Checkout creation failed" }),
      { status: 500 }
    );

  }

}