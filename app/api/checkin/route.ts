import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {

  const body = await req.json();

  const { code, phone, team, tag, serial } = body;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const eventId = "d61cd74b-a259-4c80-b280-446850b4723b";

  // verify ticket
  const { data: ticket } = await supabase
    .from("ticket_codes")
    .select("*")
    .eq("code", code)
    .single();

  if (!ticket || ticket.claimed) {
    return Response.json({ success: false, message: "Invalid ticket" });
  }

  // mark ticket used
  await supabase
    .from("ticket_codes")
    .update({ claimed: true })
    .eq("id", ticket.id);

  // create user
  const { data: user } = await supabase
    .from("users")
    .insert({
      phone: phone
    })
    .select()
    .single();

  // create player
  const { data: player } = await supabase
    .from("players")
    .insert({
      phone: phone,
      gamer_tag: tag,
      team: team,
      event_id: eventId,
      active: true,
      checked_in: true
    })
    .select()
    .single();

  // assign flag
  await supabase
    .from("flags")
    .update({
      owner_player_id: player.id,
      current_owner_id: player.id,
      team: team
    })
    .eq("serial_number", serial);

  return Response.json({ success: true });

}