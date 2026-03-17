import { cookies } from "next/headers";

export async function GET() {

  const cookieStore = await cookies();

  cookieStore.set(
    "user_id",
    "04899028-f4ec-4e72-92d3-a8c48d25d180",
    {
      path: "/"
    }
  );

  return Response.redirect("http://localhost:3000/dashboard");

}