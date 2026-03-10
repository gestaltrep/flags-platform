import Twilio from "twilio";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {

  const { phone, code } = await req.json();

  const client = Twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  const check = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verificationChecks.create({
      to: phone,
      code
    });

  if (check.status !== "approved") {
    return Response.json({ success: false });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("users").upsert({
    phone,
    phone_verified: true
  });

  return Response.json({ success: true });

}