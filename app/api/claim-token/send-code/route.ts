import Twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import { normalizeUSPhone } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const { phone, ticketId } = await req.json();

    const normalizedPhone = normalizeUSPhone(String(phone || ""));
    const normalizedTicketId = String(ticketId || "").trim();

    if (!normalizedPhone) {
      return Response.json(
        { success: false, error: "This phone number isn't valid." },
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

    if (transferError) {
      return Response.json(
        { success: false, error: "Could not verify transfer state." },
        { status: 500 }
      );
    }

    if (!pendingTransfer) {
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

    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({
        to: normalizedPhone,
        channel: "sms",
      });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("claim-token send-code error:", error);

    const raw = String(error?.message || "").toLowerCase();
    const code = error?.code;

    if (raw.includes("invalid") && raw.includes("parameter")) {
      return Response.json(
        { success: false, error: "SMS is not available right now." },
        { status: 503 }
      );
    }

    if (
      (raw.includes("invalid") && raw.includes("phone")) ||
      raw.includes("not a valid phone number") ||
      code === 21211
    ) {
      return Response.json(
        { success: false, error: "This phone number isn't valid." },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: false,
        error: "We couldn't send your code. Please try again.",
      },
      { status: 500 }
    );
  }
}