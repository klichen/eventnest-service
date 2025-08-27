import type { ClubEntity } from "../../repos/clubs/entities";
import { ClubsRepo } from "../../repos/clubs/repo";
import { calcOffset } from "../../utils/helpers";
import type { ClubDTO } from "./schemas";
import type { ClubsFilter, PaginatedClubs } from "./schemas";

export class ClubsService {
  constructor(private repo = new ClubsRepo()) {}

  private toDTO(e: ClubEntity): ClubDTO {
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
    const [clubEntities, totalClubs] = await Promise.all([
      this.repo.findClubs(offset, limit, args.filters),
      this.repo.countClubs(args.filters),
    ]);
    if (clubEntities instanceof Error) {
      throw clubEntities;
    }

    const totalPages = Math.max(1, Math.ceil(totalClubs / limit));
    const hasNext = args.page < totalPages;
    const clubDTO = clubEntities.map((e) => this.toDTO(e));
    return {
      pagination: {
        page: args.page,
        limit,
        totalPages,
        totalClubs,
        hasNext,
      },
      data: clubDTO,
    };
  }

  async getClub(id: string) {
    return this.repo.findById(id);
  }
}
