export function extractInstagramUsername(url: string) {
  // Matches the Instagram URL, captures the username, and then ignores the rest.
  const regex =
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)(?:[/?#].*)?/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}
