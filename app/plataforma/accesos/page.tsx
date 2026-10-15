"use client"

import { Suspense, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import LoadingBlock from "@/components/ui/LoadingBlock"
import AccessDenied from "@/components/ui/AccessDenied"
import PlatformPage from "@/components/plataforma/PlatformPage"
import AccessUsersTab from "@/components/plataforma/accesos/AccessUsersTab"
import ActivityFeedTab from "@/components/plataforma/accesos/ActivityFeedTab"
import UserAccessDetail from "@/components/plataforma/accesos/UserAccessDetail"
import { usePermissions } from "@/hooks/usePermissions"

const TABS = [
  { id: "usuarios", label: "Últimos accesos" },
  { id: "actividad", label: "Actividad reciente" },
] as const

function AccesosContent() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { platformCan } = usePermissions()
  const [detailUserId, setDetailUserId] = useState<string | null>(null)
  const tab = params.get("vista") === "actividad" ? "actividad" : "usuarios"

  if (!platformCan("platform_audit", "list")) return <AccessDenied />

  const go = (id: string, extra?: string) => router.replace(id === "usuarios" ? pathname : `${pathname}?vista=actividad${extra ?? ""}`, { scroll: false })

  return (
    <PlatformPage title="Accesos" description="Quién entró a la plataforma, cuándo, desde dónde y qué módulos usó.">
      <div role="tablist" aria-label="Secciones de accesos" className="flex gap-1" style={{ borderBottom: "1px solid var(--border-light)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => go(t.id)}
            className="px-4 py-2 text-sm font-medium"
            style={{
              color: tab === t.id ? "var(--accent)" : "var(--text-secondary)",
              borderBottom: `2px solid ${tab === t.id ? "var(--accent)" : "transparent"}`,
              marginBottom: -1,
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "usuarios" ? <AccessUsersTab onOpenUser={setDetailUserId} /> : <ActivityFeedTab onOpenUser={setDetailUserId} />}
      </div>

      <UserAccessDetail
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
        onSeeActivity={(id) => {
          setDetailUserId(null)
          go("actividad", `&persona=${encodeURIComponent(id)}`)
        }}
        canOpenProfile={platformCan("platform_users", "read")}
      />
    </PlatformPage>
  )
}

export default function AccesosPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <AccesosContent />
    </Suspense>
  )
}
