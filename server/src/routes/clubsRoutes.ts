import { Router } from "express";
import { getAllClubs } from "../controllers/clubsController";

const router = Router();

// GET /api/clubs
router.get("/", getAllClubs);

export default router;
