import type { Organization, User, Plan } from "./domain"

export interface Session {
  user: User
  organization: Organization | null
  plan: Plan
  expiresAt: string
}
