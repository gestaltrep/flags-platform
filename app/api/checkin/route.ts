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

    console.log("CHECKIN START", body);

    // verify ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("ticket_codes")
      .select("*")
      .eq("code", code)
      .single();

    if (ticketError) {
      console.error("Ticket lookup error", ticketError);
      return Response.json({ success: false, message: "Ticket lookup failed" });
    }

    if (!ticket || ticket.claimed) {
      return Response.json({ success: false, message: "Invalid ticket" });
    }

    console.log("Ticket valid");

    // mark ticket used
    const { error: claimError } = await supabase
      .from("ticket_codes")
      .update({ claimed: true })
      .eq("id", ticket.id);

    if (claimError) {
      console.error("Ticket update error", claimError);
      return Response.json({ success: false, message: "Ticket update failed" });
    }

    console.log("Ticket claimed");

    // create user
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        phone: phone
      })
      .select()
      .single();

    if (userError) {
      console.error("User insert error", userError);
      return Response.json({ success: false, message: "User creation failed" });
    }

    console.log("User created", user);

    // create player
    const { data: player, error: playerError } = await supabase
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

    if (playerError) {
      console.error("Player insert error", playerError);
      return Response.json({ success: false, message: "Player creation failed" });
    }

    console.log("Player created", player);

    // assign flag
    const { error: flagError } = await supabase
      .from("flags")
      .update({
        owner_player_id: player.id,
        current_owner_id: player.id,
        team: team
      })
      .eq("serial_number", serial);

    if (flagError) {
      console.error("Flag update error", flagError);
      return Response.json({ success: false, message: "Flag assignment failed" });
    }

    console.log("Flag assigned");

    return Response.json({ success: true });

  } catch (err) {

    console.error("CHECKIN ERROR", err);

    return Response.json({ success: false });

  }

}