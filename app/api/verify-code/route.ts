import Twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { normalizeUSPhone } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const { phone, code, name } = await req.json();

    const normalizedPhone = normalizeUSPhone(String(phone || ""));
    const normalizedCode = String(code || "").trim();

    if (!normalizedPhone) {
      return Response.json(
        { success: false, error: "This phone number isn't valid." },
        { status: 400 }
      );
    }

    const phoneRegex = /^\+1\d{10}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return Response.json(
        { success: false, error: "Invalid phone number." },
        { status: 400 }
      );
    }

    if (!normalizedCode) {
      return Response.json(
        { success: false, error: "Please enter the verification code." },
        { status: 400 }
      );
    }

    const client = Twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({
        to: normalizedPhone,
        code: normalizedCode,
      });

    if (check.status !== "approved") {
      return Response.json(
        { success: false, error: "That code is incorrect." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let userId: string;

    const { data: existingUser } = await supabase
      .from("users")
      .select("id, name")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (existingUser) {
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          phone_verified: true,
          ...(name?.trim() ? { name: name.trim() } : {}),
        })
        .eq("id", existingUser.id)
        .select("id")
        .single();

      if (updateError || !updatedUser?.id) {
        console.error("verify-code update user error:", updateError);
        return Response.json(
          { success: false, error: "We couldn't sign you in. Please try again." },
          { status: 500 }
        );
      }

      userId = updatedUser.id;
    } else {
      const { data: insertedUser, error: insertError } = await supabase
        .from("users")
        .insert({
          name: name?.trim() || null,
          phone: normalizedPhone,
          phone_verified: true,
        })
        .select("id")
        .single();

      if (insertError || !insertedUser?.id) {
        console.error("verify-code insert user error:", insertError);
        return Response.json(
          { success: false, error: "We couldn't sign you in. Please try again." },
          { status: 500 }
        );
      }

      userId = insertedUser.id;
    }

    const cookieStore = await cookies();
    cookieStore.set("user_id", userId, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("verify-code error:", error);

    const raw = String(error?.message || "").toLowerCase();
    const code = error?.code;

    if (raw.includes("expired") || code === 20404) {
      return Response.json(
        { success: false, error: "That code has expired." },
        { status: 400 }
      );
    }

    if (
      raw.includes("incorrect") ||
      raw.includes("invalid") ||
      raw.includes("code")
    ) {
      return Response.json(
        { success: false, error: "That code is incorrect." },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: "We couldn't verify your code. Please try again." },
      { status: 500 }
    );
  }
}