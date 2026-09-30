export const dynamic = "force-dynamic";

import { getOperativeEvent, getMostRecentCompletedEvent } from "@/lib/events";
import HomeClient, {
  HERO_LIFT_DEFAULT,
  HERO_SCALE_DEFAULT,
  MOBILE_HERO_DEFAULT,
  MOBILE_TYPE_DEFAULT,
  MOBILE_GAP_DEFAULT,
} from "./HomeClient";

/**
 * The public homepage. With an active event it renders the event hero and the
 * approved layout at the reviewed constants; with none it renders the dormant
 * page.
 *
 * The dormant case returns early with no props but `isDormant`, rather than
 * naming the fallbacks. The two render the same tree — every fallback is
 * exactly HomeClient's own default — but a prop named here is a prop
 * serialised into the RSC payload, so spelling them out would put bytes on the
 * dormant page for values it never uses.
 *
 * The constants are hardcoded here rather than read off the URL: ?hero=,
 * ?mhero=, ?mtype= and ?mgap= are tuning knobs and stay preview-only.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ complete?: string }>;
}) {
  const sp = await searchParams;
  // Dev-only preview of the post-show state; ignored in production so a visitor
  // can't force the completion banner onto the live site while sales are open.
  const previewComplete =
    process.env.NODE_ENV !== "production" && sp?.complete === "1";

  // An active sale takes the live event page.
  const event = await getOperativeEvent();
  if (event) {
    return (
      <HomeClient
        isDormant={false}
        completed={previewComplete}
        event={event}
        heroScale={HERO_SCALE_DEFAULT}
        heroLift={HERO_LIFT_DEFAULT}
        mHeroScale={MOBILE_HERO_DEFAULT}
        mTypeTarget={MOBILE_TYPE_DEFAULT}
        mGapTarget={MOBILE_GAP_DEFAULT}
      />
    );
  }

  // No active sale: render the most recent completed event's EXP_1 COMPLETE
  // state (its own hero + banner, sales off) — NOT the hardcoded dormant flyer.
  const completedEvent = await getMostRecentCompletedEvent();
  if (completedEvent) {
    return (
      <HomeClient
        isDormant={false}
        completed={true}
        event={completedEvent}
        heroScale={HERO_SCALE_DEFAULT}
        heroLift={HERO_LIFT_DEFAULT}
        mHeroScale={MOBILE_HERO_DEFAULT}
        mTypeTarget={MOBILE_TYPE_DEFAULT}
        mGapTarget={MOBILE_GAP_DEFAULT}
      />
    );
  }

  // Nothing at all: the original dormant page (kept byte-identical).
  return <HomeClient isDormant={true} />;
}
