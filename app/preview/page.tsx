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
  searchParams: Promise<{ key?: string | string[]; hero?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params?.key;
  const key = Array.isArray(raw) ? raw[0] : raw;

  // Hero sizing experiment: ?hero=1.5 or 1.9. Anything else is 1, i.e. the
  // shared CSS untouched.
  const rawHero = Array.isArray(params?.hero) ? params.hero[0] : params?.hero;
  const heroScale = rawHero === "1.5" ? 1.5 : rawHero === "1.9" ? 1.9 : 1;

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
      heroScale={heroScale}
      event={{
        name: event.name,
        slug: event.slug,
        location: event.location,
        start_time: event.start_time,
        end_time: event.end_time,
        hero_image: event.hero_image,
      }}
    />
  );
}
