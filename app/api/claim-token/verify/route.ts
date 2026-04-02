import Twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

export async function POST(req: Request) {
  try {
    const { phone, code, ticketId } = await req.json();

    const normalizedPhone = normalizePhone(String(phone || ""));
    const normalizedCode = String(code || "").trim();
    const normalizedTicketId = String(ticketId || "").trim();

    if (!normalizedPhone) {
      return Response.json(
        { success: false, error: "Please enter your phone number." },
        { status: 400 }
      );
    }

    if (!normalizedCode) {
      return Response.json(
        { success: false, error: "Please enter the verification code." },
        { status: 400 }
      );
    }

    if (!normalizedTicketId) {
      return Response.json(
        { success: false, error: "This claim link is missing a token." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ticket, error: ticketError } = await supabase
      .from("ticket_codes")
      .select("id, claimed_by_user, claimed")
      .eq("id", normalizedTicketId)
      .maybeSingle();

    if (ticketError || !ticket) {
      return Response.json(
        { success: false, error: "Token not found." },
        { status: 404 }
      );
    }

    if (ticket.claimed) {
      return Response.json(
        { success: false, error: "This token has already been used." },
        { status: 409 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, phone")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (userError || !user?.id) {
      return Response.json(
        {
          success: false,
          error: "Enter a different phone number.",
        },
        { status: 403 }
      );
    }

    if (ticket.claimed_by_user !== user.id) {
      return Response.json(
        {
          success: false,
          error: "Enter a different phone number.",
        },
        { status: 403 }
      );
    }

    const client = Twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({
        to: normalizedPhone,
        code: normalizedCode,
      });

    if (check.status !== "approved") {
      return Response.json(
        { success: false, error: "That verification code is incorrect." },
        { status: 400 }
      );
    }

    const { error: verifyUserError } = await supabase
      .from("users")
      .update({
        phone_verified: true,
      })
      .eq("id", user.id);

    if (verifyUserError) {
      return Response.json(
        { success: false, error: "Could not verify recipient." },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("user_id", user.id, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Claim token verify error:", err);
    return Response.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}