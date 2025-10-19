import type { EventEntity } from "../../repos/events/entities";
import { EventsRepo } from "../../repos/events/repo";
import { HttpError } from "../../utils/errors";
import { calcOffset } from "../../utils/helpers";
import type {
  EventDetailDTO,
  EventSummaryDTO,
  EventsFilters,
  PaginatedEvents,
} from "./schemas";

export class EventsService {
  constructor(private repo = new EventsRepo()) {}

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
    const clubDTO = clubEntities.map((e) => this.toSummaryDTO(e));
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
    const eventEntityOrError = await this.repo.findById(id);
    if (!eventEntityOrError) return new HttpError("Event not found", 404);
    if (eventEntityOrError instanceof Error) return eventEntityOrError;
    return this.toDetailDTO(eventEntityOrError);
  }

  private toSummaryDTO(e: EventEntity): EventSummaryDTO {
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

  private toDetailDTO(e: EventEntity): EventDetailDTO {
    return {
      id: e.id,
      clubId: e.clubId,
      imageUrl: e.imageUrl,
      postUrl: e.postUrl,
      title: e.title,
      description: e.description,
      location: e.location,
      startDatetime: e.startDatetime,
      endDatetime: e.endDatetime,
      incentives: e.incentives,
      campuses: e.campuses,
    };
  }
}
