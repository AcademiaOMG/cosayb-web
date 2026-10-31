"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { MoreHorizontal, ShieldCheck, ShieldOff, UserCheck, UserMinus, UserRoundCheck, UserRoundX } from "lucide-react"
import { Avatar, Badge, Card, Chip, EmptyState, ErrorPanel, Skeleton } from "@/components/lms/ui"
import { ActionMenu, errMsg } from "@/components/lms/studio/kit"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { lms } from "@/lib/lms/api"
import { errorStatus } from "@/lib/lms/hooks"
import { toast } from "@/lib/toast"
import type { ManageUser } from "@/lib/lms/types"
import { Pager, SearchBox, dateLabel, useDebounced } from "./parts"

type RoleFilter = "all" | "instructor" | "admin" | "student"
type StatusFilter = "all" | "active" | "disabled"
const STATUS_FILTERS: [StatusFilter, string][] = [["all", "Cualquier estado"], ["active", "Activos"], ["disabled", "Desactivados"]]
const FILTERS: [RoleFilter, string][] = [["all", "Todos"], ["instructor", "Instructores"], ["admin", "Administradores"], ["student", "Estudiantes"]]

function RoleBadges({ u }: { u: ManageUser }) {
  const admin = u.roles.includes("lms_admin")
  const inst = u.roles.includes("lms_instructor")
  return (
    <span className="flex flex-wrap gap-1.5">
      {admin && <Badge tone="brand">Administrador</Badge>}
      {inst && <Badge tone="sky">Instructor</Badge>}
      {u.platformAdmin && <Badge tone="amber">Equipo de plataforma</Badge>}
      {!admin && !inst && !u.platformAdmin && <Badge tone="neutral">Estudiante</Badge>}
    </span>
  )
}

