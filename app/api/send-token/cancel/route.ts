import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const senderUserId = cookieStore.get("user_id")?.value;

    if (!senderUserId) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const ticketId = String(body.ticketId || "").trim();

    if (!ticketId) {
      return Response.json(
        { success: false, error: "Ticket is required." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ticket, error: ticketError } = await supabase
      .from("ticket_codes")
      .select("id, buyer_user_id")
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

    const { data: pendingTransfer, error: pendingError } = await supabase
      .from("pending_token_transfers")
      .select("id, status, accepted_at, cancelled_at")
      .eq("ticket_code_id", ticketId)
      .eq("sender_user_id", senderUserId)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingError) {
      return Response.json(
        { success: false, error: "Could not inspect transfer state." },
        { status: 500 }
      );
    }

    if (!pendingTransfer) {
      return Response.json(
        { success: false, error: "This transfer is no longer pending." },
        { status: 409 }
      );
    }

    const { data: updatedTransfer, error: cancelError } = await supabase
      .from("pending_token_transfers")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", pendingTransfer.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (cancelError) {
      return Response.json(
        { success: false, error: "Could not cancel transfer." },
        { status: 500 }
      );
    }

    if (!updatedTransfer) {
      return Response.json(
        { success: false, error: "This transfer is no longer pending." },
        { status: 409 }
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Cancel transfer error:", err);
    return Response.json(
      { success: false, error: "Cancel transfer failed." },
      { status: 500 }
    );
  }
}