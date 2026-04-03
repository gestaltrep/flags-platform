import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import Twilio from "twilio";
import { normalizeUSPhone } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const senderUserId = cookieStore.get("user_id")?.value;

    if (!senderUserId) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const ticketId = String(body.ticketId || "").trim();
    const phone = normalizeUSPhone(String(body.phone || ""));

    if (!ticketId || !phone) {
      return Response.json(
        { success: false, error: "Ticket and recipient phone are required." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: sender, error: senderError } = await supabase
      .from("users")
      .select("id, phone")
      .eq("id", senderUserId)
      .maybeSingle();

    if (senderError || !sender) {
      return Response.json(
        { success: false, error: "Sender account not found." },
        { status: 404 }
      );
    }

    if (normalizeUSPhone(sender.phone || "") === phone) {
      return Response.json(
        { success: false, error: "Use a different phone number for the recipient." },
        { status: 400 }
      );
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("ticket_codes")
      .select("id, buyer_user_id, claimed, claimed_by_user, code")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketError || !ticket) {
      return Response.json({ success: false, error: "Token not found." }, { status: 404 });
    }

    if (ticket.buyer_user_id !== senderUserId) {
      return Response.json(
        { success: false, error: "You do not control this token." },
        { status: 403 }
      );
    }

    if (ticket.claimed) {
      return Response.json(
        { success: false, error: "Used tokens cannot be sent." },
        { status: 409 }
      );
    }

    if (ticket.claimed_by_user) {
      return Response.json(
        { success: false, error: "This token has already been claimed." },
        { status: 409 }
      );
    }

    const { data: existingPending } = await supabase
      .from("pending_token_transfers")
      .select("id, recipient_phone")
      .eq("ticket_code_id", ticket.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending?.id) {
      return Response.json(
        {
          success: false,
          error: "This token already has a pending transfer.",
        },
        { status: 409 }
      );
    }

    const { data: pendingTransfer, error: pendingInsertError } = await supabase
      .from("pending_token_transfers")
      .insert({
        ticket_code_id: ticket.id,
        sender_user_id: senderUserId,
        recipient_phone: phone,
        status: "pending",
      })
      .select("id")
      .single();

    if (pendingInsertError || !pendingTransfer?.id) {
      return Response.json(
        { success: false, error: "Could not start transfer." },
        { status: 500 }
      );
    }

    let smsWarning: string | null = null;

    try {
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioMessagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!twilioAccountSid || !twilioAuthToken) {
        throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN.");
      }

      if (!twilioMessagingServiceSid && !twilioPhoneNumber) {
        throw new Error(
          "Missing TWILIO_MESSAGING_SERVICE_SID and TWILIO_PHONE_NUMBER."
        );
      }

      const twilio = Twilio(twilioAccountSid, twilioAuthToken);

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
      const claimUrl = `${baseUrl}/claim-token?ticket=${ticket.id}`;

      const messagePayload: {
        to: string;
        body: string;
        from?: string;
        messagingServiceSid?: string;
      } = {
        to: phone,
        body:
          `A token has been transmitted to you.\n\n` +
          `Claim your token:\n${claimUrl}`,
      };

      if (twilioMessagingServiceSid) {
        messagePayload.messagingServiceSid = twilioMessagingServiceSid;
      } else {
        messagePayload.from = twilioPhoneNumber!;
      }

      await twilio.messages.create(messagePayload);
    } catch (smsErr) {
      console.error("Send token SMS error:", smsErr);
      smsWarning = " Transfer started, but SMS delivery failed.";
    }

    return Response.json({
      success: true,
      message: `Token ${ticket.code} transfer started successfully.${smsWarning || ""}`,
    });
  } catch (err) {
    console.error("Send token error:", err);
    return Response.json(
      { success: false, error: "Send token failed." },
      { status: 500 }
    );
  }
}