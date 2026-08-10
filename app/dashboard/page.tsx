import { Suspense } from "react";
import TerminalClient from "./TerminalClient";
import UnauthorizedTerminalClient from "./UnauthorizedTerminalClient";
import { getActiveSalesEvent, getMostRecentDraftEvent } from "@/lib/events";
import { getVerifiedUserId } from "@/lib/auth";
import { isValidPreviewKey } from "@/lib/preview";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params?.key;
  const key = Array.isArray(raw) ? raw[0] : raw;

  // Token-gated preview: renders the draft event's Terminal without a session.
  // A missing, empty or wrong key — or an unset PREVIEW_TOKEN — falls straight
  // through to the normal auth gate below.
  if (isValidPreviewKey(key)) {
    const draftEvent = await getMostRecentDraftEvent();
    return (
      <Suspense>
        <TerminalClient activeEvent={draftEvent} previewMode={true} previewKey={key as string} />
      </Suspense>
    );
  }

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
