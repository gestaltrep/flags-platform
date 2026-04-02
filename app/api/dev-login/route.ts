import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ success: false, error: "Not found." }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const phone = (searchParams.get("phone") || "").trim();

    if (!phone) {
      return Response.json(
        { success: false, error: "Missing phone number." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: user, error } = await supabase
      .from("users")
      .select("id, phone")
      .eq("phone", phone)
      .maybeSingle();

    if (error || !user?.id) {
      return Response.json(
        { success: false, error: "Test user not found." },
        { status: 404 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("user_id", user.id, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("dev-login error:", error);
    return Response.json(
      { success: false, error: "Dev login failed." },
      { status: 500 }
    );
  }
}