import { type Request, type Response } from "express";
import { ClubsService } from "../services/clubs/service";
import { z } from "zod";
import { HttpError } from "../utils/errors";
import { findInvalid, normalize, splitCsv } from "../utils/helpers";
import { ALLOWED_CAMPUS_KEYS, ALLOWED_INTEREST_KEYS } from "../utils/constants";

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

    const { campuses, interests, search, page, limit } = q.data;

    const campusKeys = normalize(splitCsv(campuses));
    const interestKeys = normalize(splitCsv(interests));

    const badCampuses = findInvalid(campusKeys, ALLOWED_CAMPUS_KEYS);
    const badInterests = findInvalid(interestKeys, ALLOWED_INTEREST_KEYS);

    // filter values validation
    if (badCampuses.length || badInterests.length) {
      let errMsg = "One or more filter values are invalid.";
      if (badCampuses.length)
        errMsg = errMsg.concat(
          " ",
          `Invalid campuses values: ${badCampuses.join(
            ","
          )} - refer to API doc for valid values`
        );
      if (badInterests.length)
        errMsg = errMsg.concat(
          " ",
          `Invalid interests values: ${badInterests.join(
            ","
          )} - refer to API doc for valid values`
        );
      throw new HttpError(errMsg, 400);
    }

    const clubsService = new ClubsService();
    const result = await clubsService.listClubs({
      page,
      limit,
      filters: {
        campusFilter: campusKeys,
        interestsFilter: interestKeys,
        searchFilter: search,
      },
    });
    res.json(result);
  } catch (err: unknown) {
    console.error("Error fetching clubs", err);
    if (err instanceof HttpError) {
      res
        .status(err.statusCode ?? 400)
        .json({ error: err.message ?? "Invalid Request" });
    } else if (err instanceof Error) {
      res.status(500).json({ error: err.message ?? "Failed to fetch clubs" });
    }
  }
}
