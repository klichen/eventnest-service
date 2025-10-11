import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { makePaginatedSchema, type Paginated } from "../../utils/sharedSchemas";

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

export const PaginatedClubsSchema = makePaginatedSchema(
  ClubDTOSchema,
  "PaginatedClubs"
);

export type PaginatedClubs = Paginated<ClubDTO>;

export type ClubsFilter = {
  campusFilter: string[];
  interestsFilter: string[];
  searchFilter: string | undefined;
};
