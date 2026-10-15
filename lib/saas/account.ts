// Operaciones sobre entidades REALES del API (cuenta, sesiones, organización, invitaciones,
// uso del plan). No pasan por la frontera mock/real: simularlas sería borrar o fingir datos
// de verdad. Contrato: docs/SAAS_API_CONTRATO.md §1, §2, §4 y §5 del repo del API.

import { usageFromApi } from "./adapters"
import { json, saasData } from "./real"
import type { PlanUsage } from "./types"

const API = "/api/v1"

// ── Sesiones activas ────────────────────────────────────────────────────────

export interface ActiveSession {
  id: string
  current: boolean
  ipAddress: string | null
  userAgent: string | null
  /** «Chrome en Windows» */
  device: string
  createdAt: string
  expiresAt: string
}

export const listSessions = () => saasData<ActiveSession[]>(`${API}/me/sessions`)

export const revokeSession = (id: string) =>
  saasData<{ revoked: number }>(`${API}/me/sessions/${encodeURIComponent(id)}`, { method: "DELETE" })

/** Cierra todas las sesiones menos la actual. */
export const revokeOtherSessions = () => saasData<{ revoked: number }>(`${API}/me/sessions`, { method: "DELETE" })

// ── Borrar cuenta ───────────────────────────────────────────────────────────

export interface BlockingOrg {
  id: string
  name: string
  members: number
}

export const deleteAccount = (input: { confirmEmail: string; password?: string }) =>
  saasData<{ deleted: boolean; deletedOrganizations: string[] }>(`${API}/me`, {
    method: "DELETE",
    body: JSON.stringify(input),
  })

/** Extrae las organizaciones que bloquean el borrado de un error 409 OWNS_ORG_WITH_MEMBERS. */
export function blockingOrgsFrom(details: unknown): BlockingOrg[] {
  const list = (details as { blocking?: unknown })?.blocking
  return Array.isArray(list) ? (list as BlockingOrg[]) : []
}

// ── Organización y equipo ───────────────────────────────────────────────────

export const leaveOrganization = () => saasData<{ organizationId: string }>(`${API}/organizations/me/leave`, json({}))

export const transferOwnership = (newOwnerUserId: string) =>
  saasData<{ organizationId: string; ownerId: string }>(`${API}/organizations/me/transfer-ownership`, json({ newOwnerUserId }))

export const deleteOrganization = (confirmName: string) =>
  saasData<{ deleted: boolean }>(`${API}/organizations/me`, { method: "DELETE", body: JSON.stringify({ confirmName }) })

export const resendInvitation = (id: string) =>
  saasData<{ id: string; email: string; expiresAt: string }>(`${API}/invitations/${encodeURIComponent(id)}/resend`, json({}))

// ── Uso del plan ────────────────────────────────────────────────────────────

export async function getPlanUsage(): Promise<PlanUsage> {
  return usageFromApi(await saasData<{ membership: string; items: PlanUsage["items"] }>(`${API}/billing/usage`))
}

// ── Plataforma ──────────────────────────────────────────────────────────────

/** Reenvía el correo de verificación a un usuario (409 ALREADY_VERIFIED si ya lo verificó). */
export const platformResendVerification = (userId: string) =>
  saasData<{ sent: boolean }>(`${API}/platform/users/${encodeURIComponent(userId)}/resend-verification`, json({}))

// ── Auditoría de la organización ────────────────────────────────────────────

export interface AuditEntry {
  id: string
  action: string
  actorUserId: string | null
  resourceType?: string | null
  resourceId?: string | null
  justification: string | null
  impersonated?: boolean
  createdAt: string
}

export const getOrganizationAudit = (limit = 50, offset = 0) =>
  saasData<AuditEntry[]>(`${API}/organizations/me/audit?limit=${limit}&offset=${offset}`)

const AUDIT_LABELS: Record<string, string> = {
  "organization.create": "Se creó la organización",
  "organization.delete": "Se eliminó una organización",
  "organization.transfer_ownership": "Se transfirió la propiedad",
  "invitation.create": "Se envió una invitación",
  "invitation.accept": "Se aceptó una invitación",
  "invitation.resend": "Se reenvió una invitación",
  "member.role_change": "Se cambió el rol de un miembro",
  "member.remove": "Se eliminó a un miembro",
  "member.leave": "Un miembro salió del negocio",
  "billing.subscription.activate": "Se activó la suscripción",
  "billing.subscription.renew": "Se renovó la suscripción",
  "billing.subscription.cancel": "Se programó la cancelación de la suscripción",
  "billing.subscription.resume": "Se reanudó la suscripción",
  "billing.subscription.expire": "Venció la suscripción",
  "billing.subscription.cancel_nonpayment": "Se canceló la suscripción por falta de pago",
  "billing.payment.failed": "Falló un cobro",
  "security.login": "Inicio de sesión",
  "security.password_changed": "Se cambió la contraseña",
  "security.password_reset": "Se restableció la contraseña",
  "security.email_verified": "Se verificó el correo",
  "security.email_change_requested": "Se solicitó cambiar el correo",
  "security.session_revoked": "Se cerró una sesión",
  "security.sessions_revoked": "Se cerraron las demás sesiones",
  "impersonation.start": "Inició una sesión de soporte",
  "impersonation.elevate": "Habilitó edición durante soporte",
  "impersonation.end": "Terminó la sesión de soporte",
}

export function auditLabel(action: string): string {
  if (AUDIT_LABELS[action]) return AUDIT_LABELS[action]
  if (action.startsWith("impersonation.write.")) return "Realizó un cambio durante soporte"
  if (action.startsWith("platform.")) return "Acción del equipo de soporte de la plataforma"
  return action
}
