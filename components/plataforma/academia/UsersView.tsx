"use client"

import { useCallback, useState } from "react"
import useSWR from "swr"
import { Copy, UserPlus } from "lucide-react"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import Input from "@/components/ui/Input"
import LoadingBlock from "@/components/ui/LoadingBlock"
import Modal from "@/components/ui/Modal"
import Table, { type Column } from "@/components/ui/Table"
import { Pagination, QuickTabs, SearchBox } from "@/components/plataforma/clientes/ListControls"
import { usePermissions } from "@/hooks/usePermissions"
import { SaasError } from "@/lib/saas/types"
import { fmtDate } from "@/lib/saas/format"
import { toast } from "@/lib/toast"
import { ROLE_HELP, ROLE_LABEL, academiaApi, roleOf, validateNewUser, type AcademiaRole, type CreatedAcademiaUser } from "@/lib/plataforma/academia"
import type { ManageUser } from "@/lib/lms/types"

const LIMIT = 25
const ROLE_FILTERS = [["all", "Todos"], ["student", "Estudiantes"], ["instructor", "Instructores"], ["admin", "Administradores"]] as const
const STATUS_FILTERS = [["all", "Cualquier estado"], ["active", "Activos"], ["disabled", "Desactivados"]] as const

function CreateUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { platformCan } = usePermissions()
  const canAdmin = platformCan("platform_lms_admins", "create")
  const [f, setF] = useState({ name: "", email: "", role: "student" as AcademiaRole, send: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<CreatedAcademiaUser | null>(null)

  const close = useCallback(() => {
    setF({ name: "", email: "", role: "student", send: false })
    setErrors({})
    setDone(null)
    onClose()
  }, [onClose])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = validateNewUser(f)
    setErrors(v)
    if (Object.keys(v).length) return
    setBusy(true)
    try {
      const created = await academiaApi.createUser({ name: f.name.trim(), email: f.email.trim(), role: f.role, sendSetPasswordEmail: f.send })
      setDone(created)
      onCreated()
    } catch (err) {
      if (err instanceof SaasError && err.code === "HTTP_409") setErrors({ email: "Ya existe una cuenta con ese correo. Para darle un rol, hazlo desde el LMS (Administración → Usuarios)." })
      else if (err instanceof SaasError && err.code === "HTTP_403") setErrors({ role: "Tu rol no puede crear este tipo de usuario." })
      else toast.error("No pudimos crear el usuario. Inténtalo de nuevo.")
    } finally {
      setBusy(false)
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copiada.")
    } catch {
      toast.warning("No se pudo copiar. Selecciónala y cópiala a mano.")
    }
  }

  return (
    <Modal open={open} onClose={close} title={done ? "Usuario creado" : "Nuevo usuario de Academia"}>
      {done ? (
        <div className="flex flex-col gap-4 text-sm">
          <p><strong>{done.name}</strong> ({done.email}) ya puede entrar a la academia como <strong>{ROLE_LABEL[done.role].toLowerCase()}</strong>.</p>
          <div className="rounded-[var(--radius-md)] p-3" style={{ background: "var(--bg-secondary)" }}>
            <p className="mb-1 text-xs font-semibold console-muted">Contraseña temporal (se muestra una sola vez)</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 select-all break-all text-base font-semibold" data-testid="temp-password">{done.temporaryPassword}</code>
              <Button variant="ghost" size="sm" onClick={() => void copy(done.temporaryPassword)} aria-label="Copiar contraseña"><Copy size={14} aria-hidden="true" /> Copiar</Button>
            </div>
          </div>
          <p className="console-muted">
            {done.emailSent ? "También le enviamos un correo para que defina su propia contraseña. " : ""}
            Compártela por un canal seguro y pídele que la cambie al entrar. No la podrás volver a ver: si se pierde, usa «Recuperar contraseña» en el inicio de sesión.
          </p>
          <div className="flex justify-end"><Button onClick={close}>Listo</Button></div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <Input label="Nombre completo" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.name} maxLength={100} autoComplete="off" />
          <Input label="Correo electrónico" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errors.email} maxLength={254} autoComplete="off" />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold console-title">Rol en la academia</legend>
            {(["student", "instructor", "admin"] as const).map((r) => {
              const locked = r === "admin" && !canAdmin
              return (
                <label key={r} className="flex items-start gap-2.5 rounded-[var(--radius-md)] border p-3 text-sm" style={{ borderColor: f.role === r ? "var(--accent)" : "var(--border-light)", opacity: locked ? 0.55 : 1 }}>
                  <input type="radio" name="role" value={r} checked={f.role === r} disabled={locked} onChange={() => setF({ ...f, role: r })} className="mt-1" />
                  <span><span className="block font-semibold console-title">{ROLE_LABEL[r]}</span><span className="console-muted">{ROLE_HELP[r]}{locked ? " Solo el propietario de la plataforma puede crear administradores." : ""}</span></span>
                </label>
              )
            })}
            {errors.role && <p role="alert" className="text-xs" style={{ color: "var(--error)" }}>{errors.role}</p>}
          </fieldset>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={f.send} onChange={(e) => setF({ ...f, send: e.target.checked })} className="mt-1" />
            <span>Enviarle además un correo para que defina su propia contraseña</span>
          </label>
          <p className="text-xs console-muted">Se crea con el correo ya verificado y una contraseña temporal aleatoria. La creación queda en la auditoría.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
            <Button type="submit" loading={busy}>Crear usuario</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default function UsersView() {
  const { platformCan } = usePermissions()
  const canCreate = platformCan("platform_lms_users", "create")
  const [q, setQ] = useState("")
  const [role, setRole] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const { data, error, isLoading, mutate } = useSWR(["plat-academia-users", q, role, status, page], () => academiaApi.users({ q, role, status, limit: LIMIT, offset: (page - 1) * LIMIT }), { keepPreviousData: true, revalidateOnFocus: false })
  const change = (fn: () => void) => { fn(); setPage(1) }
  const onSearch = useCallback((v: string) => { setQ(v); setPage(1) }, [])

  const columns: Column[] = [
    {
      key: "name", header: "Persona",
      render: (_v, row) => {
        const u = row as unknown as ManageUser
        return <div className="min-w-0"><p className="truncate text-sm font-semibold console-title">{u.name}</p><p className="truncate text-xs console-muted">{u.email}</p></div>
      },
    },
    { key: "roles", header: "Rol", render: (_v, row) => <Badge variant={roleOf(row as unknown as ManageUser) === "student" ? "muted" : "accent"}>{ROLE_LABEL[roleOf(row as unknown as ManageUser)]}</Badge> },
    { key: "disabled", header: "Estado", render: (v) => <Badge variant={v ? "warning" : "success"}>{v ? "Desactivado" : "Activo"}</Badge> },
    { key: "courses", header: "Cursos propios" },
    { key: "enrollments", header: "Matrículas" },
    { key: "createdAt", header: "Registro", render: (v) => (v ? fmtDate(v as string, "short") : "—") },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={onSearch} placeholder="Buscar por nombre o correo…" label="Buscar usuario de la academia" />
        <div className="ml-auto">
          {canCreate && <Button onClick={() => setOpen(true)}><UserPlus size={16} aria-hidden="true" /> Nuevo usuario</Button>}
        </div>
      </div>
      <QuickTabs ariaLabel="Filtrar por rol" tabs={ROLE_FILTERS.map(([id, label]) => ({ id, label, active: role === id, onSelect: () => change(() => setRole(id)) }))} />
      <QuickTabs ariaLabel="Filtrar por estado" tabs={STATUS_FILTERS.map(([id, label]) => ({ id, label, active: status === id, onSelect: () => change(() => setStatus(id)) }))} />

      {error && !data ? (
        <ErrorState title="No pudimos cargar los usuarios" onRetry={() => void mutate()} />
      ) : isLoading && !data ? (
        <LoadingBlock label="Cargando usuarios…" />
      ) : (
        <>
          <Table
            columns={columns}
            data={(data?.rows ?? []) as unknown as Record<string, unknown>[]}
            rowKey="id"
            emptyState={<EmptyState title="Nadie coincide" description="Prueba con otro nombre, correo o filtro." />}
          />
          <Pagination page={page} total={data?.total ?? 0} limit={LIMIT} onPage={setPage} />
        </>
      )}
      <p className="text-xs console-muted">Aquí se crean las cuentas. Activarlas, desactivarlas y darles rol de instructor o administrador se hace dentro del LMS (Administración → Usuarios).</p>
      <CreateUserModal open={open} onClose={() => setOpen(false)} onCreated={() => void mutate()} />
    </div>
  )
}
