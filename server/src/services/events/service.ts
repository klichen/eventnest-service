import type { EventEntity } from "../../repos/events/entities";
import { EventsRepo } from "../../repos/events/repo";
import { calcOffset } from "../../utils/helpers";
import type { EventDTO, EventsFilters, PaginatedEvents } from "./schemas";

export class EventsService {
  constructor(private repo = new EventsRepo()) {}

  private toDTO(e: EventEntity): EventDTO {
    return {
      id: e.id,
      clubId: e.clubId,
      imageUrl: e.imageUrl,
      title: e.title,
      location: e.location,
      startDatetime: e.startDatetime,
      endDatetime: e.endDatetime,
      incentives: e.incentives,
      campuses: e.campuses,
    };
  }

  async listEvents(args: {
    page: number;
    limit: number;
    filters: EventsFilters;
  }): Promise<PaginatedEvents | Error> {
    const { offset, limit } = calcOffset({
      page: args.page,
      limit: args.limit,
    });

    const [clubEntities, totalEvents] = await Promise.all([
      this.repo.findEvents(offset, limit, args.filters),
      this.repo.countEvents(args.filters),
    ]);
    if (clubEntities instanceof Error) {
      throw clubEntities;
    }

    const totalPages = Math.max(1, Math.ceil(totalEvents / limit));
    const hasNext = args.page < totalPages;
    const clubDTO = clubEntities.map((e) => this.toDTO(e));
    return {
      pagination: {
        page: args.page,
        limit,
        totalPages,
        totalItems: totalEvents,
        hasNext,
      },
      data: clubDTO,
    };
  }

  async getEvent(id: string) {
    return this.repo.findByPostId(id);
  }
}
