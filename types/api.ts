// TODO: Generate types from OpenAPI spec when backend is ready
// Run: pnpm dlx openapi-typescript http://api.cosayb.com/openapi.json -o types/api.ts

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  code?: string
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
