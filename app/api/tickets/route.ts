import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    return Response.json([]);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tickets, error: ticketError } = await supabase
    .from("ticket_codes")
    .select(
      "id, code, vip, is_vip, is_table, comp, claimed, claimed_at, created_at, buyer_user_id, claimed_by_user, refunded_at"
    )
    .or(
      `and(buyer_user_id.eq.${userId},claimed_by_user.is.null),claimed_by_user.eq.${userId}`
    )
    .order("created_at", { ascending: false });

  if (ticketError) {
    console.error("Tickets fetch error:", ticketError);
    return Response.json([]);
  }

  const ownedTicketIds = (tickets || [])
    .filter((t) => t.buyer_user_id === userId)
    .map((t) => t.id);

  let pendingByTicketId = new Map<
    string,
    {
      id: string;
      recipient_phone: string;
      status: string;
    }
  >();

  if (ownedTicketIds.length > 0) {
    const { data: pendingTransfers, error: pendingError } = await supabase
      .from("pending_token_transfers")
      .select("id, ticket_code_id, recipient_phone, status")
      .in("ticket_code_id", ownedTicketIds)
      .eq("status", "pending");

    if (pendingError) {
      console.error("Pending transfers fetch error:", pendingError);
    } else {
      pendingByTicketId = new Map(
        (pendingTransfers || []).map((row) => [
          row.ticket_code_id,
          {
            id: row.id,
            recipient_phone: row.recipient_phone,
            status: row.status,
          },
        ])
      );
    }
  }

  const shaped = (tickets || []).map((ticket) => {
    const pending = pendingByTicketId.get(ticket.id);

    return {
      id: ticket.id,
      code: ticket.code,
      vip: ticket.vip,
      is_vip: ticket.is_vip,
      is_table: ticket.is_table,
      claimed: ticket.claimed,
      claimed_at: ticket.claimed_at,
      refunded_at: ticket.refunded_at ?? null,
      created_at: ticket.created_at,
      pending_transfer_id: pending?.id ?? null,
      pending_recipient_phone: pending?.recipient_phone ?? null,
      pending_status: pending?.status ?? null,
      can_send:
        ticket.buyer_user_id === userId &&
        !ticket.claimed &&
        !ticket.claimed_by_user &&
        !pending,
      can_cancel:
        ticket.buyer_user_id === userId &&
        !ticket.claimed &&
        !ticket.claimed_by_user &&
        !!pending,
    };
  });

  return Response.json(shaped);
}