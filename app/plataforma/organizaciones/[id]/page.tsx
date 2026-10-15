"use client"

import { use, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ArrowLeft } from "lucide-react"
import Badge from "@/components/ui/Badge"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import { OrgBillingCard } from "@/components/saas/OrgSupportActions"
import ActivityList from "@/components/plataforma/clientes/ActivityList"
import { AccionesSection, EquipoSection, NotasSection, ResumenSection } from "@/components/plataforma/clientes/OrgSections"
import SectionTabs from "@/components/plataforma/clientes/SectionTabs"
import { usePermissions } from "@/hooks/usePermissions"
import { PLAN_NAMES, getOrgActivity, getOrgOverview } from "@/lib/plataforma/clientes"

export default function OrganizacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { platformCan } = usePermissions()
  const [tab, setTab] = useState("resumen")
  const { data: org, error, mutate } = useSWR(["clientes-org-overview", id], () => getOrgOverview(id), { revalidateOnFocus: false })

  if (error && !org) {
    return <ErrorState title="No pudimos cargar el negocio" description="Puede que ya no exista o que no tengas permiso para verlo." onRetry={() => void mutate()} />
  }
  if (!org) return <LoadingBlock label="Cargando negocio…" />

  const tabs = [
    { id: "resumen", label: "Resumen" },
    { id: "equipo", label: "Equipo", badge: org.memberCount },
    ...(platformCan("platform_billing", "read") ? [{ id: "facturacion", label: "Facturación" }] : []),
    { id: "actividad", label: "Actividad" },
    { id: "notas", label: "Notas internas" },
    { id: "acciones", label: "Acciones" },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/plataforma/organizaciones" className="inline-flex items-center gap-1.5 text-xs console-muted mb-3 hover:underline">
          <ArrowLeft size={12} aria-hidden="true" /> Negocios
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold console-title">{org.name}</h1>
          <Badge variant={org.membership === "free" ? "muted" : "accent"}>{PLAN_NAMES[org.membership]}</Badge>
          {org.status === "suspended" && <Badge variant="warning">Suspendido</Badge>}
          {org.subscription?.status === "PAST_DUE" && <Badge variant="warning">Pago atrasado</Badge>}
        </div>
      </div>

      <SectionTabs tabs={tabs} active={tab} onChange={setTab} />

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "resumen" && <ResumenSection org={org} />}
        {tab === "equipo" && <EquipoSection orgId={id} orgName={org.name} />}
        {tab === "facturacion" && <OrgBillingCard orgId={id} />}
        {tab === "actividad" && <ActivityList cacheKey={`org-${id}`} load={(offset) => getOrgActivity(id, offset)} emptyText="Cuando alguien del equipo de la plataforma o del negocio haga cambios importantes, aparecerán aquí." />}
        {tab === "notas" && <NotasSection orgId={id} />}
        {tab === "acciones" && <AccionesSection org={org} onChanged={() => mutate()} />}
      </div>
    </div>
  )
}
