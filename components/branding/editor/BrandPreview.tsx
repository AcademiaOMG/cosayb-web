"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { brandVars } from "@/lib/branding/editorEngine"
import type { BrandTheme } from "@/lib/branding/types"
import PreviewStage, { STAGE_H, STAGE_W, type PreviewScreen } from "./PreviewScreens"

/**
 * Vista previa en vivo: un «mini-app» de la plataforma renderizado a un ancho
 * virtual (STAGE_W) y escalado con transform: scale para llenar el ancho
 * disponible (ResizeObserver), en escritorio y en móvil.
 *
 * Contenedor AISLADO: las variables CSS del borrador (tema + calculadora, las
 * mismas que produce el motor) se aplican como style en este nodo; todo lo que
 * se pinta dentro las hereda sin tocar el resto de la página.
 *
 * LIMITACIÓN: los portales (desplegable de SearchableSelect, Modal real,
 * toasts, tooltips) se montan en <body>, fuera de este contenedor, y NO
 * heredan el borrador. Por eso los selects y modales aquí son réplicas
 * estáticas. Para verlos con el borrador existe «Probar en toda la plataforma».
 */

const SCREENS: { id: PreviewScreen; label: string }[] = [
  { id: "home", label: "Inicio" },
  { id: "recipes", label: "Recetas" },
  { id: "calc", label: "Calculadora" },
]

interface Props {
  theme: BrandTheme
  logoUrl: string | null
  iconUrl: string | null
  displayName: string
}

export default function BrandPreview({ theme, logoUrl, iconUrl, displayName }: Props) {
  const [screen, setScreen] = useState<PreviewScreen>("home")
  const [width, setWidth] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const vars = useMemo(() => brandVars(theme) as CSSProperties, [theme])
  const name = displayName.trim() || "Tu negocio"

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scale = width > 0 ? width / STAGE_W : 0.5

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div role="tablist" aria-label="Pantalla de la vista previa" className="flex gap-1 rounded-[var(--radius-md)] p-1" style={{ background: "var(--bg-secondary)" }}>
        {SCREENS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`brand-screen-${s.id}`}
            aria-selected={screen === s.id}
            aria-controls="brand-preview-frame"
            onClick={() => setScreen(s.id)}
            className="flex-1 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            style={{
              background: screen === s.id ? "var(--bg-surface)" : "transparent",
              color: screen === s.id ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <section
        id="brand-preview-frame"
        role="tabpanel"
        aria-labelledby={`brand-screen-${screen}`}
        aria-label="Vista previa de la marca"
        className="min-w-0 overflow-hidden border"
        style={{
          ...vars,
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          borderColor: "var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div ref={wrapRef} className="relative w-full overflow-hidden" style={{ height: STAGE_H * scale }}>
          {/* inert: es una simulación, nada recibe foco ni clics dentro del mini-app */}
          <div
            inert
            aria-hidden
            style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}
          >
            <PreviewStage screen={screen} name={name} logoUrl={logoUrl ?? iconUrl} />
          </div>
        </div>
      </section>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Réplica a escala de la plataforma con tus colores. Los desplegables y ventanas reales se abren fuera de este recuadro y no heredan la
        vista previa: úsalos con «Probar en toda la plataforma».
      </p>
    </div>
  )
}
