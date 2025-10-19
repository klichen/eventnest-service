// src/services/clubs/schemas.ts
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { makePaginatedSchema, type Paginated } from "../../utils/sharedSchemas";

extendZodWithOpenApi(z);

/** List item / card view */
export const ClubSummarySchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    campuses: z.array(z.string()).nullable(),
    areasOfInterest: z.array(z.string()),
    connectedToEventNest: z.boolean(),
  })
  .openapi("ClubSummary");

export type ClubSummaryDTO = z.infer<typeof ClubSummarySchema>;

/** Detail view (safe to extend later with more fields) */
export const ClubDetailSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    campuses: z.array(z.string()).nullable(),
    areasOfInterest: z.array(z.string()),
    socials: z.object({
      facebook: z.url().nullable(),
      twitter: z.url().nullable(),
      instagram: z.url().nullable(),
      website: z.url().nullable(),
    }),
    sopPage: z.url().nullable(),
    contact: z.email().nullable(),
    connectedToEventNest: z.boolean(),

    // --- add detail-only fields here later ---
    // longDescription: z.string().nullable().optional(),
    // links: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
  })
  .openapi("ClubDetail");

export type ClubDetailDTO = z.infer<typeof ClubDetailSchema>;

/** Paginated list of summaries */
export const PaginatedClubsSchema = makePaginatedSchema(
  ClubSummarySchema,
  "PaginatedClubs"
);
export type PaginatedClubs = Paginated<ClubSummaryDTO>;

/** Filters for service/repo */
export type ClubsFilter = {
  campusFilter: string[];
  interestsFilter: string[];
  searchFilter: string | undefined;
};
