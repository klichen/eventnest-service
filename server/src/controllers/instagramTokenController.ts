import { type Request, type Response } from "express";
import * as tokenService from "../services/instagram-tokens/service";

export async function exchangeForToken(req: Request, res: Response) {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({
      error:
        "Authorization code is missing - this comes from Instagram auth redirect",
    });
  }

  try {
    const result = await tokenService.handleTokenExchange(code);
    res.json(result);
  } catch (err: any) {
    console.error("Error exchanging code for token:", err);
    res
      .status(err.statusCode ?? 500)
      .json({ error: err.message ?? "Failed to exchange code for token" });
  }
}

/**
 * (Optional) Trigger token refresh for all tokens nearing expiry.
 * Later you can schedule this with node-cron instead of exposing as an endpoint.
 */
// export async function refreshTokens(req: Request, res: Response) {
//   try {
//     const refreshed = await tokenService.refreshExpiringTokens();
//     return res.json({ success: true, refreshedCount: refreshed });
//   } catch (err: any) {
//     console.error("Error refreshing tokens:", err);
//     return res.status(500).json({ error: "Failed to refresh tokens" });
//   }
// }
