import type { ClubEntity, ClubSummaryEntity } from "../../repos/clubs/entities";
import { ClubsRepo } from "../../repos/clubs/repo";
import { HttpError } from "../../utils/errors";
import { calcOffset } from "../../utils/helpers";
import type { ClubDetailDTO, ClubSummaryDTO } from "./schemas";
import type { ClubsFilter, PaginatedClubs } from "./schemas";

export class ClubsService {
  constructor(private repo = new ClubsRepo()) {}

  async listClubs(args: {
    page: number;
    limit: number;
    filters: ClubsFilter;
  }): Promise<PaginatedClubs | Error> {
    const { offset, limit } = calcOffset({
      page: args.page,
      limit: args.limit,
    });
    // const clubEntities = await this.repo.findClubs(offset, limit, args.filters);
    const [clubSummaries, totalClubs] = await Promise.all([
      this.repo.findClubs(offset, limit, args.filters),
      this.repo.countClubs(args.filters),
    ]);
    if (clubSummaries instanceof Error) {
      throw clubSummaries;
    }

    const totalPages = Math.max(1, Math.ceil(totalClubs / limit));
    const hasNext = args.page < totalPages;
    const clubs = clubSummaries.map((e) => this.toSummaryDTO(e));
    return {
      pagination: {
        page: args.page,
        limit,
        totalPages,
        totalItems: totalClubs,
        hasNext,
      },
      data: clubs,
    };
  }

  async getClub(id: string) {
    const clubEntityOrError = await this.repo.findById(id);
    if (!clubEntityOrError) return new HttpError("Club not found", 404);
    if (clubEntityOrError instanceof Error) return clubEntityOrError;
    return this.toDetailDTO(clubEntityOrError);
  }

  private toSummaryDTO(e: ClubSummaryEntity): ClubSummaryDTO {
    return {
      id: e.id,
      name: e.name,
      description: e.description,
      campuses: e.campuses,
      areasOfInterest: e.areasOfInterest,
      connectedToEventNest: e.connectedToEventNest,
    };
  }

  private toDetailDTO(e: ClubEntity): ClubDetailDTO {
    return {
      id: e.id,
      name: e.name,
      description: e.description,
      campuses: e.campuses,
      areasOfInterest: e.areasOfInterest,
      socials: {
        facebook: e.facebookUrl,
        twitter: e.twitterUrl,
        instagram: e.instagramUrl,
        website: e.websiteUrl,
      },
      sopPage: e.groupUrl,
      contact: e.groupEmail,
      connectedToEventNest: e.connectedToEventNest,
    };
  }
}
