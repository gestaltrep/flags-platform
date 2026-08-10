import { timingSafeEqual } from "node:crypto";

/**
 * Server-only gate for the event-two sales preview.
 *
 * Fails closed in every ambiguous case: if PREVIEW_TOKEN is unset or empty, no
 * key can ever be valid, so every preview surface falls back to its public
 * (dormant) behaviour. The token is never sent to the browser — only a key the
 * caller already supplied and that has been validated here is echoed onward.
 */
export function isValidPreviewKey(key: string | null | undefined): boolean {
  const token = process.env.PREVIEW_TOKEN;
  if (!token) return false;
  if (!key) return false;

  const provided = Buffer.from(key);
  const expected = Buffer.from(token);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

/** Pull the preview key off a request: ?previewKey=... or the x-preview-key header. */
export function previewKeyFromRequest(req: Request): string | null {
  const fromQuery = new URL(req.url).searchParams.get("previewKey");
  if (fromQuery) return fromQuery;
  return req.headers.get("x-preview-key");
}

/** True when this request carries a valid preview key. */
export function isPreviewRequest(req: Request): boolean {
  return isValidPreviewKey(previewKeyFromRequest(req));
}
