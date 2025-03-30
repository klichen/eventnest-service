import { z } from "zod";

const SocialMediaSchema = z.object({
  facebook: z.string().nullable(),
  twitter: z.string().nullable(),
  instagram: z.string().nullable(),
  website: z.string().nullable(),
});

const MemberSchema = z.object({
  utorid: z.any(),
  name: z.any(),
  email: z.any(),
  position: z.any(),
  primaryContact: z.any(),
  administrativeContact: z.any(),
});

const CampusSchema = z.object({
  id: z.number(),
  key: z.string(),
  value: z.string(),
});

const AreaOfInterestSchema = z.object({
  id: z.number(),
  key: z.string(),
  value: z.string(),
});

const ClubSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  group_Type: z.string().nullish(),
  group_Url: z.string(),
  street: z.string().nullish(),
  street2: z.string().nullish(),
  city: z.string().nullish(),
  province: z.string().nullish(),
  postal: z.string().nullish(),
  group_Phone: z.string().nullish(),
  group_Email: z.string().nullish(),
  expires: z.string(),
  number_Of_Members: z.string().nullish(),
  createdDate: z.string().nullish(),
  lastModifiedDate: z.string(),
  constitution: z.string().nullish(),
  social_Media: SocialMediaSchema,
  members: z.array(MemberSchema).nullish(),
  campus: z.array(CampusSchema).nullish(),
  areas_Of_Interest: z.array(AreaOfInterestSchema).nullish(),
});

export const ClubArraySchema = z.array(ClubSchema);
export type Club = z.infer<typeof ClubSchema>;
export type Campus = z.infer<typeof CampusSchema>;
export type AreaofInterest = z.infer<typeof AreaOfInterestSchema>;
