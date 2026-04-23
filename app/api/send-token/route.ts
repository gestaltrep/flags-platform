import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const CLAIM_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateClaimToken(): string {
  // 24 bytes → 32 chars base64url. ~144 bits of entropy.
  return randomBytes(24).toString("base64url");
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const senderUserId = cookieStore.get("user_id")?.value;

    if (!senderUserId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const ticketId = String(body.ticketId || "").trim();

    if (!ticketId) {
      return Response.json(
        { success: false, error: "Token not found." },
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
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketError || !ticket) {
      return Response.json(
        { success: false, error: "Token not found." },
        { status: 404 }
      );
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

    // Build the claim URL using the request origin. This makes localhost
    // work during dev and the real host work in production, independent
    // of NEXT_PUBLIC_APP_URL which may be set to prod even on dev machines.
    const origin = new URL(req.url).origin;

    // Idempotent path: if a pending transfer already exists for this
    // ticket (sender closed and reopened the modal), return the existing
    // claim token instead of creating a new row. The partial unique
    // index uniq_pending_transfer_per_ticket_pending would reject a
    // duplicate insert anyway.
    const { data: existingPending, error: existingPendingError } =
      await supabase
        .from("pending_token_transfers")
        .select("id, claim_token, sender_user_id")
        .eq("ticket_code_id", ticket.id)
        .eq("status", "pending")
        .maybeSingle();

    if (existingPendingError) {
      console.error(
        "Pending transfer lookup error:",
        existingPendingError
      );
      return Response.json(
        { success: false, error: "Could not verify transfer state." },
        { status: 500 }
      );
    }

    if (existingPending?.id) {
      // Defensive: another user shouldn't have a pending transfer on a
      // token this user owns, but if one somehow exists, don't leak its
      // claim token to the wrong person.
      if (existingPending.sender_user_id !== senderUserId) {
        return Response.json(
          { success: false, error: "This token has a pending transfer." },
          { status: 409 }
        );
      }

      if (!existingPending.claim_token) {
        return Response.json(
          { success: false, error: "Existing transfer is malformed." },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        claim_token: existingPending.claim_token,
        claim_url: `${origin}/claim/${existingPending.claim_token}`,
      });
    }

    // Create a new pending transfer. recipient_phone and recipient_name
    // stay null until the recipient verifies via /api/claim-token/verify.
    const claimToken = generateClaimToken();
    const expiresAt = new Date(Date.now() + CLAIM_TOKEN_TTL_MS).toISOString();

    const { error: pendingInsertError } = await supabase
      .from("pending_token_transfers")
      .insert({
        ticket_code_id: ticket.id,
        sender_user_id: senderUserId,
        claim_token: claimToken,
        expires_at: expiresAt,
        status: "pending",
      });

    if (pendingInsertError) {
      console.error("Pending transfer insert error:", pendingInsertError);
      return Response.json(
        { success: false, error: "Could not start transfer." },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      claim_token: claimToken,
      claim_url: `${origin}/claim/${claimToken}`,
    });
  } catch (err) {
    console.error("Send token error:", err);
    return Response.json(
      { success: false, error: "Send token failed." },
      { status: 500 }
    );
  }
}
