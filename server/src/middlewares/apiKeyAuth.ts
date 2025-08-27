import {
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";
import crypto from "crypto";
import { ApiKeysRepo } from "../repos/apiKeysRepo";
// import { getApiKeyRecordsByPrefix } from "@/repositories/apiKeyRepo";

/**
 * CONFIG --------------------------------------------------------------
 *
 * LABEL            – constant part that appears at the start of *every* key
 * RANDOM_SLICE_LEN – how many random hex chars are also kept in clear-text
 *                    inside the DB prefix (keeps look-ups O(1)).
 *
 * Example key:  uoft_clubs_live_d4c97bb4e9…b905   (79 chars total)
 *               |<-- LABEL -->| |<- 4 ->|
 *               prefix stored in DB ===  uoft_clubs_live_d4c9
 */
const LABEL = process.env.API_KEY_LABEL ?? "madlab_dev_";
const RANDOM_SLICE_LEN = 4;
const PREFIX_LEN = LABEL.length + RANDOM_SLICE_LEN;

/**
 * Express middleware
 */
export const requireApiKey: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* ▸ 0. Allow bypass for local unit-tests -------------------------------- */
  if (process.env.SKIP_API_KEY === "true") next();

  /* ▸ 1. Extract key ------------------------------------------------------- */
  const key = req.header("X-API-Key");
  if (!key) {
    res.status(401).json({ error: "Missing API key" });
    return;
  }

  /* ▸ 2. Grab prefix & DB records ----------------------------------------- */
  const apiKeysRepo = new ApiKeysRepo();
  const prefix = key.slice(0, PREFIX_LEN);
  const records = await apiKeysRepo.findByPrefix(prefix); // may be []
  if (records instanceof Error) {
    console.error(records);
    res.status(500).json({
      error: "Internal sever error - DB not able to fetch api-key hash",
    });
    return;
  }
  if (!records.length) {
    res.status(401).json({ error: "Invalid API key - not found" });
    return;
  }

  /* ▸ 3. Hash once, compare to every row (handles rare prefix collisions) -- */
  const digest = crypto.createHash("sha256").update(key).digest("hex");

  const match = records.find((r) => r.hash === digest && r.revokedAt === null);

  if (!match) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  /* ▸ 4. Attach client info for logging / rate-limiting -------------------- */
  (req as any).client = { id: match.id, name: match.consumerName };
  next();
};
