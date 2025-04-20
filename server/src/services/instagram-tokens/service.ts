// src/services/tokenService.ts
import { URLSearchParams } from "url";
import { eq } from "drizzle-orm";
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

const tokenRepo = new InstagramTokenRepo();
const clubRepo = new ClubRepo();

export async function handleTokenExchange(code: string) {
  // 1) Exchange code for a short‑lived token
  const short = await exchangeForShortLivedToken(code);
  console.log("short access token:", short.access_token);

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

  // TODO create new state in frontend to show that user must be registered with SOP

  // 3) Exchange short‑lived token for a long‑lived token
  // const long = await exchangeForLongLivedToken(short.access_token);

  // 4) Persist in DB
  // await upsertInstagramToken(
  //   clubId,
  //   instagramUsername,
  //   long.access_token,
  //   long.expires_in
  // );

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

// /**
//  * Finds all tokens expiring within the next `daysThreshold` days,
//  * exchanges them for new long‑lived tokens, and updates the DB.
//  * Returns the count of tokens successfully refreshed.
//  */
// export async function refreshExpiringTokens(
//   daysThreshold = 5
// ): Promise<number> {
//   const now    = new Date();
//   const cutoff = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

//   const tokens = await db
//     .select()
//     .from(instagramTokens)
//     .where(instagramTokens.expiryDate.lt(cutoff));

//   let count = 0;
//   for (const t of tokens) {
//     try {
//       const refreshed = await exchangeForLongLivedToken(t.accessToken);
//       const newExpiry = new Date(Date.now() + refreshed.expires_in * 1_000);

//       await db
//         .update(instagramTokens)
//         .set({ accessToken: refreshed.access_token, expiryDate: newExpiry })
//         .where(eq(instagramTokens.userId, t.userId));

//       count++;
//     } catch (err) {
//       console.error(`Failed to refresh token for user ${t.userId}:`, err);
//     }
//   }

//   return count;
// }
