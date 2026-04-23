import Twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import { normalizeUSPhone } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const { phone, claimToken } = await req.json();

    const normalizedPhone = normalizeUSPhone(String(phone || ""));
    const normalizedClaimToken = String(claimToken || "").trim();

    if (!normalizedPhone) {
      return Response.json(
        { success: false, error: "This phone number isn't valid." },
        { status: 400 }
      );
    }

    if (!normalizedClaimToken) {
      return Response.json(
        { success: false, error: "This claim link is invalid." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve the claim token to a pending transfer. The unique index on
    // claim_token makes this a point lookup.
    const { data: transfer, error: transferError } = await supabase
      .from("pending_token_transfers")
      .select("id, ticket_code_id, status, expires_at")
      .eq("claim_token", normalizedClaimToken)
      .maybeSingle();

    if (transferError) {
      return Response.json(
        { success: false, error: "Could not verify claim link." },
        { status: 500 }
      );
    }

    if (!transfer) {
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

    // Sanity-check the ticket itself isn't already used or already claimed.
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
      { success: false, error: "We couldn't send your code. Please try again." },
      { status: 500 }
    );
  }
}
