"use client"

import { useState, type CSSProperties } from "react"
import { AlertTriangle, CheckCircle2, Info, XCircle, Bell, Search } from "lucide-react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import Table from "@/components/ui/Table"
import SearchableSelect from "@/components/ui/SearchableSelect"
import { themeToCssVars } from "@/lib/branding/theme"
import type { BrandTheme } from "@/lib/branding/types"

/**
 * Vista previa en vivo. Contenedor AISLADO: las variables CSS del borrador se
 * aplican como style en este nodo, así que todo lo que se renderiza DENTRO
 * (componentes reales del design system) las hereda sin tocar el resto de la
 * página.
 *
 * LIMITACIÓN: los portales (desplegable de SearchableSelect, Modal real, toasts,
 * tooltips) se montan en <body>, fuera de este contenedor, y NO heredan el
 * borrador; por eso el modal aquí es una simulación estática. Para ver los
 * portales con el borrador está "Probar en toda la plataforma".
 */

const OPTIONS = [
  { value: "a", label: "Pollo asado" },
  { value: "b", label: "Arroz con coco" },
  { value: "c", label: "Ensalada verde" },
]

const ROWS = [
  { name: "Pollo asado", cost: "$ 8.400", state: "Activa" },
  { name: "Arroz con coco", cost: "$ 2.150", state: "Borrador" },
  { name: "Ensalada verde", cost: "$ 3.900", state: "Activa" },
]

interface Props {
  theme: BrandTheme
  logoUrl: string | null
  iconUrl: string | null
  displayName: string
}

function Banner({ tone, icon: Icon, children }: { tone: "success" | "warning" | "error" | "info"; icon: typeof Info; children: React.ReactNode }) {
  const styles: Record<typeof tone, CSSProperties> = {
    success: { background: "var(--success-bg)", borderColor: "var(--success-bg-strong)", color: "var(--success-text)" },
    warning: { background: "var(--warning-bg)", borderColor: "var(--warning-border)", color: "var(--warning-text)" },
    error: { background: "var(--error-bg)", borderColor: "var(--error-border)", color: "var(--error-text)" },
    info: { background: "var(--accent-light)", borderColor: "var(--accent)", color: "var(--accent-text)" },
  }
  return (
    <div className="flex items-start gap-2 border p-2.5 text-xs font-medium" style={{ ...styles[tone], borderRadius: "var(--radius-md)" }}>
      <Icon size={14} className="mt-px shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  )
}

export default function BrandPreview({ theme, logoUrl, iconUrl, displayName }: Props) {
  const [sel, setSel] = useState("a")
  const vars = themeToCssVars(theme) as CSSProperties
  const name = displayName.trim() || "Tu negocio"

  return (
    <section
      aria-label="Vista previa de la marca"
      className="min-w-0 overflow-hidden border"
      style={{
        ...vars,
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
        borderColor: "var(--border-medium)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Topbar */}
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2" style={{ background: "var(--bg-surface)", borderColor: "var(--border-light)" }}>
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <Search size={14} aria-hidden style={{ color: "var(--text-muted)" }} />
          <span className="truncate">Recetas</span>
        </div>
        <Bell size={14} aria-hidden style={{ color: "var(--text-muted)" }} />
      </div>

      <div className="flex min-h-0">
        {/* Mini-sidebar */}
        <div className="flex w-24 shrink-0 flex-col gap-2 p-2.5 sm:w-28" style={{ background: "var(--sidebar-bg)", color: "var(--sidebar-text)" }}>
          <div className="flex items-center gap-1.5">
            {logoUrl || iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo del negocio
              <img src={(iconUrl ?? logoUrl) as string} alt="" className="h-6 w-6 shrink-0 rounded object-contain" />
            ) : (
              <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold" style={{ background: "var(--accent)", color: "var(--on-accent)" }}>
                {name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate text-xs font-bold">{name}</span>
          </div>
          <p className="mt-1 text-[10px] font-semibold tracking-widest" style={{ color: "var(--sidebar-label)" }}>MENÚ</p>
          <span className="rounded px-1.5 py-1 text-xs font-semibold" style={{ background: "var(--sidebar-hairline)", color: "var(--sidebar-text)" }}>Recetas</span>
          <span className="px-1.5 py-1 text-xs" style={{ color: "var(--sidebar-muted)" }}>Inventario</span>
          <span className="px-1.5 py-1 text-xs" style={{ color: "var(--sidebar-muted)" }}>Menús</span>
        </div>

        {/* Contenido */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-3">
          <Card className="!p-3">
            <p className="mb-2 text-sm font-semibold">Nueva receta</p>
            <div className="flex flex-col gap-2">
              <Input label="Nombre" defaultValue="Pollo asado" readOnly />
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Categoría</span>
                <SearchableSelect options={OPTIONS} value={sel} onChange={setSel} ariaLabel="Receta de ejemplo" placeholder="Seleccionar" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" type="button">Guardar</Button>
                <Button size="sm" variant="ghost" type="button">Cancelar</Button>
                <Button size="sm" variant="danger" type="button">Eliminar</Button>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="accent">Acento</Badge>
            <Badge variant="success">Activa</Badge>
            <Badge variant="warning">Pendiente</Badge>
            <Badge variant="muted">Borrador</Badge>
          </div>

          <Table
            columns={[
              { key: "name", header: "Receta" },
              { key: "cost", header: "Costo" },
              {
                key: "state",
                header: "Estado",
                render: (v) => <Badge variant={v === "Activa" ? "success" : "muted"}>{String(v)}</Badge>,
              },
            ]}
            data={ROWS}
            rowKey="name"
          />

          <div className="flex flex-col gap-1.5">
            <Banner tone="success" icon={CheckCircle2}>Receta guardada correctamente.</Banner>
            <Banner tone="warning" icon={AlertTriangle}>Falta el precio de un ingrediente.</Banner>
            <Banner tone="error" icon={XCircle}>No se pudo calcular el costo.</Banner>
            <Banner tone="info" icon={Info}>Tienes una actualización disponible.</Banner>
          </div>

          {/* Modal simulado (el real se monta en un portal y no hereda este contenedor) */}
          <div aria-hidden className="relative flex justify-center p-3" style={{ background: "rgba(16,24,40,0.45)", borderRadius: "var(--radius-md)" }}>
            <div className="w-full max-w-[16rem] p-3" style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)" }}>
              <p className="text-sm font-semibold">Eliminar receta</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>Esta acción no se puede deshacer.</p>
              <div className="mt-3 flex justify-end gap-2">
                <span className="px-2 py-1 text-xs" style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)" }}>Cancelar</span>
                <span className="px-2 py-1 text-xs" style={{ background: "var(--error)", color: "#fff", borderRadius: "var(--radius-md)" }}>Eliminar</span>
              </div>
            </div>
          </div>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Los desplegables y ventanas reales se ven con el tema al usar «Probar en toda la plataforma».
          </p>
        </div>
      </div>
    </section>
  )
}