/** Instructores y usuarios: quién puede enseñar y quién administra. Los cambios de rol quedan en la auditoría. */
export default function UsersAdmin() {
  const confirm = useConfirm()
  const [q, setQ] = useState("")
  const [role, setRole] = useState<RoleFilter>("all")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [offset, setOffset] = useState(0)
  const [off, setOff] = useState<ManageUser | null>(null)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const dq = useDebounced(q)
  const { data, error, mutate } = useSWR(["lms/manage/users", dq, role, status, offset], () => lms.manage.users({ q: dq || undefined, role, status, offset }), { revalidateOnFocus: false })

  if (errorStatus(error) === 403) return <ErrorPanel title="Solo para administradores" />
  if (error) return <ErrorPanel title="No pudimos cargar los usuarios" onRetry={() => mutate()} />

  async function change(u: ManageUser, slug: "lms_instructor" | "lms_admin", granted: boolean) {
    const noun = slug === "lms_admin" ? "administrador" : "instructor"
    const ok = await confirm({
      title: granted ? `Hacer ${noun}` : `Quitar el rol de ${noun}`,
      itemName: `${u.name} · ${u.email}`,
      description: granted
        ? slug === "lms_admin"
          ? "Podrá gestionar toda la academia: cursos, usuarios, matrículas, certificados y reportes."
          : "Podrá crear y gestionar sus propios cursos, evaluaciones y estudiantes."
        : u.courses > 0
          ? `Tiene ${u.courses} curso${u.courses > 1 ? "s" : ""} a su nombre: deja de poder verlos. Reasígnalos desde «Cursos».`
          : "Deja de tener acceso a esa parte de la academia.",
      confirmLabel: granted ? "Otorgar rol" : "Quitar rol",
      variant: granted ? "default" : "danger",
    })
    if (!ok) return
    try {
      await lms.manage.setRole(u.id, slug, granted)
      await mutate()
      toast.success(granted ? "Rol otorgado." : "Rol retirado.")
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  async function disable() {
    if (!off) return
    setBusy(true)
    try {
      const r = await lms.manage.setUserStatus(off.id, true, reason.trim() || undefined)
      await mutate()
      toast.success(r.keepsBusinessAccess ? "Cuenta desactivada en la academia. Su negocio sigue activo." : "Cuenta desactivada: se cerraron sus sesiones.")
      setOff(null)
      setReason("")
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  async function enable(u: ManageUser) {
    const ok = await confirm({ title: "Reactivar cuenta", itemName: `${u.name} · ${u.email}`, description: "Volverá a poder entrar a la academia con sus cursos y roles anteriores.", confirmLabel: "Reactivar" })
    if (!ok) return
    try {
      await lms.manage.setUserStatus(u.id, false)
      await mutate()
      toast.success("Cuenta reactivada.")
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Instructores y usuarios</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Busca a una persona registrada, dale el rol de instructor o de administrador, o desactiva su acceso a la academia. Las cuentas nuevas se crean en la consola de plataforma. Cada cambio queda en la auditoría.</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={(v) => { setQ(v); setOffset(0) }} placeholder="Buscar por nombre o correo…" label="Buscar usuario" width={280} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por rol">
          {FILTERS.map(([id, label]) => <Chip key={id} pressed={role === id} onClick={() => { setRole(id); setOffset(0) }}>{label}</Chip>)}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
          {STATUS_FILTERS.map(([id, label]) => <Chip key={id} pressed={status === id} onClick={() => { setStatus(id); setOffset(0) }}>{label}</Chip>)}
        </div>
      </div>

      {!data ? (
        <Skeleton className="h-72 !rounded-[22px]" />
      ) : data.rows.length === 0 ? (
        <EmptyState title="Nadie coincide" description="Prueba con otro nombre, correo o filtro." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="t-table">
            <caption className="sr-only">Usuarios y sus roles en la academia</caption>
            <thead><tr><th scope="col">Persona</th><th scope="col">Rol</th><th scope="col">Estado</th><th scope="col">Cursos propios</th><th scope="col">Matrículas</th><th scope="col">Registro</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {data.rows.map((u) => {
                const admin = u.roles.includes("lms_admin")
                const inst = u.roles.includes("lms_instructor")
                return (
                  <tr key={u.id}>
                    <td><span className="flex items-center gap-3"><Avatar name={u.name} size={36} /><span className="min-w-0"><span className="block break-words font-extrabold">{u.name}</span><span className="block break-all text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{u.email}</span></span></span></td>
                    <td><RoleBadges u={u} /></td>
                    <td>{u.disabled ? <span><Badge tone="rose">Desactivado</Badge>{u.disabledReason && <span className="mt-1 block max-w-[220px] break-words text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{u.disabledReason}</span>}</span> : <Badge tone="mint">Activo</Badge>}</td>
                    <td className="font-bold">{u.courses > 0 ? <Link className="hover:underline" href={`/administracion/cursos?ownerId=${encodeURIComponent(u.id)}`}>{u.courses}</Link> : 0}</td>
                    <td className="font-bold">{u.enrollments}</td>
                    <td className="text-sm font-semibold" style={{ color: "var(--l-muted)" }}>{dateLabel(u.createdAt)}</td>
                    <td>
                      <ActionMenu label={`Roles de ${u.name}`} trigger={<MoreHorizontal size={18} aria-hidden="true" />}>
                        {() => (
                          <>
                            {inst ? (
                              <button type="button" role="menuitem" className="l-danger" onClick={() => void change(u, "lms_instructor", false)}><UserMinus size={15} aria-hidden="true" /> Quitar instructor</button>
                            ) : (
                              <button type="button" role="menuitem" onClick={() => void change(u, "lms_instructor", true)}><UserCheck size={15} aria-hidden="true" /> Hacer instructor</button>
                            )}
                            {admin ? (
                              <button type="button" role="menuitem" className="l-danger" onClick={() => void change(u, "lms_admin", false)}><ShieldOff size={15} aria-hidden="true" /> Quitar administrador</button>
                            ) : (
                              <button type="button" role="menuitem" onClick={() => void change(u, "lms_admin", true)}><ShieldCheck size={15} aria-hidden="true" /> Hacer administrador</button>
                            )}
                            {u.disabled ? (
                              <button type="button" role="menuitem" onClick={() => void enable(u)}><UserRoundCheck size={15} aria-hidden="true" /> Reactivar cuenta</button>
                            ) : u.platformAdmin ? null : (
                              <button type="button" role="menuitem" className="l-danger" onClick={() => { setReason(""); setOff(u) }}><UserRoundX size={15} aria-hidden="true" /> Desactivar cuenta</button>
                            )}
                          </>
                        )}
                      </ActionMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
      {data && <Pager total={data.total} offset={offset} onChange={setOffset} noun="personas" />}
      <p className="text-xs" style={{ color: "var(--l-muted)" }}>
        Las cuentas del equipo de plataforma administran la academia por su rol de plataforma; el rol de administrador de aquí es para personas que no lo son. La academia siempre conserva al menos un administrador.
      </p>
      <Modal open={Boolean(off)} onClose={() => { if (!busy) setOff(null) }} title="Desactivar cuenta" footer={<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setOff(null)} disabled={busy}>Cancelar</Button><Button variant="danger" onClick={() => void disable()} loading={busy}>Desactivar</Button></div>}>
        <div className="flex flex-col gap-3 text-sm">
          <p className="rounded-lg px-3 py-2 font-medium break-words" style={{ background: "var(--bg-secondary)" }}>{off?.name} · {off?.email}</p>
          <p>No podrá usar la academia (cursos, evaluaciones, certificados{off && (off.roles.length > 0 || off.courses > 0) ? ", ni su estudio o administración" : ""}). Si no tiene un negocio en CO$AYB, tampoco podrá iniciar sesión y sus sesiones se cierran. Si lo tiene, su negocio sigue funcionando. Puedes reactivarla cuando quieras.</p>
          <label className="flex flex-col gap-1 font-semibold">Motivo (opcional)
            <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 300))} rows={3} className="rounded-lg border p-2 text-sm font-normal" style={{ borderColor: "var(--border-light)" }} placeholder="Queda en la auditoría y lo ven los administradores." />
          </label>
        </div>
      </Modal>
    </div>
  )
}
