import type { ClubEntity } from "../../repos/clubs/entities";
import { ClubsRepo } from "../../repos/clubs/repo";
import { calcOffset } from "../../utils/helpers";
import type { ClubDTO } from "./dto";
import type { ClubsFilter } from "./types";

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

  // TODO implement filters
  async listClubs(args: {
    page?: number;
    limit?: number;
    filters: ClubsFilter;
  }): Promise<ClubDTO[] | Error> {
    const { offset, limit } = calcOffset({
      page: args.page,
      limit: args.limit,
    });
    console.log("LIMIT", limit);
    const clubEntities = await this.repo.findClubs(offset, limit, args.filters);
    if (clubEntities instanceof Error) {
      throw clubEntities;
    }
    const clubDTOs = clubEntities.map((e) => this.toDTO(e));
    return clubDTOs;
  }

  async getClub(id: string) {
    return this.repo.findById(id);
  }
}
