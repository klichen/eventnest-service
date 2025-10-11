import { DateTime } from "luxon";

export function extractInstagramUsername(url: string) {
  // Matches the Instagram URL, captures the username, and then ignores the rest.
  const regex =
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)(?:[/?#].*)?/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Ensure the URL ends with exactly "/media"
 * (no trailing slashes or double‐slashes)
 */
export function createMediaUrl(url: string): string {
  // 1) Remove any trailing slashes
  const trimmed = url.replace(/\/+$/g, "");

  // 3) Otherwise append "/media"
  return `${trimmed}/media`;
}

// --- Date time helpers ---
export function hoursAgoToUnix(hours: number): number {
  const msAgo = hours * 60 * 60 * 1000;
  return Math.floor((Date.now() - msAgo) / 1000);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Parse a YYYY-MM-DD into a UTC Date at 00:00:00Z. Returns null if invalid. */
export function parseDateOnly(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  if (!DATE_RE.test(dateStr)) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  // Ensure it's a real calendar date (no overflow like 2025-02-31 -> Mar 3)
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

export async function resolveInstagramMediaUrl(
  mediaUrl: string
): Promise<string> {
  const attempts = 3; // total tries
  const timeoutMs = 3000; // per attempt
  const baseDelayMs = 300;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let i = 1; i <= attempts; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`attempting to resolve url for ${mediaUrl}`);
      const res = await fetch(mediaUrl, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
      });
      if (res.ok) {
        console.log(`resolved ${mediaUrl}`);
        return res.url;
      }

      const retryable =
        res.status === 408 ||
        res.status === 429 ||
        (res.status >= 500 && res.status < 600);

      if (!retryable || i === attempts) {
        console.error(`Failed to resolve media URL (${res.status})`);
        return "";
      }
    } catch (err: any) {
      // Network/timeout errors are retryable unless we're out of attempts
      if (i === attempts) {
        console.error(
          `Failed to resolve media URL after ${i} attempt(s): ${
            err?.message ?? err
          }`
        );
        return "";
      }
    } finally {
      clearTimeout(timer);
    }

    // Exponential backoff with small jitter
    const delay =
      Math.min(5000, baseDelayMs * 2 ** (i - 1)) +
      Math.floor(Math.random() * 100);
    await sleep(delay);
  }

  // should be unreachable: loop either returned or threw
  console.error("Unexpected fallthrough in resolveInstagramMediaUrl");
  return "";
}

/**
 * Converts an ISO‐8601 string like "2025-05-19T18:00:00Z"
 * —where the "Z" is really just a placeholder—into a JS Date
 * that represents that wall‐clock time in Eastern Time,
 * normalized to actual UTC.
 *
 * E.g. "2025-05-19T18:00:00Z" (meaning 6pm ET) → 2025-05-19T22:00:00.000Z
 *
 * @param isoWithZ an ISO string ending in "Z"
 * @returns a JS Date whose UTC instant matches the ET wall‐clock time
 * @throws if the input isn’t a valid ISO date
 */
export function parseESTIsoAsUtc(isoWithZ: string): Date {
  // 1) Drop the Z so we don’t treat it as UTC
  const bareIso = isoWithZ.replace(/Z$/, "");

  // 2) Parse in America/New_York (handles EST vs. EDT automatically)
  const dt = DateTime.fromISO(bareIso, { zone: "America/Toronto" });
  if (!dt.isValid) {
    throw new Error(`Invalid ISO date: ${isoWithZ}`);
  }

  // 3) toJSDate() returns a JS Date (UTC‐based under the hood)
  return dt.toJSDate();
}

export interface PaginationArgs {
  page?: number;
  limit?: number;
}

export function calcOffset({ page = 1, limit = 20 }: PaginationArgs) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  return { offset: (safePage - 1) * safeLimit, limit: safeLimit };
}

export function splitCsv(v?: string): string[] {
  return v
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
}

export function normalize(keys: string[]): string[] {
  return Array.from(new Set(keys.map((k) => k.toLowerCase())));
}

export function findInvalid(input: string[], allowed: Set<string>): string[] {
  return input.filter((k) => !allowed.has(k));
}
