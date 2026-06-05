import { createClient } from "@supabase/supabase-js";

export type EventStatus =
  | "draft"
  | "upcoming"
  | "live"
  | "locked"
  | "archived";

export type Event = {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  hero_image: string | null;
  description: string | null;
  status: EventStatus;
  sales_open_at: string | null;
  sales_close_at: string | null;
  created_at: string;
  updated_at: string;
};

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * The event currently taking sales. Returns the most recent
 * row with status='upcoming', or null if none.
 */
export async function getActiveSalesEvent(): Promise<Event | null> {
  const { data } = await admin()
    .from("events")
    .select("*")
    .eq("status", "upcoming")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Event | null) ?? null;
}

/**
 * The event currently happening live (event night).
 * Returns most recent status='live' row, or null.
 */
export async function getLiveEvent(): Promise<Event | null> {
  const { data } = await admin()
    .from("events")
    .select("*")
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Event | null) ?? null;
}

/** Direct lookup by primary key. */
export async function getEventById(id: string): Promise<Event | null> {
  const { data } = await admin()
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Event | null) ?? null;
}

/** Direct lookup by url-friendly slug. */
export async function getEventBySlug(slug: string): Promise<Event | null> {
  const { data } = await admin()
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Event | null) ?? null;
}

/** All events with public-facing status (everything except 'draft'). Used by archive surfaces. */
export async function getAllPublicEvents(): Promise<Event[]> {
  const { data } = await admin()
    .from("events")
    .select("*")
    .neq("status", "draft")
    .order("start_time", { ascending: false });
  return (data as Event[] | null) ?? [];
}
