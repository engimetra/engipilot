import { PaginationQuery, PaginatedResult } from "@/shared/types"

export function parsePagination(query: Record<string, unknown>): Required<Pick<PaginationQuery, "page" | "limit" | "sortDir">> & PaginationQuery {
  const page    = Math.max(1, Number(query.page)  || 1)
  const limit   = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const search  = typeof query.search === "string" ? query.search.trim() : undefined
  const sortBy  = typeof query.sortBy === "string" ? query.sortBy : "createdAt"
  const sortDir = query.sortDir === "asc" ? "asc" : "desc"

  return { page, limit, search, sortBy, sortDir }
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages  = Math.ceil(total / limit)
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  }
}

export function getPrismaSkip(page: number, limit: number): number {
  return (page - 1) * limit
}
