export const dynamic = "force-dynamic";

import { getActiveSalesEvent } from "@/lib/events";
import HomeClient from "./HomeClient";

export default async function Home() {
  const event = await getActiveSalesEvent();
  return <HomeClient isDormant={!event} />;
}
