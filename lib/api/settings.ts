import type { CurrentPlanData, PlanInfo } from "@/types/domain"
import type { ApiResponse } from "@/types/api"
import { fetchAPI } from "./index"

// ─── Organizaciones ──────────────────────────────────────────────────────────

export async function getCurrentOrganization(): Promise<ApiResponse<{
  id: string
  name: string
  membership: string
  effectiveMembership: string
  isTrialing: boolean
  trialExpired: boolean
  daysLeft: number
  trialEndsAt: string | null
  onboardingCompleted: boolean
  myRoles: string[]
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
  roles: { slug: string; name: string }[]
  isOwner: boolean
  status: string
  joinedAt: string
}

export async function getMembers(): Promise<ApiResponse<OrgMember[]>> {
  return fetchAPI("/api/v1/members")
}

export async function updateMemberRole(
  userId: string,
  roleSlug: string
): Promise<ApiResponse<{ role: string }>> {
  return fetchAPI(`/api/v1/members/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ roleSlug }),
  })
}

export async function removeMember(userId: string): Promise<{ message: string }> {
  return fetchAPI(`/api/v1/members/${userId}`, { method: "DELETE" })
}

// ─── Invitaciones ───────────────────────────────────────────────────────────

export interface Invitation {
  id: string
  email: string
  roleSlug: string
  roleName: string
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
  roleSlug: string
): Promise<ApiResponse<{ id: string }>> {
  return fetchAPI("/api/v1/invitations", {
    method: "POST",
    body: JSON.stringify({ email, roleSlug }),
  })
}

export async function revokeInvitation(id: string): Promise<{ message: string }> {
  return fetchAPI(`/api/v1/invitations/${id}`, { method: "DELETE" })
}

export async function acceptInvitation(
  id: string
): Promise<ApiResponse<{ organizationId: string }>> {
  return fetchAPI(`/api/v1/invitations/${id}/accept`, { method: "POST" })
}

export interface InvitationDetail {
  id: string
  email: string
  roleSlug: string
  roleName: string
  invitedByName: string
  organizationName: string
  expiresAt: string
}

export async function getInvitationById(
  id: string
): Promise<ApiResponse<InvitationDetail>> {
  return fetchAPI(`/api/v1/invitations/${id}`)
}
