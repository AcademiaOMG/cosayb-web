"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { ScrollText } from "lucide-react"
import ErrorState from "@/components/ui/ErrorState"
import EmptyState from "@/components/ui/EmptyState"
import Button from "@/components/ui/Button"
import SearchableSelect from "@/components/ui/SearchableSelect"
import { fetchAPI, type AuditLogEntry } from "@/lib/api"
import {
  AUDIT_ACTIONS, auditActionLabel, auditResourceLabel, auditSentence,
} from "@/lib/plataforma/labels"
import { dateRangeError, exactTime, filterAudit, relativeTime, resolveTargetName } from "@/lib/plataforma/auditView"

const BLOCK = 200 // máximo que entrega el API por consulta
const PAGE_SIZE = 25

type AuditEntry = AuditLogEntry & { metadata?: Record<string, unknown> | null; impersonationSessionId?: string | null }
type Named = { id: string; name: string }

/** Lee todas las páginas de un listado de plataforma (usuarios o negocios) para poder mostrar nombres. */
async function loadAll(path: string): Promise<Named[]> {
  const out: Named[] = []
  for (let page = 1; page <= 30; page++) {
    const res = await fetchAPI<{ data: Named[]; total: number }>(`${path}?limit=100&page=${page}`)
    out.push(...res.data)
    if (out.length >= res.total || res.data.length === 0) break
  }
  return out
}

/** Los nombres son un complemento: si el rol no puede listarlos, la pantalla sigue funcionando. */
async function loadDirectory() {
  const [users, orgs] = await Promise.all([
    loadAll("/api/v1/platform/users").catch(() => [] as Named[]),
    loadAll("/api/v1/platform/organizations").catch(() => [] as Named[]),
  ])
  return { users, orgs }
}

const dateInputStyle = { height: 38, minWidth: 150 } as const

