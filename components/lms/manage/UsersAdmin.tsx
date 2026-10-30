"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { MoreHorizontal, ShieldCheck, ShieldOff, UserCheck, UserMinus } from "lucide-react"
import { Avatar, Badge, Card, Chip, EmptyState, ErrorPanel, Skeleton } from "@/components/lms/ui"
import { ActionMenu, errMsg } from "@/components/lms/studio/kit"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { lms } from "@/lib/lms/api"
import { errorStatus } from "@/lib/lms/hooks"
import { toast } from "@/lib/toast"
import type { ManageUser } from "@/lib/lms/types"
import { Pager, SearchBox, dateLabel, useDebounced } from "./parts"

type RoleFilter = "all" | "instructor" | "admin" | "student"
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
  const [offset, setOffset] = useState(0)
  const dq = useDebounced(q)
  const { data, error, mutate } = useSWR(["lms/manage/users", dq, role, offset], () => lms.manage.users({ q: dq || undefined, role, offset }), { revalidateOnFocus: false })

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

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Instructores y usuarios</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Busca a una persona registrada y dale el rol de instructor o de administrador. Cada cambio queda registrado en la auditoría.</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={(v) => { setQ(v); setOffset(0) }} placeholder="Buscar por nombre o correo…" label="Buscar usuario" width={280} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por rol">
          {FILTERS.map(([id, label]) => <Chip key={id} pressed={role === id} onClick={() => { setRole(id); setOffset(0) }}>{label}</Chip>)}
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
            <thead><tr><th scope="col">Persona</th><th scope="col">Rol</th><th scope="col">Cursos propios</th><th scope="col">Matrículas</th><th scope="col">Registro</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {data.rows.map((u) => {
                const admin = u.roles.includes("lms_admin")
                const inst = u.roles.includes("lms_instructor")
                return (
                  <tr key={u.id}>
                    <td><span className="flex items-center gap-3"><Avatar name={u.name} size={36} /><span className="min-w-0"><span className="block break-words font-extrabold">{u.name}</span><span className="block break-all text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{u.email}</span></span></span></td>
                    <td><RoleBadges u={u} /></td>
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
    </div>
  )
}
