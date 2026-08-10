export const dynamic = "force-dynamic";

import HomeClient from "../HomeClient";
import { getMostRecentDraftEvent } from "@/lib/events";
import { isValidPreviewKey } from "@/lib/preview";

/**
 * Token-gated preview of the event-two sales flow.
 *
 * A missing, empty or wrong ?key= — and an unset PREVIEW_TOKEN — all render the
 * dormant homepage, byte-for-byte what a public visitor to / sees. Nothing
 * about the draft event reaches the response in that case, and the token is
 * never sent to the client.
 */
export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params?.key;
  const key = Array.isArray(raw) ? raw[0] : raw;

  if (!isValidPreviewKey(key)) {
    return <HomeClient isDormant={true} />;
  }

  const event = await getMostRecentDraftEvent();
  if (!event) {
    return <HomeClient isDormant={true} />;
  }

  return (
    <HomeClient
      isDormant={false}
      previewMode={true}
      previewKey={key as string}
      event={{
        name: event.name,
        slug: event.slug,
        location: event.location,
        start_time: event.start_time,
        hero_image: event.hero_image,
      }}
    />
  );
}
