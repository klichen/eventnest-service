import { type Request, type Response } from "express";
import { z } from "zod";
import { HttpError } from "../utils/errors";
import {
  findInvalid,
  normalize,
  parseDateOnly,
  splitCsv,
  endOfDayUTC,
  startOfDayUTC,
  endOfCurrentWeekUTC,
} from "../utils/helpers";
import { ALLOWED_CAMPUS_KEYS, ALLOWED_INTEREST_KEYS } from "../utils/constants";
import { EventsService } from "../services/events/service";

const eventsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  campuses: z.string().trim().optional(), // comma-separated
  interests: z.string().trim().optional(), // comma-separated
  search: z.string().trim().optional(),
  start: z.string().trim().optional(), // YYYY-MM-DD
  end: z.string().trim().optional(), // YYYY-MM-DD
});

const eventsQueryFixedRange = eventsQuery.omit({
  start: true,
  end: true,
});

export async function getAllEvents(req: Request, res: Response) {
  try {
    const q = eventsQuery.safeParse(req.query);
    if (!q.success) {
      throw new HttpError(`Invalid query parameters: ${q.error}`, 400);
    }

    const { campuses, interests, search, page, limit, start, end } = q.data;

    // --- Validate date strings (format + real calendar date) ---
    const startDate = parseDateOnly(start);
    if (start && !startDate) {
      throw new HttpError(
        `Invalid 'start' date. Use YYYY-MM-DD (e.g., 2025-01-31) and a real calendar date.`,
        400
      );
    }
    const endDate = parseDateOnly(end);
    if (end && !endDate) {
      throw new HttpError(
        `Invalid 'end' date. Use YYYY-MM-DD (e.g., 2025-01-31) and a real calendar date.`,
        400
      );
    }

    if (startDate && endDate && startDate > endDate) {
      throw new HttpError(`'start' must be on or before 'end'.`, 400);
    }

    // default to only show events starting from current date
    const rangeStart = startDate ?? new Date();
    const rangeEnd = endDate ? endOfDayUTC(endDate) : null;

    // --- Validate campus and interests filters ---
    const keysOrError = _validateFilters(campuses, interests);
    if (keysOrError instanceof HttpError) throw keysOrError;
    const { campusKeys, interestKeys } = keysOrError;

    const eventsService = new EventsService();
    const result = await eventsService.listEvents({
      page,
      limit,
      filters: {
        campusFilter: campusKeys,
        interestsFilter: interestKeys,
        searchFilter: search,
        rangeStart,
        rangeEnd,
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

export async function getTodayEvents(req: Request, res: Response) {
  try {
    const q = eventsQueryFixedRange.safeParse(req.query);
    if (!q.success) {
      throw new HttpError(`Invalid query parameters: ${q.error}`, 400);
    }

    const { campuses, interests, search, page, limit } = q.data;

    // TODAY's events
    const today = new Date();
    const rangeStart = startOfDayUTC(today);
    const rangeEnd = endOfDayUTC(today);

    // --- Validate campus and interests filters ---
    const keysOrError = _validateFilters(campuses, interests);
    if (keysOrError instanceof HttpError) throw keysOrError;
    const { campusKeys, interestKeys } = keysOrError;

    const eventsService = new EventsService();
    const result = await eventsService.listEvents({
      page,
      limit,
      filters: {
        campusFilter: campusKeys,
        interestsFilter: interestKeys,
        searchFilter: search,
        rangeStart,
        rangeEnd,
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

export async function getWeekEvents(req: Request, res: Response) {
  try {
    const q = eventsQueryFixedRange.safeParse(req.query);
    if (!q.success) {
      throw new HttpError(`Invalid query parameters: ${q.error}`, 400);
    }

    const { campuses, interests, search, page, limit } = q.data;

    // TODAY's events
    const today = new Date();
    const rangeStart = startOfDayUTC(today);
    const rangeEnd = endOfCurrentWeekUTC(today);
    console.log(rangeEnd);
    // --- Validate campus and interests filters ---
    const keysOrError = _validateFilters(campuses, interests);
    if (keysOrError instanceof HttpError) throw keysOrError;
    const { campusKeys, interestKeys } = keysOrError;

    const eventsService = new EventsService();
    const result = await eventsService.listEvents({
      page,
      limit,
      filters: {
        campusFilter: campusKeys,
        interestsFilter: interestKeys,
        searchFilter: search,
        rangeStart,
        rangeEnd,
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

function _validateFilters(
  campuses: string | undefined,
  interests: string | undefined
) {
  // --- Validate campus and interests filters ---
  const campusKeys = campuses ? normalize(splitCsv(campuses)) : [];
  const interestKeys = interests ? normalize(splitCsv(interests)) : [];

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
    return new HttpError(errMsg, 400);
  }

  return { campusKeys, interestKeys };
}
