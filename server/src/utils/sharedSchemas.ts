import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

// Reusable page meta + error
export const PageMetaSchema = z
  .object({
    page: z.int(),
    limit: z.int(),
    totalItems: z.int(),
    totalPages: z.int(),
    hasNext: z.boolean(),
  })
  .openapi("PageMeta");

export type PageMeta = z.infer<typeof PageMetaSchema>;

// Generic “Paginated<T>” Zod builder
export const makePaginatedSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
  componentName: string // e.g. "PaginatedClubs", "PaginatedEvents"
) =>
  z
    .object({
      pagination: PageMetaSchema,
      data: z.array(itemSchema),
    })
    .openapi(componentName);

// TS helper for the paginated type
export type Paginated<T> = {
  pagination: PageMeta;
  data: T[];
};

export const ErrorSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");
