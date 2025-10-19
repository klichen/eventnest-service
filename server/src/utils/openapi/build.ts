import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from "@asteasolutions/zod-to-openapi";
import {
  ClubSummarySchema,
  PaginatedClubsSchema,
} from "../../services/clubs/schemas";
import {
  EventSummarySchema,
  PaginatedEventsSchema,
} from "../../services/events/schemas";
import { ErrorSchema } from "../sharedSchemas";
import "dotenv/config";

// Fixed keys for docs
const CAMPUS_KEYS = ["st-george", "utm", "utsc"] as const;
const INTEREST_KEYS = [
  "academic",
  "arts",
  "athletics-recreation",
  "community-service",
  "culture-identities",
  "environment-sustainability",
  "global-interests",
  "hobby-leisure",
  "leadership",
  "media",
  "politics",
  "social",
  "social-justice-advocacy",
  "spirituality-faith-communities",
  "student-governments-councils-unions",
  "work-career-development",
] as const;

export function buildOpenAPIDocument() {
  const registry = new OpenAPIRegistry();

  // Security
  registry.registerComponent("securitySchemes", "ApiKeyAuth", {
    type: "apiKey",
    in: "header",
    name: "X-API-Key",
  });

  // Schemas
  registry.register("ClubSummary", ClubSummarySchema);
  registry.register("PaginatedClubs", PaginatedClubsSchema);
  registry.register("EventSummary", EventSummarySchema);
  registry.register("PaginatedEvents", PaginatedEventsSchema);
  registry.register("ErrorResponse", ErrorSchema);

  /* ----------------------------- Clubs path ----------------------------- */
  registry.registerPath({
    method: "get",
    path: "/api/clubs",
    tags: ["Clubs"],
    summary: "List clubs (paginated)",
    description:
      "Returns clubs with campuses, areas of interest, and connectivity flag.",
    security: [{ ApiKeyAuth: [] }],
    parameters: [
      {
        in: "query",
        name: "page",
        description: "1-based page index",
        required: false,
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      {
        in: "query",
        name: "limit",
        description: "Page size",
        required: false,
        schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
      },
      {
        in: "query",
        name: "campuses",
        description: "Filter by campus keys (CSV).",
        required: false,
        schema: {
          type: "array",
          items: { type: "string", enum: [...CAMPUS_KEYS] },
        },
        style: "form",
        explode: false,
        example: ["st-george", "utsc"],
      },
      {
        in: "query",
        name: "interests",
        description: "Filter by interest keys (CSV).",
        required: false,
        schema: {
          type: "array",
          items: { type: "string", enum: [...INTEREST_KEYS] },
        },
        style: "form",
        explode: false,
        example: ["media", "academic"],
      },
      {
        in: "query",
        name: "search",
        description: "Substring match on name/description (case-insensitive).",
        required: false,
        schema: { type: "string" },
        example: "board games",
      },
    ],
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PaginatedClubs" },
            examples: {
              sample: {
                value: {
                  meta: {
                    page: 1,
                    limit: 50,
                    total: 132,
                    totalPages: 3,
                    hasNext: true,
                    hasPrev: false,
                  },
                  data: [
                    {
                      id: "2a1a5e4b-7f0d-4a21-b72d-7a5b5b3b5b20",
                      name: "UofT Board Games",
                      description: "Weekly board game nights.",
                      campuses: ["St George", "UTSC"],
                      areasOfInterest: ["Hobby & Leisure", "Social"],
                      socials: {
                        facebook: null,
                        twitter: null,
                        instagram: "https://instagram.com/uoftboardgames",
                        website: null,
                      },
                      sopPage: "https://clubs.uoft.ca/boardgames",
                      contact: "club@uoft.ca",
                      connectedToEventNest: true,
                    },
                  ],
                },
              },
            },
          },
        },
      },
      400: {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      401: { description: "Missing or invalid API key" },
      500: { description: "Server error" },
    },
  });

  /* ----------------------------- Events paths ---------------------------- */

  // GET /api/events  (date-range capable)
  registry.registerPath({
    method: "get",
    path: "/api/events",
    tags: ["Events"],
    summary: "List events (paginated)",
    description:
      "Returns events with optional filters and a date range. If no range is provided, defaults to starting today.",
    security: [{ ApiKeyAuth: [] }],
    parameters: [
      {
        in: "query",
        name: "page",
        description: "1-based page index",
        required: false,
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      {
        in: "query",
        name: "limit",
        description: "Page size",
        required: false,
        schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
      },
      {
        in: "query",
        name: "campuses",
        description: "Filter by campus keys (CSV).",
        required: false,
        schema: {
          type: "array",
          items: { type: "string", enum: [...CAMPUS_KEYS] },
        },
        style: "form",
        explode: false,
        example: ["st-george", "utsc"],
      },
      {
        in: "query",
        name: "interests",
        description: "Filter by interest keys (CSV).",
        required: false,
        schema: {
          type: "array",
          items: { type: "string", enum: [...INTEREST_KEYS] },
        },
        style: "form",
        explode: false,
        example: ["media", "academic"],
      },
      {
        in: "query",
        name: "search",
        description:
          "Substring match on event title, description, ig post caption, and club name",
        required: false,
        schema: { type: "string" },
        example: "board games",
      },

      // Date range (YYYY-MM-DD)
      {
        in: "query",
        name: "start",
        description: "Inclusive start date (YYYY-MM-DD).",
        required: false,
        schema: { type: "string", format: "date" },
        example: "2025-09-01",
      },
      {
        in: "query",
        name: "end",
        description: "Inclusive end date (YYYY-MM-DD).",
        required: false,
        schema: { type: "string", format: "date" },
        example: "2025-09-07",
      },
    ],
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PaginatedEvents" },
            examples: {
              sample: {
                value: {
                  pagination: {
                    page: 1,
                    limit: 50,
                    totalPages: 2,
                    totalItems: 62,
                    hasNext: true,
                  },
                  data: [
                    {
                      id: "9e9d3f5e-3e2a-4f24-8f0b-2a8f1f9ec0d1",
                      clubId: "2a1a5e4b-7f0d-4a21-b72d-7a5b5b3b5b20",
                      imageUrl:
                        "https://cdn.example.com/events/welcome-week.jpg",
                      title: "Welcome Week Fair",
                      location: "Front Campus",
                      startDatetime: "2025-09-01T15:00:00.000Z",
                      endDatetime: "2025-09-01T19:00:00.000Z",
                      incentives: "Free pizza",
                      campuses: ["St George"],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      400: {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      401: { description: "Missing or invalid API key" },
      500: { description: "Server error" },
    },
  });

  // GET /api/events/today
  registry.registerPath({
    method: "get",
    path: "/api/events/today",
    tags: ["Events"],
    summary: "List today's events",
    description:
      "Returns events occurring today (server local date), with same filters as /api/events except date range is fixed.",
    security: [{ ApiKeyAuth: [] }],
    parameters: [
      {
        in: "query",
        name: "page",
        required: false,
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      {
        in: "query",
        name: "limit",
        required: false,
        schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
      },
      {
        in: "query",
        name: "campuses",
        required: false,
        description: "Filter by campus keys (CSV).",
        schema: {
          type: "array",
          items: { type: "string", enum: [...CAMPUS_KEYS] },
        },
        style: "form",
        explode: false,
        example: ["st-george"],
      },
      {
        in: "query",
        name: "interests",
        required: false,
        description: "Filter by interest keys (CSV).",
        schema: {
          type: "array",
          items: { type: "string", enum: [...INTEREST_KEYS] },
        },
        style: "form",
        explode: false,
        example: ["academic"],
      },
      {
        in: "query",
        name: "search",
        required: false,
        schema: { type: "string" },
        example: "seminar",
      },
    ],
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PaginatedEvents" },
            examples: {
              sample: {
                value: {
                  pagination: {
                    page: 1,
                    limit: 50,
                    totalPages: 1,
                    totalItems: 8,
                    hasNext: false,
                  },
                  data: [
                    {
                      id: "c2c7a4f1-1c1d-4a97-b55c-2c2b9b8f0a22",
                      clubId: "a1a5e4b7-f0d4-421b-b72d-7a5b5b3b5b20",
                      imageUrl:
                        "https://cdn.example.com/events/math-seminar.png",
                      title: "Math Department Seminar",
                      location: "BA 1130",
                      startDatetime: "2025-10-14T14:00:00.000Z",
                      endDatetime: "2025-10-14T15:30:00.000Z",
                      incentives: null,
                      campuses: ["St George"],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      400: {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      401: { description: "Missing or invalid API key" },
      500: { description: "Server error" },
    },
  });

  // GET /api/events/this-week
  registry.registerPath({
    method: "get",
    path: "/api/events/this-week",
    tags: ["Events"],
    summary: "List events for the rest of this week",
    description:
      "Returns events from today through the end of the current week. Same filters as /api/events; date range is fixed. Considers Sunday as end of week.",
    security: [{ ApiKeyAuth: [] }],
    parameters: [
      {
        in: "query",
        name: "page",
        required: false,
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      {
        in: "query",
        name: "limit",
        required: false,
        schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
      },
      {
        in: "query",
        name: "campuses",
        required: false,
        description: "Filter by campus keys (CSV).",
        schema: {
          type: "array",
          items: { type: "string", enum: [...CAMPUS_KEYS] },
        },
        style: "form",
        explode: false,
        example: ["utm"],
      },
      {
        in: "query",
        name: "interests",
        required: false,
        description: "Filter by interest keys (CSV).",
        schema: {
          type: "array",
          items: { type: "string", enum: [...INTEREST_KEYS] },
        },
        style: "form",
        explode: false,
        example: ["leadership", "social"],
      },
      {
        in: "query",
        name: "search",
        required: false,
        schema: { type: "string" },
        example: "info session",
      },
    ],
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PaginatedEvents" },
            examples: {
              sample: {
                value: {
                  pagination: {
                    page: 1,
                    limit: 50,
                    totalPages: 3,
                    totalItems: 104,
                    hasNext: true,
                  },
                  data: [
                    {
                      id: "d4e8f1a2-1111-4bb2-8a99-0b2a0d9f1e33",
                      clubId: "bb1b9f2d-2222-4c55-8e31-0aa9e8f2b3c4",
                      imageUrl:
                        "https://cdn.example.com/events/leadership-summit.jpg",
                      title: "Leadership Summit",
                      location: "UTM Student Centre",
                      startDatetime: "2025-10-16T17:00:00.000Z",
                      endDatetime: "2025-10-16T20:00:00.000Z",
                      incentives: "Snacks provided",
                      campuses: ["UTM"],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      400: {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      401: { description: "Missing or invalid API key" },
      500: { description: "Server error" },
    },
  });

  /* --------------------------- Final document --------------------------- */
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    // If swagger-ui gets fussy with 3.1.0, use "3.0.3"
    openapi: "3.1.0",
    info: { title: "EventNest API", version: "1.0.0" },
    servers: [
      { url: process.env.HOST_URL ?? "/", description: "Default" },
      { url: "http://localhost:8080", description: "Local" },
    ],
    // Optionally require API key globally:
    // security: [{ ApiKeyAuth: [] }],
  });
}
