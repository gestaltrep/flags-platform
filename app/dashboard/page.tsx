import { Suspense } from "react";
import { cookies } from "next/headers";
import TerminalClient from "./TerminalClient";
import UnauthorizedTerminalClient from "./UnauthorizedTerminalClient";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    return <UnauthorizedTerminalClient />;
  }

  return (
    <Suspense>
      <TerminalClient />
    </Suspense>
  );
}