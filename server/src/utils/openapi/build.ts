// src/openapi/build.ts
import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from "@asteasolutions/zod-to-openapi";
import {
  ClubDTOSchema,
  PaginatedClubsSchema,
  ErrorSchema,
} from "../../services/clubs/schemas";

// if you expose fixed filter keys, enumerate them here for docs:
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

  // ---- Security scheme (X-API-Key header) ----
  registry.registerComponent("securitySchemes", "ApiKeyAuth", {
    type: "apiKey",
    in: "header",
    name: "X-API-Key",
  });

  // ---- Schemas (components.schemas) ----
  registry.register("Club", ClubDTOSchema);
  registry.register("PaginatedClubs", PaginatedClubsSchema);
  registry.register("ErrorResponse", ErrorSchema);

  // ---- Path: GET /api/v1/clubs ----
  registry.registerPath({
    method: "get",
    path: "/api/v1/clubs",
    tags: ["Clubs"],
    summary: "List clubs (paginated)",
    description:
      "Returns clubs with campuses, areas of interest, and connectivity flag.",
    security: [{ ApiKeyAuth: [] }], // omit for public routes
    // You can describe query params here.
    // For arrays in query, document as array with style=form & explode=false (comma-separated).
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
        description: "Filter by campus keys",
        required: false,
        schema: {
          type: "array",
          items: { enum: CAMPUS_KEYS as unknown as string[] },
        },
        style: "form",
        explode: false, // => comma-separated
        example: "campuses=usc,utem", // Swagger UI will render as CSV in URL
      },
      {
        in: "query",
        name: "interests",
        description: "Filter by interest keys",
        required: false,
        schema: {
          type: "array",
          items: { enum: INTEREST_KEYS as unknown as string[] },
        },
        style: "form",
        explode: false,
        example: "interests=media,academic",
      },
      {
        in: "query",
        name: "search",
        description:
          "Substring match on name and description (case-insensitive).",
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
                    totalClubs: 132,
                    totalPages: 3,
                    hasNext: true,
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
        description: "Bad Request (invalid filters or pagination)",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            examples: {
              sample: {
                value: {
                  error: "One or more filter values are invalid.",
                },
              },
            },
          },
        },
      },
      401: { description: "Missing or invalid API key" },
      500: { description: "Server error" },
    },
  });

  // ---- Final doc ----
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: { title: "EventNest API", version: "1.0.0" },
    servers: [
      { url: "http://localhost:3001", description: "Local" },
      { url: "https://api.example.com", description: "Production" },
    ],
  });
}
