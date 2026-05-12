export type Tier = 1 | 2 | 3;

// 2026-05-15 00:00:00 EDT (UTC-4). Tier 2 fires automatically at this instant
// regardless of sold count.
export const TIER_TWO_TRIGGER = new Date("2026-05-15T00:00:00-04:00");

export const TIER_PRICES_CENTS: Record<Tier, number> = {
  1: 2778,
  2: 3889,
  3: 5000,
};

export const TIER_TWO_SOLD_THRESHOLD = 50;
export const TIER_THREE_SOLD_THRESHOLD = 125;

export function calculateTier(gaSold: number, now: Date = new Date()): Tier {
  if (gaSold >= TIER_THREE_SOLD_THRESHOLD) return 3;
  if (gaSold >= TIER_TWO_SOLD_THRESHOLD || now >= TIER_TWO_TRIGGER) return 2;
  return 1;
}

export function tierPriceCents(tier: Tier): number {
  return TIER_PRICES_CENTS[tier];
}
