import { Suspense } from "react";
import TerminalClient from "./TerminalClient";
import UnauthorizedTerminalClient from "./UnauthorizedTerminalClient";
import { getActiveSalesEvent } from "@/lib/events";
import { getVerifiedUserId } from "@/lib/auth";

export default async function DashboardPage() {
  const userId = await getVerifiedUserId();

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
