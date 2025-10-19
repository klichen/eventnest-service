export interface ClubSummaryEntity {
  id: string;
  name: string;
  description: string | null;
  campuses: string[];
  areasOfInterest: string[];
  connectedToEventNest: boolean;
}

export interface ClubEntity {
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
