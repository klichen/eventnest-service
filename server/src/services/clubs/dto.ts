import { z } from "zod";

export const ClubDTO = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  campuses: z.array(z.string()).nullable(),
  areasOfInterest: z.array(z.string()),
  socials: z.object({
    facebook: z.string().url().nullable(),
    twitter: z.string().url().nullable(),
    instagram: z.string().url().nullable(),
    website: z.string().url().nullable(),
  }),
  sopPage: z.string().url().nullable(), // groupUrl
  contact: z.string().email().nullable(), // groupEmail
  connectedToEventNest: z.boolean(),
});

export type ClubDTO = z.infer<typeof ClubDTO>;
