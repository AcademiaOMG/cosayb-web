"use client"

import { Suspense } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Users } from "lucide-react"
import Badge from "@/components/ui/Badge"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import FilterMenu, { ActiveFilterChips, type FilterGroup } from "@/components/ui/FilterMenu"
import LoadingBlock from "@/components/ui/LoadingBlock"
import PageHeader from "@/components/ui/PageHeader"
import Table, { type Column } from "@/components/ui/Table"
import { ExportButton, Pagination, QuickTabs, SearchBox, SortSelect } from "@/components/plataforma/clientes/ListControls"
import { useUrlFilters } from "@/components/plataforma/clientes/useUrlFilters"
import { usePermissions } from "@/hooks/usePermissions"
import { downloadClientsCsv, lastSeenLabel, listClientUsers, parseUserFilters, toUrlParams, withFilter, type ClientUser, type UserFilters } from "@/lib/plataforma/clientes"
import { roleLabel } from "@/lib/plataforma/labels"
import { fmtDate } from "@/lib/saas/format"

const LIMIT = 25

function UsuariosLista() {
  const router = useRouter()
  const { platformCan } = usePermissions()
  const canRead = platformCan("platform_users", "read")
  const [filters, setFilters] = useUrlFilters(parseUserFilters, toUrlParams)
  const { data, error, isLoading, mutate } = useSWR(["clientes-users", toUrlParams(filters)], () => listClientUsers(filters, LIMIT), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })
  const c = data?.counts
  const change = (patch: Partial<UserFilters>) => setFilters(withFilter(filters, patch))
  const view = filters.verified === "no" ? "unverified" : (filters.kind ?? "all")
  const setView = (v: string) =>
    change({
      kind: v === "team" || v === "client" || v === "no_business" ? v : undefined,
      verified: v === "unverified" ? "no" : undefined,
    })

  const groups: FilterGroup[] = [
    {
      id: "verified",
      label: "Correo",
      value: filters.verified,
      onChange: (verified) => change({ verified: verified as UserFilters["verified"] }),
      options: [
        { value: "yes", label: "Verificado", count: c?.verified },
        { value: "no", label: "Sin verificar", count: c?.unverified },
      ],
    },
  ]

  const columns: Column[] = [
    {
      key: "name",
      header: "Usuario",
      render: (_v, row) => {
        const u = row as unknown as ClientUser
        return (
          <div className="min-w-0">
            <p className="text-sm font-semibold console-title truncate">{u.name}</p>
            <p className="text-xs console-muted truncate">{u.email}</p>
          </div>
        )
      },
    },
    { key: "emailVerified", header: "Correo", render: (v) => <Badge variant={v ? "success" : "warning"}>{v ? "Verificado" : "Sin verificar"}</Badge> },
    {
      key: "platformRoles",
      header: "Rol",
      render: (_v, row) => {
        const u = row as unknown as ClientUser
        if (u.platformRoles.length > 0) {
          return (
            <div className="flex flex-wrap gap-1.5">
              {u.platformRoles.map((r) => <Badge key={r} variant="accent">{roleLabel(r)}</Badge>)}
            </div>
          )
        }
        const names = [...new Set(u.orgRoles.map((r) => roleLabel(r.roleSlug)))]
        return <span className="text-sm console-muted">{names.length ? names.join(", ") : "Sin rol"}</span>
      },
    },
    { key: "businessCount", header: "Negocios" },
    { key: "lastActivityAt", header: "Último acceso", render: (v) => lastSeenLabel(v as string | null) },
    { key: "createdAt", header: "Registro", render: (v) => fmtDate(v as string, "short") },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Usuarios"
        subtitle={data ? `${c?.all ?? 0} usuarios registrados` : "Cargando…"}
        action={<ExportButton onExport={() => downloadClientsCsv("users", filters)} />}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={filters.search} onChange={(search) => change({ search })} placeholder="Buscar por nombre o correo…" label="Buscar usuario" />
        <FilterMenu groups={groups} ariaLabel="Filtrar usuarios" />
        <div className="ml-auto">
          <SortSelect
            value={filters.sort}
            dir={filters.dir}
            options={[
              { value: "created", label: "Fecha de registro" },
              { value: "name", label: "Nombre" },
              { value: "activity", label: "Último acceso" },
            ]}
            onChange={(sort, dir) => change({ sort, dir })}
          />
        </div>
      </div>
      <ActiveFilterChips groups={groups} />

      <QuickTabs
        ariaLabel="Vistas rápidas"
        tabs={[
          { id: "all", label: "Todos", count: c?.all, active: view === "all", onSelect: () => setView("all") },
          { id: "client", label: "Con negocio", count: c?.client, active: view === "client", onSelect: () => setView("client") },
          { id: "no_business", label: "Sin negocio", count: c?.noBusiness, active: view === "no_business", onSelect: () => setView("no_business") },
          { id: "team", label: "Equipo de la plataforma", count: c?.team, active: view === "team", onSelect: () => setView("team") },
          { id: "unverified", label: "Sin verificar", count: c?.unverified, active: view === "unverified", onSelect: () => setView("unverified") },
        ]}
      />

      {error && !data ? (
        <ErrorState title="No pudimos cargar los usuarios" onRetry={() => void mutate()} />
      ) : isLoading && !data ? (
        <LoadingBlock label="Cargando usuarios…" />
      ) : (
        <>
          <Table
            columns={columns}
            data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
            rowKey="id"
            onRowClick={canRead ? (row) => router.push(`/plataforma/usuarios/${row.id as string}`) : undefined}
            emptyState={
              <EmptyState
                icon={<Users size={32} aria-hidden="true" />}
                title="No encontramos usuarios"
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

export default function UsuariosPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <UsuariosLista />
    </Suspense>
  )
}
