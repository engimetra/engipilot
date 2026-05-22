import { Request } from "express"
import { JwtPayload } from "@/config/jwt"

// ── Authenticated Request ──────────────────────────────────────
export interface AuthRequest extends Request {
  user?: JwtPayload
}

// ── Paginated Query ────────────────────────────────────────────
export interface PaginationQuery {
  page?:    number
  limit?:   number
  search?:  string
  sortBy?:  string
  sortDir?: "asc" | "desc"
}

// ── Paginated Response ─────────────────────────────────────────
export interface PaginatedResult<T> {
  data:  T[]
  meta: {
    total:       number
    page:        number
    limit:       number
    totalPages:  number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// ── API Response ───────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  data?:   T
  message?: string
  errors?:  unknown
  meta?:    Record<string, unknown>
}
