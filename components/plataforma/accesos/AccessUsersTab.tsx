"use client"

import { useCallback } from "react"
import useSWR from "swr"
import { CalendarClock, UserCheck, UserX, Users } from "lucide-react"
import Badge from "@/components/ui/Badge"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import FilterMenu, { ActiveFilterChips, type FilterGroup } from "@/components/ui/FilterMenu"
import LoadingBlock from "@/components/ui/LoadingBlock"
import Table, { type Column } from "@/components/ui/Table"
import StatCard from "@/components/plataforma/StatCard"
import { ExportButton, Pagination, QuickTabs, SearchBox, SortSelect } from "@/components/plataforma/clientes/ListControls"
import { useUrlFilters } from "@/components/plataforma/clientes/useUrlFilters"
import {
  accessToUrl, deviceText, downloadAccessCsv, INACTIVE_OPTIONS, listAccessUsers, parseAccessFilters, PERIOD_OPTIONS,
  withAccessFilter, type AccessFilters, type AccessUser,
} from "@/lib/plataforma/accesos"
import { exactTime, relativeTime } from "@/lib/plataforma/auditView"
import { authMethodLabel, roleLabel } from "@/lib/plataforma/labels"

const LIMIT = 25

export function BusinessesCell({ user }: { user: Pick<AccessUser, "platformRoles" | "businesses"> }) {
  if (user.platformRoles.length > 0) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {user.platformRoles.map((r) => <Badge key={r} variant="accent">{roleLabel(r)}</Badge>)}
      </div>
    )
  }
  if (user.businesses.length === 0) return <span className="text-sm console-muted">Sin negocio</span>
  const shown = user.businesses.slice(0, 2)
  const more = user.businesses.length - shown.length
  return (
    <div className="min-w-0">
      {shown.map((b) => (
        <p key={b.name} className="truncate text-sm console-title">
          {b.name}
          {b.roleSlug && <span className="console-muted"> · {roleLabel(b.roleSlug)}</span>}
        </p>
      ))}
      {more > 0 && <p className="text-xs console-muted">y {more} más</p>}
    </div>
  )
}

