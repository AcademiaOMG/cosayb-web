"use client"

import { useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { Eye, Send, Trash2 } from "lucide-react"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import ActionCard from "@/components/plataforma/clientes/ActionCard"
import OrgSupportActions from "@/components/saas/OrgSupportActions"
import { usePermissions } from "@/hooks/usePermissions"
import { platformRemoveUserOrgMembership, platformSetOrgStatus, platformSetUserOrgRole, platformStartImpersonation } from "@/lib/api"
import { friendlyError } from "@/lib/errorMessage"
import {
  PLAN_NAMES, TRIAL_NAMES, addOrgNote, deleteOrgNote, extendOrgTrial, getOrgTeam, lastSeenLabel, listOrgNotes, resendOrgInvitation,
  type OrgOverview, type OrgTeam,
} from "@/lib/plataforma/clientes"
import { roleLabel } from "@/lib/plataforma/labels"
import { fmtDate, formatCOP, timeAgoEs } from "@/lib/saas/format"
import { toast } from "@/lib/toast"

const ORG_ROLE_SLUGS = ["org_owner", "org_manager", "org_viewer"] as const
const SUB_STATUS: Record<string, string> = { ACTIVE: "Al día", PAST_DUE: "Pago atrasado", PENDING: "Pendiente", CANCELLED: "Cancelada" }
const INVITE_STATUS: Record<string, string> = { pending: "Pendiente", accepted: "Aceptada", revoked: "Cancelada", expired: "Vencida" }

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="console-card">
      <p className="text-[11px] font-bold tracking-widest console-muted mb-2">{label.toUpperCase()}</p>
      <div className="text-sm font-semibold console-title">{children}</div>
    </div>
  )
}

