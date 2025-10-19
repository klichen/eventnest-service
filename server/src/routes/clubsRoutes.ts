import { Router } from "express";
import { getAllClubs, getSingleClub } from "../controllers/clubsController";

const router = Router();

// GET /api/clubs
router.get("/", getAllClubs);
router.get("/:id", getSingleClub);

export default router;
