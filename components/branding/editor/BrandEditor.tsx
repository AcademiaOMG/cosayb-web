"use client"

import { useEffect, useReducer, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Lock, RotateCcw, Save, Undo2, Eye, MonitorPlay } from "lucide-react"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { useUpgradeModal } from "@/components/app/settings/UpgradeModalProvider"
import { toast } from "@/lib/toast"
import { friendlyError } from "@/lib/errorMessage"
import { isPlanLimitError } from "@/lib/api"
import {
  brandDraftReducer,
  buildSavePayload,
  createDraftState,
  fixTheme,
  isDefaultTheme,
  isDirty,
} from "@/lib/branding/draft"
import { BRANDING_SWR_KEY, assetUrl, getBranding, saveBranding } from "@/lib/branding/editorApi"
import {
  getPreviewState,
  startPlatformPreview,
  stopPlatformPreview,
  subscribePreview,
  updatePlatformPreview,
} from "@/lib/branding/platformPreview"
import LogosSection from "./LogosSection"
import PaletteSection from "./PaletteSection"
import IdentitySection from "./IdentitySection"
import BrandPreview from "./BrandPreview"

type Tab = "edit" | "preview"

export default function BrandEditor() {
  const router = useRouter()
  const confirm = useConfirm()
  const { open: openUpgrade } = useUpgradeModal()
  const { data, error, mutate, isLoading } = useSWR(BRANDING_SWR_KEY, getBranding, { revalidateOnFocus: false })

  const [state, dispatch] = useReducer(brandDraftReducer, undefined, () => createDraftState(null, null))
  const [syncedVersion, setSyncedVersion] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<Tab>("edit")
  const preview = useSyncExternalStore(subscribePreview, getPreviewState, getPreviewState)

  const dirty = isDirty(state)
  const locked = data ? !data.enabled : false

  // Datos del servidor → borrador. Con cambios sin guardar solo se actualiza la base.
  if (data && data.version !== syncedVersion) {
    setSyncedVersion(data.version)
    if (syncedVersion === null) {
      dispatch({ type: "load", theme: data.theme, displayName: data.displayName })
      // Volvió desde "Probar en toda la plataforma": recupera el borrador en curso.
      const p = getPreviewState()
      if (p.active && p.theme) dispatch({ type: "restore", theme: p.theme, displayName: p.displayName })
    } else if (dirty) {
      dispatch({ type: "rebase", theme: data.theme, displayName: data.displayName })
    } else {
      dispatch({ type: "load", theme: data.theme, displayName: data.displayName })
    }
  }

  // Mantiene la vista previa global al día mientras se edita.
  useEffect(() => {
    updatePlatformPreview(state.theme, state.displayName)
  }, [state.theme, state.displayName])

  // La barra global descartó la vista previa: el borrador también se descarta.
  useEffect(() => {
    if (!preview.active && preview.lastStop === "discard") dispatch({ type: "discard" })
  }, [preview.active, preview.lastStop])

  // Aviso del navegador al cerrar o recargar con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  async function handleSave() {
    if (locked) return
    setSaving(true)
    try {
      const saved = await saveBranding(buildSavePayload(state))
      await mutate(saved, { revalidate: false })
      dispatch({ type: "load", theme: saved.theme, displayName: saved.displayName })
      setSyncedVersion(saved.version)
      stopPlatformPreview("saved")
      toast.success("Marca guardada", { description: "Los cambios ya se aplican a tu negocio." })
      router.refresh()
    } catch (err) {
      if (isPlanLimitError(err)) openUpgrade("white_label")
      else toast.error("No se pudo guardar la marca", { description: friendlyError(err, "Revisa tu conexión e inténtalo de nuevo.") })
    } finally {
      setSaving(false)
    }
  }

  async function handleDiscard() {
    const ok = await confirm({
      title: "Descartar cambios",
      description: "Se perderán los cambios sin guardar y se volverá a la última versión guardada.",
      confirmLabel: "Descartar",
      variant: "danger",
    })
    if (!ok) return
    stopPlatformPreview("discard")
    dispatch({ type: "discard" })
  }

  async function handleReset() {
    const ok = await confirm({
      title: "Restablecer valores por defecto",
      description: "Colores, bordes, sombras y tipografía volverán a los del sistema. Podrás revisarlo antes de guardar.",
      confirmLabel: "Restablecer",
      variant: "danger",
    })
    if (ok) dispatch({ type: "resetDefaults" })
  }

  function handleTryPlatform() {
    startPlatformPreview(state.theme, state.displayName)
    router.push("/dashboard")
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm" style={{ color: "var(--text-muted)" }} role="status">Cargando marca…</p>
      </Card>
    )
  }
  if (error || !data) {
    return (
      <Card>
        <p className="text-sm" role="alert" style={{ color: "var(--error-text)" }}>
          No se pudo cargar la configuración de marca. <button type="button" className="underline" onClick={() => mutate()}>Reintentar</button>
        </p>
      </Card>
    )
  }

  const version = data.version
  const logo = assetUrl(data.assets?.logoPrimary ?? null, version)
  const icon = assetUrl(data.assets?.icon ?? null, version)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {locked && (
        <div
          role="note"
          className="flex flex-wrap items-center justify-between gap-3 border p-4"
          style={{ background: "var(--accent-light)", borderColor: "var(--accent)", borderRadius: "var(--radius-lg)" }}
        >
          <p className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--accent-text)" }}>
            <Lock size={16} aria-hidden /> La personalización de marca (marca blanca) no está incluida en tu plan.
          </p>
          <Button size="sm" onClick={() => openUpgrade("white_label")}>Mejorar plan</Button>
        </div>
      )}

      {/* Pestañas solo en móvil */}
      <div role="tablist" aria-label="Editor o vista previa" className="flex gap-1 rounded-[var(--radius-md)] p-1 lg:hidden" style={{ background: "var(--bg-secondary)" }}>
        {(["edit", "preview"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            id={`brand-tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`brand-panel-${t}`}
            onClick={() => setTab(t)}
            className="flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            style={{
              background: tab === t ? "var(--bg-surface)" : "transparent",
              color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {t === "edit" ? "Editar" : "Vista previa"}
          </button>
        ))}
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div
          role="tabpanel"
          id="brand-panel-edit"
          aria-labelledby="brand-tab-edit"
          className={`${tab === "edit" ? "flex" : "hidden lg:flex"} min-w-0 flex-col gap-5`}
          // Bloqueado: contenido atenuado y sin interacción (ningún control puede escribir).
          inert={locked}
          style={locked ? { opacity: 0.55 } : undefined}
        >
          <LogosSection assets={data.assets} version={version} locked={locked} onChanged={() => mutate()} />
          <PaletteSection
            theme={state.theme}
            onColor={(key, value) => dispatch({ type: "setColor", key, value })}
            onAutoFix={() => dispatch({ type: "replaceTheme", theme: fixTheme(state.theme) })}
          />
          <IdentitySection
            theme={state.theme}
            displayName={state.displayName}
            onRadius={(value) => dispatch({ type: "setRadius", value })}
            onShadow={(value) => dispatch({ type: "setShadow", value })}
            onFont={(value) => dispatch({ type: "setFont", value })}
            onDisplayName={(value) => dispatch({ type: "setDisplayName", value })}
          />
        </div>

        <div
          role="tabpanel"
          id="brand-panel-preview"
          aria-labelledby="brand-tab-preview"
          className={`${tab === "preview" ? "block" : "hidden lg:block"} min-w-0`}
        >
          <div className="flex flex-col gap-3 lg:sticky lg:top-4">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
              <Eye size={14} aria-hidden /> VISTA PREVIA EN VIVO
            </div>
            <BrandPreview theme={state.theme} logoUrl={logo} iconUrl={icon} displayName={state.displayName} />
            <Button variant="ghost" size="sm" onClick={handleTryPlatform} disabled={locked}>
              <MonitorPlay size={14} aria-hidden /> Probar en toda la plataforma
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de acciones */}
      <div
        className="sticky bottom-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-2 border p-3"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-light)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)" }}
      >
        <p role="status" aria-live="polite" className="text-sm font-medium" style={{ color: dirty ? "var(--warning-text)" : "var(--text-muted)" }}>
          {dirty ? "Tienes cambios sin guardar" : "Sin cambios pendientes"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={locked || isDefaultTheme(state.theme)}>
            <RotateCcw size={14} aria-hidden /> Restablecer
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={locked || !dirty}>
            <Undo2 size={14} aria-hidden /> Descartar
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving} disabled={locked || !dirty}>
            <Save size={14} aria-hidden /> Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}
