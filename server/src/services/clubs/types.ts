import type { ClubDTO } from "./dto";

export type ClubsFilter = {
  campusFilter: string[];
  interestsFilter: string[];
  searchFilter: string | undefined;
};

type PageMeta = {
  page: number;
  limit: number;
  totalClubs: number;
  totalPages: number;
  hasNext: boolean;
};

export type PaginatedResponse = {
  pagination: PageMeta;
  data: ClubDTO[];
};
