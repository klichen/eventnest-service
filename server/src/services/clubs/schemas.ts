import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

// DTO
export const ClubDTOSchema = z
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
    sopPage: z.url().nullable(), // groupUrl
    contact: z.email().nullable(), // groupEmail
    connectedToEventNest: z.boolean(),
  })
  .openapi("Club");

export type ClubDTO = z.infer<typeof ClubDTOSchema>;

export const PageMetaSchema = z
  .object({
    page: z.int(),
    limit: z.int(),
    totalClubs: z.int(),
    totalPages: z.int(),
    hasNext: z.boolean(),
  })
  .openapi("PageMeta");

type PageMeta = z.infer<typeof PageMetaSchema>;

export const PaginatedClubsSchema = z
  .object({
    pagination: PageMetaSchema,
    data: z.array(ClubDTOSchema),
  })
  .openapi("PaginatedClubs");

export type PaginatedClubs = {
  pagination: PageMeta;
  data: ClubDTO[];
};

export const ErrorSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

export type ClubsFilter = {
  campusFilter: string[];
  interestsFilter: string[];
  searchFilter: string | undefined;
};
