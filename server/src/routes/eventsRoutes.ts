import { Router } from "express";
import {
  getAllEvents,
  getTodayEvents,
  getWeekEvents,
} from "../controllers/eventsController";

const router = Router();

// GET /api/events
router.get("/", getAllEvents);
router.get("/today", getTodayEvents);
router.get("/this-week", getWeekEvents);

export default router;
