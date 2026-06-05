import { Suspense } from "react";
import { cookies } from "next/headers";
import TerminalClient from "./TerminalClient";
import UnauthorizedTerminalClient from "./UnauthorizedTerminalClient";
import { getActiveSalesEvent } from "@/lib/events";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    return <UnauthorizedTerminalClient />;
  }

  const activeEvent = await getActiveSalesEvent();

  return (
    <Suspense>
      <TerminalClient activeEvent={activeEvent} />
    </Suspense>
  );
}
