import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { makePaginatedSchema, type Paginated } from "../../utils/sharedSchemas";

extendZodWithOpenApi(z);

// List view
export const EventSummarySchema = z
  .object({
    id: z.uuid(),
    clubId: z.uuid(),
    imageUrl: z.string(),
    title: z.string(),
    location: z.string(),
    startDatetime: z.date(),
    endDatetime: z.date().nullable(),
    incentives: z.string().nullable(),
    campuses: z.array(z.string()).nullable(),
  })
  .openapi("EventSummary");

export type EventSummaryDTO = z.infer<typeof EventSummarySchema>;

export const PaginatedEventsSchema = makePaginatedSchema(
  EventSummarySchema,
  "PaginatedEvents"
);

export type PaginatedEvents = Paginated<EventSummaryDTO>;

/** Detail view (for GET /api/events/:id) */
export const EventDetailSchema = z
  .object({
    id: z.uuid(),
    clubId: z.uuid(),
    imageUrl: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    location: z.string(),
    startDatetime: z.date(),
    endDatetime: z.date().nullable(),
    incentives: z.string().nullable(),
    campuses: z.array(z.string()).nullable(),
    postUrl: z.string(),
  })
  .openapi("Event");

export type EventDetailDTO = z.infer<typeof EventDetailSchema>;

export type EventsFilters = {
  campusFilter: string[];
  interestsFilter: string[];
  searchFilter: string | undefined;
  rangeStart: Date;
  rangeEnd: Date | null;
};
