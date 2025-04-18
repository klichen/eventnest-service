import { Router } from "express";
import { exchangeForToken } from "../controllers/instagramTokenController";

const router = Router();

// POST /api/auth/get-token
router.post("/get-token", exchangeForToken);

// (optional) for triggering a manual refresh
// router.post("/refresh-tokens", refreshTokens);

export default router;
