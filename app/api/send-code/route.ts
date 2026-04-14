import Twilio from "twilio";
import { normalizeUSPhone } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    const normalizedPhone = normalizeUSPhone(String(phone || ""));

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

    const client = Twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({
        to: normalizedPhone,
        channel: "sms",
      });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("send-code error:", error);

    const raw = String(error?.message || "").toLowerCase();
    const code = error?.code;

    if (raw.includes("invalid") && raw.includes("parameter")) {
      return Response.json(
        { success: false, error: "SMS is not available right now." },
        { status: 503 }
      );
    }

    if (
      (raw.includes("invalid") && raw.includes("phone")) ||
      raw.includes("not a valid phone number") ||
      code === 21211
    ) {
      return Response.json(
        { success: false, error: "This phone number isn't valid." },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: "We couldn't send your code. Please try again." },
      { status: 500 }
    );
  }
}