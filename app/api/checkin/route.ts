import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {

  try {

    const body = await req.json();

    const { code, phone, team, tag, serial } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const eventId = "d61cd74b-a259-4c80-b280-446850b4723b";

    // VERIFY TICKET

    const { data: ticket, error: ticketError } = await supabase
      .from("ticket_codes")
      .select("*")
      .eq("code", code)
      .single();

    if (ticketError || !ticket) {
      return Response.json({ success: false, message: "Invalid ticket" });
    }

    if (ticket.claimed) {
      return Response.json({ success: false, message: "Ticket already used" });
    }

    await supabase
      .from("ticket_codes")
      .update({ claimed: true })
      .eq("id", ticket.id);

    // FIND USER

    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (!user) {

      const { data: newUser } = await supabase
        .from("users")
        .insert({ phone })
        .select()
        .single();

      user = newUser;

    }

    // FIND PLAYER

    let { data: player } = await supabase
      .from("players")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // CREATE PLAYER IF NOT EXISTS

    if (!player) {

      const { data: newPlayer, error: playerError } = await supabase
        .from("players")
        .insert({
          id: user.id,
          phone: phone,
          gamer_tag: tag,
          team: team,
          event_id: eventId,
          active: true,
          checked_in: true
        })
        .select()
        .single();

      if (playerError) {
        console.error("Player insert error", playerError);
        return Response.json({ success: false, message: "Player creation failed" });
      }

      player = newPlayer;

    }

    // ASSIGN FLAG

    const { error: flagError } = await supabase
      .from("flags")
      .update({
        owner_player_id: player.id,
        current_owner_id: player.id,
        team: team,
        status: "active"
      })
      .eq("serial_number", serial);

    if (flagError) {
      console.error("Flag update error", flagError);
      return Response.json({ success: false, message: "Flag assignment failed" });
    }

    return Response.json({ success: true });

  } catch (err) {

    console.error("CHECKIN ERROR", err);

    return Response.json({ success: false, message: "Server error" });

  }

}