import {
  InstagramTokenRepo,
  type ClubInstagramTokenRecord,
} from "../../repos/instagramTokenRepo";
import {
  InstagramPostRepo,
  type NewInstagramPost,
} from "../../repos/instagramPostsRepo";
import { createMediaUrl, hoursAgoToUnix } from "../../utils/helpers";

const tokenRepo = new InstagramTokenRepo();
const postRepo = new InstagramPostRepo();

/**
 * Fetch all posts for each club’s Instagram token, then save to DB.
 */
// TODO - CRON JOB
export async function fetchAndSaveAllInstagramPosts(): Promise<void> {
  // 1) Get every club’s current Instagram token record
  const tokens: ClubInstagramTokenRecord[] = await tokenRepo.getAllTokens();

  for (const tk of tokens) {
    try {
      // 2) Fetch post IDs for this token
      const postIds = await fetchInstagramPostIdsForToken(tk.accessToken);
      if (postIds.length === 0) {
        console.log(`No posts found for clubId=${tk.clubId}`);
        continue;
      }
      // 3) Fetch post details by IDs
      const rawPosts = await fetchInstagramPostsByIds(tk.accessToken, postIds);
      if (rawPosts.length === 0) {
        console.log(
          `No posts found for clubId=${tk.clubId} after details fetch`
        );
        continue;
      }
      console.log(`Found ${rawPosts.length} posts for ${tk.instagramUsername}`);

      // 3) Convert to our insert shape
      const toSave: NewInstagramPost[] = rawPosts.map((p) => ({
        caption: p.caption ?? null,
        postUrl: p.permalink,
        imageUrl: createMediaUrl(p.permalink),
        createdOn: new Date(p.timestamp),
        status: "unprocessed",
        clubId: tk.clubId,
      }));

      // 4) Update DB
      await postRepo.saveMany(toSave);
      console.log(
        `Saved ${toSave.length} posts for ${tk.instagramUsername} in DB`
      );
    } catch (err) {
      console.error(
        `Error fetching/saving posts for clubId=${tk.clubId}:`,
        err
      );
    }
  }
}

/**
 * Given a valid, long‐lived Instagram OAuth token,
 * call the Graph API’s /me/media endpoint to fetch recent media IDs.
 * Returns an array of post IDs:
 */
async function fetchInstagramPostIdsForToken(
  token: string
): Promise<Array<string>> {
  // Build the URL: fields = id,caption,media_url,permalink,timestamp
  const url = new URL("https://graph.instagram.com/v22.0/me/media");
  url.searchParams.set("access_token", token);
  // Only fetch posts from the last 24 hours
  const sinceTimestamp = hoursAgoToUnix(24);
  url.searchParams.set("since", sinceTimestamp.toString());

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`Instagram API error (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    data: Array<{ id: string }>;
    paging?: any;
  };
  // JSON shape: {
  //     "data": [
  //         {
  //             "id": "17916191627960931"
  //         }
  //     ],
  //     "paging": {...}
  // }
  return json.data.map((item) => item.id);
}

/**
 * The shape of the detailed media object we fetch from instagram API
 */
export interface InstagramMediaData {
  id: string;
  caption?: string;
  media_type: string;
  permalink: string;
  timestamp: string;
}

export async function fetchInstagramPostsByIds(
  token: string,
  ids: string[]
): Promise<InstagramMediaData[]> {
  const fetches = ids.map(async (id) => {
    try {
      const url = new URL(`https://graph.instagram.com/v22.0/${id}`);
      url.searchParams.set("fields", "caption,media_type,permalink,timestamp");
      url.searchParams.set("access_token", token);

      const res = await fetch(url.toString());
      if (!res.ok) {
        const errText = await res.text().catch(() => "(no body)");
        console.error(`Failed to fetch media ${id}:`, res.status, errText);
        return null;
      }

      const data = (await res.json()) as InstagramMediaData;
      return data;
    } catch (err) {
      console.error(`Error fetching media ${id}:`, err);
      return null;
    }
  });

  const results = await Promise.all(fetches);
  // Filter out any nulls from failed fetches
  return results.filter((p): p is InstagramMediaData => p !== null);
}
