export async function POST(req: Request) {

  const params = await req.text();

  const response = `
  <Response>
    <Message>
      Welcome to Flags. Complete check-in here:
      https://flags-platform.vercel.app/checkin
    </Message>
  </Response>
  `;

  return new Response(response, {
    headers: { "Content-Type": "text/xml" }
  });

}