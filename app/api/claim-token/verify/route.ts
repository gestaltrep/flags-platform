import Twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { normalizeUSPhone } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const { phone, code, ticketId } = await req.json();

    const normalizedPhone = normalizeUSPhone(String(phone || ""));
    const normalizedCode = String(code || "").trim();
    const normalizedTicketId = String(ticketId || "").trim();

    if (!normalizedPhone) {
      return Response.json(
        { success: false, error: "This phone number isn't valid." },
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
      .select("id, buyer_user_id, claimed, claimed_by_user")
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

    const { data: pendingTransfer, error: transferError } = await supabase
      .from("pending_token_transfers")
      .select("id, recipient_phone, status")
      .eq("ticket_code_id", normalizedTicketId)
      .eq("status", "pending")
      .maybeSingle();

    if (transferError || !pendingTransfer) {
      return Response.json(
        { success: false, error: "No active transfer exists for this token." },
        { status: 409 }
      );
    }

    if (pendingTransfer.recipient_phone !== normalizedPhone) {
      return Response.json(
        { success: false, error: "Enter the correct phone number." },
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

    let userId: string;

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (existingUser?.id) {
      const { data: updatedUser, error: updateUserError } = await supabase
        .from("users")
        .update({ phone_verified: true })
        .eq("id", existingUser.id)
        .select("id")
        .single();

      if (updateUserError || !updatedUser?.id) {
        return Response.json(
          { success: false, error: "Could not verify recipient." },
          { status: 500 }
        );
      }

      userId = updatedUser.id;
    } else {
      const { data: insertedUser, error: insertUserError } = await supabase
        .from("users")
        .insert({
          phone: normalizedPhone,
          phone_verified: true,
        })
        .select("id")
        .single();

      if (insertUserError || !insertedUser?.id) {
        return Response.json(
          { success: false, error: "Could not verify recipient." },
          { status: 500 }
        );
      }

      userId = insertedUser.id;
    }

    const { error: ticketUpdateError } = await supabase
      .from("ticket_codes")
      .update({
        claimed_by_user: userId,
      })
      .eq("id", normalizedTicketId)
      .eq("claimed", false);

    if (ticketUpdateError) {
      return Response.json(
        { success: false, error: "Could not finalize token claim." },
        { status: 500 }
      );
    }

    const { error: transferUpdateError } = await supabase
      .from("pending_token_transfers")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", pendingTransfer.id)
      .eq("status", "pending");

    if (transferUpdateError) {
      return Response.json(
        { success: false, error: "Could not finalize transfer." },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("user_id", userId, {
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