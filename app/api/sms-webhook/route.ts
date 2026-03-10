export async function POST() {

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>
Welcome to Flags.

Complete check-in here:
https://flags-platform.vercel.app/checkin
  </Message>
</Response>`;

  return new Response(twiml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml"
    }
  });

}