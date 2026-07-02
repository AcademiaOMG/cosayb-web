import type { CurrentPlanData, PlanInfo } from "@/types/domain"
import type { ApiResponse } from "@/types/api"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// ─── Organizaciones ──────────────────────────────────────────────────────────

export async function getCurrentOrganization(): Promise<ApiResponse<{
  id: string
  name: string
  plan: string
  effectivePlan: string
  isTrialing: boolean
  trialExpired: boolean
  daysLeft: number
  trialEndsAt: string | null
  onboardingCompleted: boolean
}>> {
  return fetchAPI("/api/v1/organizations/me")
}

export async function updateOrganization(
  id: string,
  data: { name?: string; onboardingCompleted?: boolean }
): Promise<ApiResponse<{ id: string; name: string }>> {
  return fetchAPI(`/api/v1/organizations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

// ─── Planes ──────────────────────────────────────────────────────────────────

export async function getPlans(): Promise<{ data: PlanInfo[] }> {
  return fetchAPI("/api/v1/plans")
}

export async function getCurrentPlan(): Promise<{ data: CurrentPlanData }> {
  return fetchAPI("/api/v1/plans/current")
}

// ─── Perfil ─────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  name: string
  email: string
  image: string | null
  createdAt: string
}

export async function getMyProfile(): Promise<ApiResponse<UserProfile>> {
  return fetchAPI("/api/v1/me")
}

export async function updateMyProfile(
  data: { name: string }
): Promise<ApiResponse<{ name: string; email: string }>> {
  return fetchAPI("/api/v1/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

// ─── Miembros ───────────────────────────────────────────────────────────────

export interface OrgMember {
  userId: string
  name: string
  email: string
  role: string
  isOwner: boolean
  joinedAt: string
}

export async function getMembers(): Promise<ApiResponse<OrgMember[]>> {
  return fetchAPI("/api/v1/members")
}

export async function updateMemberRole(
  userId: string,
  role: string
): Promise<ApiResponse<{ role: string }>> {
  return fetchAPI(`/api/v1/members/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  })
}

export async function removeMember(userId: string): Promise<{ message: string }> {
  return fetchAPI(`/api/v1/members/${userId}`, { method: "DELETE" })
}

// ─── Invitaciones ───────────────────────────────────────────────────────────

export interface Invitation {
  id: string
  email: string
  role: string
  status: string
  createdAt: string
  expiresAt: string
  invitedByName: string
}

export async function getInvitations(): Promise<ApiResponse<Invitation[]>> {
  return fetchAPI("/api/v1/invitations")
}

export async function sendInvitation(
  email: string,
  role?: string
): Promise<ApiResponse<{ id: string }>> {
  return fetchAPI("/api/v1/invitations", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  })
}

export async function revokeInvitation(id: string): Promise<{ message: string }> {
  return fetchAPI(`/api/v1/invitations/${id}`, { method: "DELETE" })
}

export async function acceptInvitation(
  id: string
): Promise<ApiResponse<{ organizationId: string; role: string }>> {
  return fetchAPI(`/api/v1/invitations/${id}/accept`, { method: "POST" })
}

export interface InvitationDetail {
  id: string
  email: string
  role: string
  invitedByName: string
  organizationName: string
  expiresAt: string
}

export async function getInvitationById(
  id: string
): Promise<ApiResponse<InvitationDetail>> {
  return fetchAPI(`/api/v1/invitations/${id}`)
}
