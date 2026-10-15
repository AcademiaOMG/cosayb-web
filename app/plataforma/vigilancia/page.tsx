"use client"

import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import PlatformPage from "@/components/plataforma/PlatformPage"
import SectionTabs from "@/components/plataforma/clientes/SectionTabs"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import AlertList from "@/components/plataforma/vigilancia/AlertList"
import HealthPanel from "@/components/plataforma/vigilancia/HealthPanel"
import SecurityPanel from "@/components/plataforma/vigilancia/SecurityPanel"
import StatusBanner from "@/components/plataforma/vigilancia/StatusBanner"
import { vigilanciaApi } from "@/lib/plataforma/vigilancia"
import { SaasError } from "@/lib/saas/types"

type Tab = "seguridad" | "salud"

export default function VigilanciaPage() {
  const [tab, setTab] = useState<Tab>("seguridad")
  const [refreshing, setRefreshing] = useState(false)
  const { mutate: mutateAll } = useSWRConfig()
  const { data, error, mutate } = useSWR(["vigilancia", "alertas"], () => vigilanciaApi.alertas(), {
    revalidateOnFocus: false,
    refreshInterval: 60_000,
  })

  async function refresh() {
    setRefreshing(true)
    try {
      // Vuelve a pedir todo lo de esta pantalla: alertas, seguridad y salud.
      await mutateAll((key) => Array.isArray(key) && key[0] === "vigilancia", undefined, { revalidate: true })
    } finally {
      setRefreshing(false)
    }
  }

  const forbidden = error instanceof SaasError && error.code === "HTTP_403"

  return (
    <PlatformPage title="Vigilancia" description="Seguridad y salud de la plataforma: intentos fallidos, anomalías y errores, sin tener que mirar registros.">
      {forbidden ? (
        <p className="console-card text-sm console-muted">Tu rol no incluye esta sección.</p>
      ) : error && !data ? (
        <ErrorState title="No pudimos revisar la plataforma" onRetry={() => void mutate()} />
      ) : !data ? (
        <LoadingBlock label="Revisando la plataforma…" />
      ) : (
        <>
          <StatusBanner status={data.status} checkedAt={data.checkedAt} refreshing={refreshing} onRefresh={() => void refresh()} />
          <AlertList alerts={data.alerts} onGoHealth={() => setTab("salud")} />
          <div className="flex flex-col gap-4">
            <SectionTabs
              tabs={[
                { id: "seguridad", label: "Seguridad" },
                { id: "salud", label: "Salud del sistema" },
              ]}
              active={tab}
              onChange={(id) => setTab(id as Tab)}
            />
            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
              {tab === "seguridad" ? <SecurityPanel /> : <HealthPanel />}
            </div>
          </div>
        </>
      )}
    </PlatformPage>
  )
}