export default function AuditoriaPage() {
  const [blocks, setBlocks] = useState(1)
  const [actorId, setActorId] = useState("")
  const [orgId, setOrgId] = useState("")
  const [action, setAction] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)

  const { data: directory } = useSWR("platform-audit-directory", loadDirectory, { revalidateOnFocus: false })
  const userNames = useMemo(() => Object.fromEntries((directory?.users ?? []).map((u) => [u.id, u.name])), [directory])
  const orgNames = useMemo(() => Object.fromEntries((directory?.orgs ?? []).map((o) => [o.id, o.name])), [directory])

  // Usuario y negocio se filtran en el servidor; acción y fechas, aquí (el API aún no los admite)
  const { data, isLoading, error, mutate: retry } = useSWR(["platform-audit", blocks, actorId, orgId], async () => {
    const pages = await Promise.all(
      Array.from({ length: blocks }, (_, i) => {
        const q = new URLSearchParams({ limit: String(BLOCK), offset: String(i * BLOCK) })
        if (actorId) q.set("actorUserId", actorId)
        if (orgId) q.set("organizationId", orgId)
        return fetchAPI<{ data: AuditEntry[] }>(`/api/v1/platform/audit?${q}`).then((r) => r.data)
      })
    )
    return pages.flat()
  })

  const rangeError = dateRangeError(from, to)
  const filtered = useMemo(
    () => (rangeError ? [] : filterAudit(data ?? [], { action: action || undefined, from: from || undefined, to: to || undefined })),
    [data, action, from, to, rangeError]
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const mayHaveMore = !!data && data.length >= blocks * BLOCK

  const actionOptions = useMemo(
    () =>
      Object.keys(AUDIT_ACTIONS)
        .map((code) => ({ value: code, label: auditActionLabel(code) }))
        .sort((a, b) => a.label.localeCompare(b.label, "es")),
    []
  )
  const userOptions = useMemo(
    () => (directory?.users ?? []).map((u) => ({ value: u.id, label: u.name })).sort((a, b) => a.label.localeCompare(b.label, "es")),
    [directory]
  )
  const orgOptions = useMemo(
    () => (directory?.orgs ?? []).map((o) => ({ value: o.id, label: o.name })).sort((a, b) => a.label.localeCompare(b.label, "es")),
    [directory]
  )

  const hasFilters = !!(actorId || orgId || action || from || to)
  function resetFilters() {
    setActorId(""); setOrgId(""); setAction(""); setFrom(""); setTo(""); setPage(1)
  }
  const change = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1) }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold console-title">Auditoría</h1>
        <p className="text-sm console-muted mt-1">
          Quién hizo qué y cuándo: acciones del equipo de la plataforma y movimientos importantes de los negocios.
        </p>
      </div>

      <div className="console-card grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium console-muted">Persona</span>
          <SearchableSelect
            options={userOptions}
            value={actorId}
            onChange={change(setActorId)}
            placeholder="Todas las personas"
            searchPlaceholder="Buscar persona"
            clearLabel="Todas las personas"
            emptyMessage="No hay coincidencias"
            ariaLabel="Filtrar por persona"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium console-muted">Negocio</span>
          <SearchableSelect
            options={orgOptions}
            value={orgId}
            onChange={change(setOrgId)}
            placeholder="Todos los negocios"
            searchPlaceholder="Buscar negocio"
            clearLabel="Todos los negocios"
            emptyMessage="No hay coincidencias"
            ariaLabel="Filtrar por negocio"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium console-muted">Qué hizo</span>
          <SearchableSelect
            options={actionOptions}
            value={action}
            onChange={change(setAction)}
            placeholder="Cualquier acción"
            searchPlaceholder="Buscar acción"
            clearLabel="Cualquier acción"
            emptyMessage="No hay coincidencias"
            ariaLabel="Filtrar por acción"
          />
        </div>
        <label className="flex flex-col gap-1.5 text-xs font-medium console-muted">
          Desde
          <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1) }} className="console-input text-sm px-3" style={dateInputStyle} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium console-muted">
          Hasta
          <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1) }} className="console-input text-sm px-3" style={dateInputStyle} />
        </label>
        {rangeError && <p role="alert" className="text-xs sm:col-span-2 lg:col-span-5" style={{ color: "#DC2626" }}>{rangeError}</p>}
        {hasFilters && (
          <div className="sm:col-span-2 lg:col-span-5">
            <Button variant="ghost" size="sm" onClick={resetFilters}>Limpiar filtros</Button>
          </div>
        )}
      </div>

      {error && !data && <ErrorState title="No pudimos cargar la auditoría" onRetry={() => void retry()} />}
      {isLoading && !data && (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse console-row" style={{ height: 58 }} />
          ))}
        </div>
      )}

      {data && (
        <>
          <p className="text-xs console-muted" aria-live="polite">
            {filtered.length === 0
              ? "Sin resultados"
              : `${filtered.length.toLocaleString("es-CO")} ${filtered.length === 1 ? "registro" : "registros"}`}
            {mayHaveMore && ` entre los ${(blocks * BLOCK).toLocaleString("es-CO")} más recientes`}
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<ScrollText size={32} />}
              title={hasFilters ? "Nada coincide con esos filtros" : "Todavía no hay registros"}
              description={hasFilters ? "Prueba con otro rango de fechas o quita algún filtro." : "Cuando alguien haga algo importante, aparecerá aquí."}
              action={hasFilters ? <Button variant="ghost" size="sm" onClick={resetFilters}>Limpiar filtros</Button> : undefined}
            />
          ) : (
            <ul className="flex flex-col gap-2 m-0 p-0 list-none">
              {visible.map((log) => {
                const sentence = auditSentence({
                  action: log.action,
                  actorName: userNames[log.actorUserId],
                  targetName: resolveTargetName(log, userNames, orgNames),
                })
                return (
                  <li key={log.id} className="console-row flex items-start gap-3 px-4 py-3">
                    <ScrollText size={14} className="console-muted mt-1 shrink-0" aria-hidden />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold console-title">{sentence}</p>
                      <p className="text-xs console-muted mt-0.5">{auditResourceLabel(log.resourceType)}</p>
                      {log.justification && (
                        <p className="text-xs mt-1 italic" style={{ color: "var(--accent)" }}>
                          Motivo: &ldquo;{log.justification}&rdquo;
                        </p>
                      )}
                      <details className="mt-1 text-[11px] console-muted">
                        <summary className="cursor-pointer select-none">Detalles técnicos</summary>
                        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5" style={{ fontFamily: "monospace" }}>
                          <dt>acción</dt><dd>{log.action}</dd>
                          <dt>recurso</dt><dd>{log.resourceType}{log.resourceId ? ` · ${log.resourceId}` : ""}</dd>
                          <dt>usuario</dt><dd>{log.actorUserId}</dd>
                          <dt>roles</dt><dd>{log.actorRoles.length ? log.actorRoles.join(", ") : "—"}</dd>
                          {log.organizationId && (<><dt>negocio</dt><dd>{log.organizationId}</dd></>)}
                          {log.impersonationSessionId && (<><dt>sesión de soporte</dt><dd>{log.impersonationSessionId}</dd></>)}
                          {log.metadata && (<><dt>datos</dt><dd className="break-all">{JSON.stringify(log.metadata)}</dd></>)}
                        </dl>
                      </details>
                    </div>
                    <time dateTime={log.createdAt} title={exactTime(log.createdAt)} className="text-[11px] console-muted shrink-0 text-right">
                      <span className="block">{relativeTime(log.createdAt)}</span>
                      <span className="block">{exactTime(log.createdAt)}</span>
                    </time>
                  </li>
                )
              })}
            </ul>
          )}

          {filtered.length > PAGE_SIZE && (
            <nav aria-label="Páginas" className="flex items-center justify-center gap-3">
              <Button variant="ghost" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>Anterior</Button>
              <span className="text-xs console-muted">Página {current} de {pageCount}</span>
              <Button variant="ghost" size="sm" disabled={current >= pageCount} onClick={() => setPage(current + 1)}>Siguiente</Button>
            </nav>
          )}

          {mayHaveMore && (
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => setBlocks((b) => b + 1)}>Cargar registros más antiguos</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
