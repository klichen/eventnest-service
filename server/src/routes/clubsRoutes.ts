import { Router } from "express";
import { getAllClubs } from "../controllers/clubsController";

const router = Router();

// GET /api/clubs
router.get("/", getAllClubs);

// (optional) for triggering a manual refresh
// router.post("/refresh-tokens", refreshTokens);

export default router;