export default function AccessUsersTab({ onOpenUser }: { onOpenUser: (userId: string) => void }) {
  const serialize = useCallback((f: AccessFilters) => accessToUrl(f), [])
  const [filters, setFilters] = useUrlFilters(parseAccessFilters, serialize)
  const { data, error, isLoading, mutate } = useSWR(["accesos-usuarios", accessToUrl(filters)], () => listAccessUsers(filters, LIMIT), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })
  const c = data?.counts
  const change = (patch: Partial<AccessFilters>) => setFilters(withAccessFilter(filters, patch))

  const groups: FilterGroup[] = [
    {
      id: "days",
      label: "Último acceso",
      value: filters.days ? String(filters.days) : undefined,
      onChange: (v) => change({ days: v ? Number(v) : 0 }),
      options: PERIOD_OPTIONS.map((d) => ({ value: String(d), label: `En los últimos ${d} días` })),
    },
  ]

  const columns: Column[] = [
    {
      key: "name",
      header: "Persona",
      render: (_v, row) => {
        const u = row as unknown as AccessUser
        return (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold console-title">{u.name}</p>
            <p className="truncate text-xs console-muted">{u.email}</p>
          </div>
        )
      },
    },
    {
      key: "lastAccessAt",
      header: "Último acceso",
      render: (_v, row) => {
        const u = row as unknown as AccessUser
        if (!u.lastAccessAt) {
          return <span className="text-sm console-muted">{u.lastActivityAt ? "Sin inicio de sesión registrado" : "Nunca ha entrado"}</span>
        }
        return (
          <div>
            <p className="text-sm console-title">{relativeTime(u.lastAccessAt)}</p>
            <p className="text-xs console-muted">{exactTime(u.lastAccessAt)}</p>
          </div>
        )
      },
    },
    {
      key: "logins7",
      header: "Entradas",
      render: (_v, row) => {
        const u = row as unknown as AccessUser
        return (
          <span className="text-sm console-title">
            {u.logins7} <span className="console-muted">en 7 días</span> · {u.logins30} <span className="console-muted">en 30</span>
          </span>
        )
      },
    },
    {
      key: "device",
      header: "Dispositivo y lugar",
      render: (_v, row) => {
        const u = row as unknown as AccessUser
        return (
          <div className="min-w-0">
            <p className="truncate text-sm console-title">{u.lastAccessAt ? deviceText(u.device) : "—"}</p>
            {u.ip && <p className="text-xs console-muted">Dirección IP {u.ip}</p>}
          </div>
        )
      },
    },
    { key: "method", header: "Cómo entró", render: (_v, row) => (row as unknown as AccessUser).lastAccessAt ? authMethodLabel((row as unknown as AccessUser).method) : "—" },
    { key: "businesses", header: "Negocio y rol", render: (_v, row) => <BusinessesCell user={row as unknown as AccessUser} /> },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Personas con cuenta" value={c?.all ?? "—"} icon={Users} />
        <StatCard label="Entraron esta semana" value={c?.active7 ?? "—"} icon={UserCheck} hint="Con actividad en los últimos 7 días" />
        <StatCard label="Nunca han entrado" value={c?.never ?? "—"} icon={UserX} hint="Sin inicio de sesión ni uso registrado" />
        <StatCard label="Equipo de la plataforma" value={c?.team ?? "—"} icon={CalendarClock} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={filters.search} onChange={(search) => change({ search })} placeholder="Buscar por nombre o correo…" label="Buscar persona" />
        <FilterMenu groups={groups} ariaLabel="Filtrar accesos" />
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <SortSelect
            value={filters.sort}
            dir={filters.dir}
            options={[
              { value: "last_access", label: "Último acceso" },
              { value: "name", label: "Nombre" },
              { value: "logins7", label: "Entradas en 7 días" },
              { value: "logins30", label: "Entradas en 30 días" },
              { value: "activity", label: "Última actividad" },
            ]}
            onChange={(sort, dir) => change({ sort, dir })}
          />
          <ExportButton onExport={() => downloadAccessCsv(filters)} />
        </div>
      </div>
      <ActiveFilterChips groups={groups} />

      <div className="flex flex-wrap items-center gap-3">
        <QuickTabs
          ariaLabel="Vistas rápidas"
          tabs={[
            { id: "team", label: "Equipo de la plataforma", count: c?.team, active: filters.team, onSelect: () => change({ team: !filters.team }) },
            { id: "never", label: "Nunca han entrado", count: c?.never, active: filters.status === "never", onSelect: () => change({ status: filters.status === "never" ? undefined : "never" }) },
          ]}
        />
        <label className="flex items-center gap-2 text-sm console-muted">
          <span>Sin actividad en</span>
          <select
            aria-label="Sin actividad en los últimos días"
            value={filters.status === "inactive" ? String(filters.inactiveDays) : ""}
            onChange={(e) => change(e.target.value ? { status: "inactive", inactiveDays: Number(e.target.value) } : { status: undefined })}
            className="console-input text-sm"
            style={{ height: 32, paddingInline: 10 }}
          >
            <option value="">Cualquier momento</option>
            {INACTIVE_OPTIONS.map((d) => <option key={d} value={d}>{d} días o más</option>)}
          </select>
        </label>
      </div>

      {error && !data ? (
        <ErrorState title="No pudimos cargar los accesos" onRetry={() => void mutate()} />
      ) : isLoading && !data ? (
        <LoadingBlock label="Cargando accesos…" />
      ) : (
        <>
          <Table
            columns={columns}
            data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
            rowKey="userId"
            onRowClick={(row) => onOpenUser(row.userId as string)}
            emptyState={
              <EmptyState
                icon={<Users size={32} aria-hidden="true" />}
                title="No encontramos personas con estos filtros"
                description="Prueba con otra búsqueda o quita algún filtro."
              />
            }
          />
          <Pagination page={filters.page} total={data?.total ?? 0} limit={LIMIT} onPage={(page) => setFilters({ ...filters, page })} />
        </>
      )}
    </div>
  )
}
