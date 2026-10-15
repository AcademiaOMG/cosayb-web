"use client"

import { Suspense } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Building2 } from "lucide-react"
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
import {
  PLAN_NAMES, downloadClientsCsv, lastSeenLabel, listClientOrgs, parseOrgFilters, toUrlParams, withFilter,
  type ClientOrg, type OrgFilters,
} from "@/lib/plataforma/clientes"
import { fmtDate } from "@/lib/saas/format"

const LIMIT = 25

function StateBadges({ org }: { org: ClientOrg }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {org.status === "suspended" && <Badge variant="warning">Suspendido</Badge>}
      {org.pastDue && <Badge variant="warning">Pago atrasado</Badge>}
      {org.trialState === "active" && <Badge variant="accent">En prueba</Badge>}
      {org.trialState === "expired" && <Badge variant="muted">Prueba vencida</Badge>}
      {org.status === "active" && !org.pastDue && org.trialState === "none" && <Badge variant="success">Activo</Badge>}
    </div>
  )
}

function OrganizacionesLista() {
  const router = useRouter()
  const { platformCan } = usePermissions()
  const canRead = platformCan("platform_organizations", "read")
  const [filters, setFilters] = useUrlFilters(parseOrgFilters, toUrlParams)
  const { data, error, isLoading, mutate } = useSWR(["clientes-orgs", toUrlParams(filters)], () => listClientOrgs(filters, LIMIT), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })
  const c = data?.counts
  const change = (patch: Partial<OrgFilters>) => setFilters(withFilter(filters, patch))
  const view = filters.status ? "suspended" : filters.billing ? "past_due" : filters.trial === "active" ? "trial" : filters.trial === "expired" ? "expired" : "all"
  const setView = (v: string) =>
    change({
      status: v === "suspended" ? "suspended" : undefined,
      billing: v === "past_due" ? "past_due" : undefined,
      trial: v === "trial" ? "active" : v === "expired" ? "expired" : undefined,
    })

  const groups: FilterGroup[] = [
    {
      id: "plan",
      label: "Plan",
      value: filters.plan,
      onChange: (plan) => change({ plan: plan as OrgFilters["plan"] }),
      options: (["free", "pro", "academia"] as const).map((p) => ({ value: p, label: PLAN_NAMES[p], count: c?.[p] })),
    },
  ]

  const columns: Column[] = [
    {
      key: "name",
      header: "Negocio",
      render: (_v, row) => {
        const o = row as unknown as ClientOrg
        return (
          <div className="min-w-0">
            <p className="text-sm font-semibold console-title truncate">{o.name}</p>
            <p className="text-xs console-muted truncate">{o.owner.name} · {o.owner.email}</p>
          </div>
        )
      },
    },
    { key: "membership", header: "Plan", render: (v) => <Badge variant={v === "free" ? "muted" : "accent"}>{PLAN_NAMES[v as keyof typeof PLAN_NAMES]}</Badge> },
    { key: "status", header: "Estado", render: (_v, row) => <StateBadges org={row as unknown as ClientOrg} /> },
    { key: "memberCount", header: "Miembros" },
    { key: "lastActivityAt", header: "Último acceso", render: (v) => lastSeenLabel(v as string | null) },
    { key: "createdAt", header: "Creado", render: (v) => fmtDate(v as string, "short") },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Negocios"
        subtitle={data ? `${c?.all ?? 0} negocios registrados` : "Cargando…"}
        action={<ExportButton onExport={() => downloadClientsCsv("organizations", filters)} />}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={filters.search} onChange={(search) => change({ search })} placeholder="Buscar por negocio, dueño o correo…" label="Buscar negocio" />
        <FilterMenu groups={groups} ariaLabel="Filtrar negocios" />
        <div className="ml-auto">
          <SortSelect
            value={filters.sort}
            dir={filters.dir}
            options={[
              { value: "created", label: "Fecha de creación" },
              { value: "name", label: "Nombre" },
              { value: "members", label: "Miembros" },
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
          { id: "trial", label: "En prueba", count: c?.trialActive, active: view === "trial", onSelect: () => setView("trial") },
          { id: "expired", label: "Prueba vencida", count: c?.trialExpired, active: view === "expired", onSelect: () => setView("expired") },
          { id: "past_due", label: "Pago atrasado", count: c?.pastDue, active: view === "past_due", onSelect: () => setView("past_due") },
          { id: "suspended", label: "Suspendidos", count: c?.suspended, active: view === "suspended", onSelect: () => setView("suspended") },
        ]}
      />

      {error && !data ? (
        <ErrorState title="No pudimos cargar los negocios" onRetry={() => void mutate()} />
      ) : isLoading && !data ? (
        <LoadingBlock label="Cargando negocios…" />
      ) : (
        <>
          <Table
            columns={columns}
            data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
            rowKey="id"
            onRowClick={canRead ? (row) => router.push(`/plataforma/organizaciones/${row.id as string}`) : undefined}
            emptyState={
              <EmptyState
                icon={<Building2 size={32} aria-hidden="true" />}
                title="No encontramos negocios"
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

export default function OrganizacionesPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <OrganizacionesLista />
    </Suspense>
  )
}
