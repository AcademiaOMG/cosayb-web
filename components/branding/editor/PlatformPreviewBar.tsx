"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSWRConfig } from "swr"
import { Eye } from "lucide-react"
import Button from "@/components/ui/Button"
import { toast } from "@/lib/toast"
import { friendlyError } from "@/lib/errorMessage"
import { BRANDING_SWR_KEY, saveBranding } from "@/lib/branding/editorApi"
import { getPreviewState, stopPlatformPreview, subscribePreview } from "@/lib/branding/platformPreview"

const EDITOR_PATH = "/configuracion/marca"
const SERVER: ReturnType<typeof getPreviewState> = { active: false, theme: null, displayName: "", lastStop: null }

/**
 * Barra fija inferior de "Probar en toda la plataforma". Se monta una sola vez
 * en app/(app)/layout.tsx para seguir visible al navegar entre pantallas; el
 * borrador vive en memoria (lib/branding/platformPreview.ts) y no se persiste
 * hasta pulsar Guardar.
 */
export default function PlatformPreviewBar() {
  const preview = useSyncExternalStore(subscribePreview, getPreviewState, () => SERVER)
  const pathname = usePathname()
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const [saving, setSaving] = useState(false)

  if (!preview.active || !preview.theme) return null

  async function save() {
    if (!preview.theme) return
    setSaving(true)
    try {
      const name = preview.displayName.trim()
      const saved = await saveBranding(name ? { theme: preview.theme, displayName: name } : { theme: preview.theme })
      await mutate(BRANDING_SWR_KEY, saved, { revalidate: false })
      stopPlatformPreview("saved")
      toast.success("Marca guardada", { description: "Los cambios ya se aplican a tu negocio." })
      router.refresh()
    } catch (err) {
      toast.error("No se pudo guardar la marca", { description: friendlyError(err, "Inténtalo de nuevo.") })
    } finally {
      setSaving(false)
    }
  }

  function discard() {
    stopPlatformPreview("discard")
    if (pathname !== EDITOR_PATH) router.push(EDITOR_PATH)
  }

  return (
    <div
      role="region"
      aria-label="Vista previa de marca"
      className="fixed inset-x-0 bottom-0 z-[90] flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t px-4 py-3"
      style={{
        background: "var(--bg-inverse)",
        color: "var(--on-inverse)",
        borderColor: "var(--border-medium)",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Eye size={16} aria-hidden /> Vista previa — nada se guarda hasta que pulses Guardar
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {pathname !== EDITOR_PATH && (
          <Link
            href={EDITOR_PATH}
            className="inline-flex h-8 items-center rounded-[var(--radius-md)] border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{ borderColor: "currentColor" }}
          >
            Volver al editor
          </Link>
        )}
        <Button size="sm" variant="ghost" onClick={discard} disabled={saving} style={{ background: "var(--bg-surface)" }}>
          Descartar
        </Button>
        <Button size="sm" onClick={save} loading={saving} style={{ background: "var(--accent)", color: "var(--on-accent)" }}>
          Guardar
        </Button>
      </div>
    </div>
  )
}
