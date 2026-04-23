import { createClient } from "@supabase/supabase-js";

// GET /api/claim-token/lookup?token=<claim_token>
// Resolves a claim token to light metadata about the ticket being offered,
// so the /claim/[token] page can show "You've been sent a VIP Token" etc.
// Does not expose sender identity or ticket code. Returns 404 if the link
// is invalid, expired, or no longer pending.

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const claimToken = (url.searchParams.get("token") || "").trim();

    if (!claimToken) {
      return Response.json(
        { success: false, error: "This claim link is invalid." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: transfer, error: transferError } = await supabase
      .from("pending_token_transfers")
      .select("id, ticket_code_id, status, expires_at")
      .eq("claim_token", claimToken)
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
      .select("id, is_vip, is_table, claimed, claimed_by_user")
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

    return Response.json({
      success: true,
      token_type: ticket.is_table ? "table" : ticket.is_vip ? "vip" : "ga",
    });
  } catch (err) {
    console.error("Claim token lookup error:", err);
    return Response.json(
      { success: false, error: "Lookup failed." },
      { status: 500 }
    );
  }
}
