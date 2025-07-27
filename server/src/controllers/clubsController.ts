import { type Request, type Response } from "express";
import { ClubsService } from "../services/clubs/service";
import { z } from "zod";
import { HttpError } from "../utils/errors";
import type { ClubsFilter } from "../services/clubs/types";

const clubsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  campuses: z.string().trim().optional(), // comma-separated
  interests: z.string().trim().optional(), // comma-separated
  search: z.string().trim().optional(),
});

export async function getAllClubs(req: Request, res: Response) {
  try {
    const q = clubsQuery.safeParse(req.query);
    if (!q.success) {
      throw new HttpError(`Invalid query parameters: ${q.error}`, 400);
    }

    const { campuses, interests, search } = q.data;
    const filters: ClubsFilter = {
      campusFilter: campuses
        ? campuses
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      interestsFilter: interests
        ? interests
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      searchFilter: search,
    };

    const clubsService = new ClubsService();
    const result = await clubsService.listClubs({ page: 1, limit: 5, filters });
    res.json(result);
  } catch (err: unknown) {
    console.error("Error fetching clubs", err);
    if (err instanceof HttpError) {
      res
        .status(err.statusCode ?? 400)
        .json({ error: err.message ?? "Invalid Request" });
    }
    if (err instanceof Error) {
      res.status(500).json({ error: err.message ?? "Failed to fetch clubs" });
    }
  }
}
