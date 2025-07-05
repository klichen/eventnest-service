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

export function hoursAgoToUnix(hours: number): number {
  const msAgo = hours * 60 * 60 * 1000;
  return Math.floor((Date.now() - msAgo) / 1000);
}

export async function resolveInstagramMediaUrl(
  mediaUrl: string
): Promise<string> {
  // Use HEAD so you don’t download the whole image
  const res = await fetch(mediaUrl, {
    method: "GET",
    redirect: "follow", // (default) follow 302 → CDN
  });

  if (!res.ok) {
    throw new Error(`Failed to resolve media URL (${res.status})`);
  }

  // `res.url` is the final URL after following all redirects
  return res.url;
}
