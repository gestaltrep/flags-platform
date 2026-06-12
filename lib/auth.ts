import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function signSession(userId: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  const sig = createHmac("sha256", secret).update(userId).digest("base64url");
  return `${userId}.${sig}`;
}

export async function getVerifiedUserId(): Promise<string | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const cookieStore = await cookies();
  const raw = cookieStore.get("user_id")?.value;
  if (!raw) return null;

  const lastDot = raw.lastIndexOf(".");
  if (lastDot === -1) return null;

  const userId = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);

  if (!UUID_RE.test(userId)) return null;

  const expected = createHmac("sha256", secret)
    .update(userId)
    .digest("base64url");

  try {
    const a = Buffer.from(sig, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return userId;
}
