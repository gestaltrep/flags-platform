import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request){

  const { code } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("ticket_codes")
    .select("*")
    .eq("code",code)
    .single();

  if(!data){
    return Response.json({ valid:false });
  }

  if(data.claimed){
    return Response.json({ valid:false, reason:"already_used" });
  }

  await supabase
    .from("ticket_codes")
    .update({
      claimed:true,
      claimed_at:new Date()
    })
    .eq("code",code);

  return Response.json({ valid:true });

}