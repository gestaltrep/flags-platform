import { createClient } from "@supabase/supabase-js";

export async function GET(){

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { count } = await supabase
    .from("ticket_codes")
    .select("*", { count: "exact", head: true });

  // ensure count is always a number
  const sold = count ?? 0;

  let tier = 1;

  if (sold >= 333 && sold < 666) tier = 2;
  if (sold >= 666) tier = 3;

  return Response.json({
    tier,
    sold
  });

}