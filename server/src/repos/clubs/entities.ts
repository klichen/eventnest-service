export interface ClubEntity {
  /* from clubs table */
  id: string;
  name: string;
  description: string | null;
  groupUrl: string | null;
  groupEmail: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  instagramUsername: string | null;
  campuses: string[];
  areasOfInterest: string[];
  connectedToEventNest: boolean;
}
