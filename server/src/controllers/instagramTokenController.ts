import { type Request, type Response } from "express";
import * as tokenService from "../services/instagram-tokens/service";

export async function exchangeForToken(req: Request, res: Response) {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({
      error:
        "Authorization code is missing - this comes from Instagram auth redirect",
    });
  } else {
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
}
