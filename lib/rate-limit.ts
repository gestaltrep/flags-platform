import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function checkOtpRateLimit({
  phone,
  ip,
}: {
  phone: string;
  ip: string;
}): Promise<{ ok: boolean; retryAfter?: number }> {
  const supabase = serviceClient();
  const now = Date.now();
  const phoneKey = `phone:${phone}`;
  const ipKey = `ip:${ip}`;
  const hourAgo = new Date(now - 3_600_000).toISOString();
  const sixtySecAgo = new Date(now - 60_000).toISOString();

  // 60-second per-phone cooldown: deny if any row in the last minute
  const { data: recent } = await supabase
    .from("otp_send_log")
    .select("created_at")
    .eq("rl_key", phoneKey)
    .gte("created_at", sixtySecAgo)
    .order("created_at", { ascending: false })
    .limit(1);

  if (recent && recent.length > 0) {
    const lastMs = new Date(recent[0].created_at).getTime();
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((lastMs + 60_000 - now) / 1000)),
    };
  }

  // 5-per-hour per-phone limit
  const { data: phoneLastHour } = await supabase
    .from("otp_send_log")
    .select("created_at")
    .eq("rl_key", phoneKey)
    .gte("created_at", hourAgo)
    .order("created_at", { ascending: true });

  if (phoneLastHour && phoneLastHour.length >= 5) {
    const oldestMs = new Date(phoneLastHour[0].created_at).getTime();
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((oldestMs + 3_600_000 - now) / 1000)),
    };
  }

  // 10-per-hour per-IP limit
  const { data: ipLastHour } = await supabase
    .from("otp_send_log")
    .select("created_at")
    .eq("rl_key", ipKey)
    .gte("created_at", hourAgo)
    .order("created_at", { ascending: true });

  if (ipLastHour && ipLastHour.length >= 10) {
    const oldestMs = new Date(ipLastHour[0].created_at).getTime();
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((oldestMs + 3_600_000 - now) / 1000)),
    };
  }

  // Allowed — log both keys
  await supabase.from("otp_send_log").insert([
    { rl_key: phoneKey, ip },
    { rl_key: ipKey, ip },
  ]);

  return { ok: true };
}
