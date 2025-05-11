import { URLSearchParams } from "url";
import { InstagramTokenRepo } from "../../repos/instagramTokenRepo";
import { ClubRepo } from "../../repos/clubRepo";

type ShortLivedResponse = {
  access_token: string;
  user_id: string;
  permissions: string;
};

type LongLivedResponse = {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
};

interface RefreshResult {
  accessToken: string;
  expiresIn: number; // seconds
}

const tokenRepo = new InstagramTokenRepo();
const clubRepo = new ClubRepo();

export async function handleTokenExchange(code: string) {
  // 1) Exchange code for a short‑lived token
  const short = await exchangeForShortLivedToken(code);
  // console.log("short access token:", short.access_token);

  const instagramUsername = await fetchInstagramUsername(short.access_token);
  console.log("ig username:", instagramUsername);

  // 2) check whether this club exists in our db (registered with SOP)
  const clubId = await validateAccount(instagramUsername);
  if (clubId === "notfound") {
    return {
      success: false,
      reason: "notfound",
    };
  }

  // 3) Exchange short‑lived token for a long‑lived token
  const long = await exchangeForLongLivedToken(short.access_token);

  // 4) Persist in DB
  await upsertInstagramToken(
    clubId,
    instagramUsername,
    long.access_token,
    long.expires_in
  );

  return {
    success: true,
  };
}

async function exchangeForShortLivedToken(
  code: string
): Promise<ShortLivedResponse> {
  const params = new URLSearchParams({
    client_id: process.env.CLIENT_ID as string,
    client_secret: process.env.CLIENT_SECRET as string,
    grant_type: "authorization_code",
    redirect_uri: process.env.REDIRECT_URI as string,
    code,
  });

  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      `Failed to get short-lived token (${res.status}): ${JSON.stringify(
        errorBody
      )}`
    );
  }

  return (await res.json()) as ShortLivedResponse;
}

async function exchangeForLongLivedToken(
  shortToken: string
): Promise<LongLivedResponse> {
  const url = new URL("https://graph.instagram.com/access_token");
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", process.env.CLIENT_SECRET!);
  url.searchParams.set("access_token", shortToken);

  const res = await fetch(url.toString(), { method: "GET" });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(
      `Failed to get long-lived token (${res.status}): ${JSON.stringify(
        errorBody
      )}`
    );
  }

  return (await res.json()) as LongLivedResponse;
}

/**
 * Helper: call the Instagram Graph API with a short-lived token
 * and return the user's username.
 */
async function fetchInstagramUsername(shortToken: string): Promise<string> {
  const url = new URL("https://graph.instagram.com/me");
  url.searchParams.set("fields", "username");
  url.searchParams.set("access_token", shortToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(
      `Unable to fetch username (status ${res.status}): ${JSON.stringify(
        errBody
      )}`
    );
  }

  const data = await res.json();
  return data.username as string;
}

/**
 * Checks whether this instagram account is linked to a registered club in SOP
 */
async function validateAccount(username: string) {
  const club = await clubRepo.findByInstagramUsername(username);
  if (club) {
    return club.id;
  }
  return "notfound";
}

async function upsertInstagramToken(
  clubId: string,
  instagramUsername: string,
  accessToken: string,
  expiresIn: number
) {
  const expiration = new Date(Date.now() + expiresIn * 1_000);

  await tokenRepo.save({
    clubId,
    instagramUsername,
    accessToken,
    expiration,
  });
}

/**
 * Your app user's long-lived access token can be refreshed for another 60 days as long as the existing conditions are true:

    The existing long-lived access token is at least 24 hours old
    The existing long-lived access token is valide (not expired)
    The app user has granted your app the instagram_business_basic permission
 */

/**
 * Finds all tokens expiring within the next 10 days
 * (buffer to fix any API issues if they appear),
 * refreshes the endpoint and updates the db.
 * Returns the count of tokens successfully refreshed.
 */
export async function refreshExpiringTokens(): Promise<number> {
  const now = new Date();
  const daysThreshold = 10;
  const cutoff = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  const expiringTokens = await tokenRepo.findExpiring(cutoff);
  if (expiringTokens.length === 0) return 0;

  let count = 0;
  for (const t of expiringTokens) {
    try {
      const refreshed = await refreshLongLivedToken(t.accessToken);

      // update db
      await upsertInstagramToken(
        t.clubId,
        t.instagramUsername,
        refreshed.accessToken,
        refreshed.expiresIn
      );

      count++;
    } catch (err) {
      console.error(
        `Failed to refresh token for user ${t.instagramUsername}:`,
        err
      );
    }
  }
  console.log(`Refreshed ${count} tokens`);
  return count;
}

export async function refreshLongLivedToken(
  token: string
): Promise<RefreshResult> {
  // build the URL with query params
  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(
      `Instagram token refresh failed (${res.status}): ${errBody}`
    );
  }

  const { access_token, expires_in } = (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };

  // const expiresAt = new Date(Date.now() + expires_in * 1000);

  return {
    accessToken: access_token,
    expiresIn: expires_in,
  };
}