// ─── Resumen ─────────────────────────────────────────────────────────────────
export function ResumenSection({ org }: { org: OrgOverview }) {
  const trial =
    org.trial.state === "active" ? `Hasta el ${fmtDate(org.trial.endsAt, "short")} (${org.trial.daysLeft} ${org.trial.daysLeft === 1 ? "día" : "días"})`
    : org.trial.state === "expired" ? `Venció el ${fmtDate(org.trial.endsAt, "short")}`
    : TRIAL_NAMES.none
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Fact label="Plan">{PLAN_NAMES[org.membership]}</Fact>
        <Fact label="Prueba">{trial}</Fact>
        <Fact label="Dueño">
          {org.owner ? <>{org.owner.name}<span className="block text-xs font-normal console-muted">{org.owner.email}</span></> : "—"}
        </Fact>
        <Fact label="Equipo">
          {org.memberCount} {org.memberCount === 1 ? "miembro" : "miembros"}
          {org.pendingInvitations > 0 && <span className="block text-xs font-normal console-muted">{org.pendingInvitations} {org.pendingInvitations === 1 ? "invitación pendiente" : "invitaciones pendientes"}</span>}
        </Fact>
        <Fact label="Último acceso">{lastSeenLabel(org.lastActivityAt)}</Fact>
        <Fact label="Creado">{fmtDate(org.createdAt)}</Fact>
      </div>

      {org.subscription && (
        <div className="console-card flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-widest console-muted mb-1">SUSCRIPCIÓN</p>
            <p className="text-sm console-title">
              {PLAN_NAMES[org.subscription.plan]} · {formatCOP(org.subscription.amount)}
              {org.subscription.currentPeriodEnd && ` · ${org.subscription.cancelAtPeriodEnd ? "termina" : "renueva"} el ${fmtDate(org.subscription.currentPeriodEnd, "short")}`}
            </p>
          </div>
          <Badge variant={org.subscription.status === "PAST_DUE" ? "warning" : "success"}>{SUB_STATUS[org.subscription.status] ?? "Activa"}</Badge>
        </div>
      )}

      <div className="console-card flex flex-col gap-4">
        <p className="text-[11px] font-bold tracking-widest console-muted">USO DEL PLAN</p>
        {org.usage.map((u) => (
          <div key={u.feature} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="console-title">{u.label}</span>
              <span className={u.atLimit ? "font-semibold" : "console-muted"} style={u.atLimit ? { color: "var(--warning)" } : undefined}>
                {u.current} de {u.limit === null ? "ilimitado" : u.limit === 0 ? "no incluido" : u.limit}
              </span>
            </div>
            {u.percent !== null && (
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }} role="progressbar" aria-valuenow={u.percent} aria-valuemin={0} aria-valuemax={100} aria-label={u.label}>
                <div className="h-full rounded-full" style={{ width: `${u.percent}%`, background: u.atLimit ? "var(--warning)" : "var(--accent)" }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Equipo ──────────────────────────────────────────────────────────────────
export function EquipoSection({ orgId, orgName }: { orgId: string; orgName: string }) {
  const { platformCan } = usePermissions()
  const canEdit = platformCan("platform_users", "update")
  const confirm = useConfirm()
  const { data, error, mutate } = useSWR(["clientes-org-team", orgId], () => getOrgTeam(orgId), { revalidateOnFocus: false })
  const [busy, setBusy] = useState<string | null>(null)

  if (error && !data) return <ErrorState title="No pudimos cargar el equipo" onRetry={() => void mutate()} />
  if (!data) return <LoadingBlock label="Cargando equipo…" />
  const team: OrgTeam = data

  async function guard(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key)
    try {
      await fn()
      toast.success(ok)
      await mutate()
      await globalMutate(["clientes-org-overview", orgId])
    } catch (e) {
      toast.error("No se pudo completar la acción", { description: friendlyError(e, "Inténtalo de nuevo.") })
    } finally {
      setBusy(null)
    }
  }

  async function remove(m: OrgTeam["members"][number]) {
    const sure = await confirm({
      title: "Quitar del negocio",
      itemName: m.name,
      description: `${m.name} perderá el acceso a "${orgName}". La acción queda en la auditoría.`,
      confirmLabel: "Quitar",
      variant: "danger",
    })
    if (sure) await guard(`rm-${m.userId}`, () => platformRemoveUserOrgMembership(m.userId, orgId), "Miembro quitado del negocio")
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="console-card flex flex-col">
        <p className="text-[11px] font-bold tracking-widest console-muted mb-2">MIEMBROS ({team.members.length})</p>
        {team.members.map((m) => {
          const slug = m.roles[0]?.roleSlug ?? ""
          return (
            <div key={m.membershipId} className="flex flex-wrap items-center gap-3 py-3" style={{ borderTop: "1px solid var(--border-light)" }}>
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-semibold console-title">
                  {m.name} {m.isOwner && <Badge variant="accent">Dueño</Badge>}
                </p>
                <p className="text-xs console-muted">{m.email} · {lastSeenLabel(m.lastActivityAt)}</p>
              </div>
              {canEdit && !m.isOwner ? (
                <select
                  aria-label={`Rol de ${m.name}`}
                  value={slug}
                  disabled={busy !== null}
                  onChange={(e) => void guard(`role-${m.userId}`, () => platformSetUserOrgRole(m.userId, orgId, e.target.value), "Rol actualizado")}
                  className="console-input text-sm"
                  style={{ height: 36, paddingInline: 8 }}
                >
                  {!slug && <option value="">Sin rol</option>}
                  {ORG_ROLE_SLUGS.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              ) : (
                <span className="text-sm console-muted">{slug ? roleLabel(slug) : "Sin rol"}</span>
              )}
              {canEdit && !m.isOwner && (
                <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => void remove(m)} aria-label={`Quitar a ${m.name}`}>
                  <Trash2 size={14} aria-hidden="true" /> Quitar
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <div className="console-card flex flex-col">
        <p className="text-[11px] font-bold tracking-widest console-muted mb-2">INVITACIONES</p>
        {team.invitations.length === 0 && <p className="text-sm console-muted">Este negocio no ha enviado invitaciones.</p>}
        {team.invitations.map((i) => (
          <div key={i.id} className="flex flex-wrap items-center gap-3 py-3" style={{ borderTop: "1px solid var(--border-light)" }}>
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm console-title">{i.email}</p>
              <p className="text-xs console-muted">{roleLabel(i.roleSlug)} · invitó {i.invitedByName} · {timeAgoEs(i.createdAt)}</p>
            </div>
            <Badge variant={i.status === "pending" ? "accent" : "muted"}>{INVITE_STATUS[i.status]}</Badge>
            {canEdit && (i.status === "pending" || i.status === "expired") && (
              <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => void guard(`inv-${i.id}`, () => resendOrgInvitation(orgId, i.id), `Invitación reenviada a ${i.email}`)}>
                <Send size={14} aria-hidden="true" /> Reenviar
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Notas internas ──────────────────────────────────────────────────────────
export function NotasSection({ orgId }: { orgId: string }) {
  const { platformCan } = usePermissions()
  const canWrite = platformCan("platform_support", "update")
  const confirm = useConfirm()
  const { data, error, mutate } = useSWR(["clientes-org-notes", orgId], () => listOrgNotes(orgId), { revalidateOnFocus: false })
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)

  async function add() {
    if (!text.trim()) return
    setBusy(true)
    try {
      await addOrgNote(orgId, text.trim())
      setText("")
      await mutate()
    } catch (e) {
      toast.error("No se pudo guardar la nota", { description: friendlyError(e, "Inténtalo de nuevo.") })
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!(await confirm({ title: "Borrar nota", description: "La nota se elimina para todo el equipo.", confirmLabel: "Borrar", variant: "danger" }))) return
    try {
      await deleteOrgNote(orgId, id)
      await mutate()
    } catch (e) {
      toast.error("No se pudo borrar la nota", { description: friendlyError(e, "Solo quien la escribió puede borrarla.") })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm console-muted">Notas privadas del equipo de la plataforma. El negocio nunca las ve.</p>
      {canWrite && (
        <div className="console-card flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            rows={3}
            aria-label="Nueva nota"
            placeholder="Ej.: pidió extender la prueba, hablar con él el lunes…"
            className="console-input text-sm w-full"
            style={{ padding: 10, resize: "vertical" }}
          />
          <div>
            <Button size="sm" onClick={add} loading={busy} disabled={!text.trim()}>Guardar nota</Button>
          </div>
        </div>
      )}
      {error && !data ? (
        <ErrorState title="No pudimos cargar las notas" onRetry={() => void mutate()} />
      ) : !data ? (
        <LoadingBlock label="Cargando notas…" />
      ) : data.length === 0 ? (
        <EmptyState title="Aún no hay notas" description="Deja aquí el contexto de este cliente para que el equipo lo tenga a mano." />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((n) => (
            <li key={n.id} className="console-card flex flex-col gap-1">
              <p className="text-sm console-title whitespace-pre-wrap">{n.body}</p>
              <div className="flex items-center justify-between gap-2 text-xs console-muted">
                <span>{n.authorName} · {timeAgoEs(n.createdAt)}</span>
                {canWrite && <button type="button" onClick={() => void remove(n.id)} className="underline" style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>Borrar</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Acciones ────────────────────────────────────────────────────────────────
export function AccionesSection({ org, onChanged }: { org: OrgOverview; onChanged: () => Promise<unknown> | void }) {
  const { platformCan } = usePermissions()
  const canSuspend = platformCan("platform_organizations", "suspend")
  const canBilling = platformCan("platform_billing", "update")
  const canImpersonate = platformCan("platform_impersonation", "create")
  const [days, setDays] = useState(7)
  const suspended = org.status === "suspended"
  const trialBlocked = org.membership === "academia" || org.subscription !== null

  return (
    <div className="flex flex-col gap-4">
      {canBilling && (
        <ActionCard
          title="Extender la prueba"
          description={trialBlocked ? "No aplica: el negocio ya tiene un plan de pago." : "Suma días a la prueba de Pro. Si ya venció, la reabre."}
          confirmTitle="Extender la prueba"
          confirmText={`"${org.name}" tendrá ${days} ${days === 1 ? "día" : "días"} más de prueba de Pro. El dueño recibe un aviso.`}
          confirmLabel="Extender prueba"
          disabled={trialBlocked || days < 1 || days > 90}
          successMessage="Prueba extendida"
          onRun={async (reason) => { await extendOrgTrial(org.id, days, reason); await onChanged() }}
        >
          <label className="flex flex-col gap-1 text-xs console-muted" style={{ maxWidth: 160 }}>
            Días a sumar (1 a 90)
            <input type="number" min={1} max={90} value={days} onChange={(e) => setDays(Number(e.target.value))} className="console-input text-sm" style={{ height: 38, paddingInline: 10 }} />
          </label>
        </ActionCard>
      )}

      {canBilling && <OrgSupportActions orgId={org.id} name={org.name} plan={org.membership} onDone={() => void onChanged()} />}

      {canSuspend && (
        <ActionCard
          title={suspended ? "Reactivar el negocio" : "Suspender el negocio"}
          description={suspended ? "Sus miembros recuperan el acceso." : "Sus miembros pierden el acceso hasta que lo reactives."}
          confirmTitle={suspended ? "Reactivar negocio" : "Suspender negocio"}
          confirmText={suspended ? `Los miembros de "${org.name}" volverán a entrar.` : `Los miembros de "${org.name}" no podrán entrar.`}
          confirmLabel={suspended ? "Reactivar" : "Suspender"}
          danger={!suspended}
          successMessage={suspended ? "Negocio reactivado" : "Negocio suspendido"}
          onRun={async (reason) => { await platformSetOrgStatus(org.id, suspended ? "reactivate" : "suspend", reason); await onChanged() }}
        />
      )}

      {canImpersonate && <VerComoSection orgId={org.id} />}
    </div>
  )
}

function VerComoSection({ orgId }: { orgId: string }) {
  const { data } = useSWR(["clientes-org-team", orgId], () => getOrgTeam(orgId), { revalidateOnFocus: false })
  const [member, setMember] = useState("")
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const valid = member && reason.trim().length >= 10

  async function start() {
    setBusy(true)
    try {
      await platformStartImpersonation(orgId, member, reason.trim())
      window.location.href = "/dashboard"
    } catch (e) {
      toast.error("No se pudo iniciar", { description: friendlyError(e, "Inténtalo de nuevo.") })
      setBusy(false)
    }
  }

  return (
    <div className="console-card flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold console-title">Ver el negocio como un miembro</p>
        <p className="text-xs console-muted mt-0.5">Solo lectura, dura 45 minutos y queda registrado.</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs console-muted">
          Miembro
          <select value={member} onChange={(e) => setMember(e.target.value)} className="console-input text-sm" style={{ height: 38, paddingInline: 8, minWidth: 220 }}>
            <option value="">Elige un miembro…</option>
            {data?.members.map((m) => <option key={m.membershipId} value={m.membershipId}>{m.name} ({m.roles.map((r) => roleLabel(r.roleSlug)).join(", ") || "sin rol"})</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs console-muted flex-1 min-w-[220px]">
          Motivo (mínimo 10 caracteres)
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="console-input text-sm" style={{ height: 38, paddingInline: 10 }} />
        </label>
        <Button size="md" disabled={!valid} loading={busy} onClick={start}><Eye size={14} aria-hidden="true" /> Ver como…</Button>
      </div>
    </div>
  )
}
