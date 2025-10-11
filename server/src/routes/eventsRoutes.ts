import { Router } from "express";
import { getAllEvents } from "../controllers/eventsController";

const router = Router();

// GET /api/events
router.get("/", getAllEvents);

export default router;
