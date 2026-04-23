import Twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { normalizeUSPhone } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const { phone, code, claimToken, name } = await req.json();

    const normalizedPhone = normalizeUSPhone(String(phone || ""));
    const normalizedCode = String(code || "").trim();
    const normalizedClaimToken = String(claimToken || "").trim();
    const normalizedName = String(name || "").trim();

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

    if (!normalizedClaimToken) {
      return Response.json(
        { success: false, error: "This claim link is invalid." },
        { status: 400 }
      );
    }

    if (!normalizedName) {
      return Response.json(
        { success: false, error: "Please enter your name." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Re-resolve the transfer and ticket before burning a Verify check.
    const { data: transfer, error: transferError } = await supabase
      .from("pending_token_transfers")
      .select("id, ticket_code_id, status, expires_at")
      .eq("claim_token", normalizedClaimToken)
      .maybeSingle();

    if (transferError || !transfer) {
      return Response.json(
        { success: false, error: "This claim link is invalid." },
        { status: 404 }
      );
    }

    if (transfer.status !== "pending") {
      return Response.json(
        { success: false, error: "This claim link is no longer active." },
        { status: 409 }
      );
    }

    if (transfer.expires_at && new Date(transfer.expires_at) < new Date()) {
      return Response.json(
        { success: false, error: "This claim link has expired." },
        { status: 410 }
      );
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("ticket_codes")
      .select("id, claimed, claimed_by_user")
      .eq("id", transfer.ticket_code_id)
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

    if (ticket.claimed_by_user) {
      return Response.json(
        { success: false, error: "This token has already been claimed." },
        { status: 409 }
      );
    }

    // Burn the Verify check.
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

    // Upsert user by phone. Updates the name only if we didn't already
    // have one — preserves a returning user's existing name over whatever
    // was typed in the claim form.
    let userId: string;

    const { data: existingUser } = await supabase
      .from("users")
      .select("id, name")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (existingUser?.id) {
      const shouldUpdateName = !existingUser.name && normalizedName;
      const { data: updatedUser, error: updateUserError } = await supabase
        .from("users")
        .update({
          phone_verified: true,
          ...(shouldUpdateName ? { name: normalizedName } : {}),
        })
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
          name: normalizedName,
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

    // Atomic first-verify-wins. Flip the transfer row from pending to
    // accepted with an optimistic WHERE status='pending' guard. If zero
    // rows update, another claim beat us to it.
    const { data: acceptedTransfer, error: acceptError } = await supabase
      .from("pending_token_transfers")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        recipient_phone: normalizedPhone,
        recipient_name: normalizedName,
      })
      .eq("id", transfer.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (acceptError) {
      return Response.json(
        { success: false, error: "Could not finalize transfer." },
        { status: 500 }
      );
    }

    if (!acceptedTransfer) {
      // Another claim already flipped it. Don't also try to update the
      // ticket — whoever won already did that.
      return Response.json(
        { success: false, error: "This token has already been claimed." },
        { status: 409 }
      );
    }

    // Now assign the ticket. Use the claimed=false guard so a simultaneous
    // checkin scan doesn't race us.
    const { data: assignedTicket, error: ticketUpdateError } = await supabase
      .from("ticket_codes")
      .update({ claimed_by_user: userId })
      .eq("id", ticket.id)
      .eq("claimed", false)
      .select("id")
      .maybeSingle();

    if (ticketUpdateError || !assignedTicket) {
      // Ticket got checked in between our transfer-accept and this update.
      // Roll back the transfer accept so state stays coherent.
      await supabase
        .from("pending_token_transfers")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", transfer.id);

      return Response.json(
        { success: false, error: "This token was used before claim completed." },
        { status: 409 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("user_id", userId, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
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
