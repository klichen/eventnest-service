import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { makePaginatedSchema, type Paginated } from "../../utils/sharedSchemas";

extendZodWithOpenApi(z);

// DTO
export const EventDTOSchema = z
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
  .openapi("Event");

export type EventDTO = z.infer<typeof EventDTOSchema>;

export const PaginatedEventsSchema = makePaginatedSchema(
  EventDTOSchema,
  "PaginatedEvents"
);

export type PaginatedEvents = Paginated<EventDTO>;

export type EventsFilters = {
  campusFilter: string[];
  interestsFilter: string[];
  searchFilter: string | undefined;
  rangeStart: Date;
  rangeEnd: Date | null;
};
