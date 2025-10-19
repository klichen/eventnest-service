import { Router } from "express";
import {
  getAllEvents,
  getSingleEvent,
  getTodayEvents,
  getWeekEvents,
} from "../controllers/eventsController";

const router = Router();

// GET /api/events
router.get("/", getAllEvents);
router.get("/today", getTodayEvents);
router.get("/this-week", getWeekEvents);
router.get("/:id", getSingleEvent);

export default router;
