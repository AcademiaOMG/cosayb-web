"use client"

import type { CSSProperties, ReactNode } from "react"
import {
  AlertTriangle,
  Bell,
  Calculator,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  GraduationCap,
  Home,
  Info,
  Package,
  Scale,
  Settings,
  User,
  UtensilsCrossed,
  XCircle,
} from "lucide-react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Badge from "@/components/ui/Badge"
import Table from "@/components/ui/Table"
import "@/app/(app)/dashboard/glass.css"
import { ModuleIllustration, type ModuleKey } from "@/components/brand/illustrations"

/**
 * Pantallas de la vista previa: réplica a escala de la plataforma real.
 * Todo el color sale de variables CSS (--sidebar-*, --header-*, --chip-*,
 * --info-*, --calc-*, --accent…) heredadas del contenedor aislado; con
 * respaldo (var(--x, var(--y))) para tokens que el motor aún no emita.
 */

export type PreviewScreen = "home" | "recipes" | "calc"

export const STAGE_W = 1200
export const STAGE_H = 700

const NAV: { id: string; label: string; icon: typeof Home; screen?: PreviewScreen }[] = [
  { id: "home", label: "Inicio", icon: Home, screen: "home" },
  { id: "inv", label: "Inventario", icon: Package },
  { id: "rec", label: "Recetas", icon: ChefHat, screen: "recipes" },
  { id: "menu", label: "Menú", icon: UtensilsCrossed },
  { id: "val", label: "Valoración", icon: Calculator, screen: "calc" },
  { id: "eq", label: "Punto de equilibrio", icon: Scale },
]

const MODULES: { label: string; key: ModuleKey }[] = [
  { label: "Inventario", key: "inventory" },
  { label: "Factor de Rendimiento", key: "yield" },
  { label: "Recetas", key: "recipes" },
  { label: "Menú", key: "menu" },
  { label: "Valoración", key: "valuation" },
  { label: "Punto de Equilibrio", key: "breakeven" },
  { label: "Configuración", key: "settings" },
  { label: "Mi cuenta", key: "account" },
]

const ROWS = [
  { name: "Pollo asado", cost: "$ 8.400", state: "Activa" },
  { name: "Arroz con coco", cost: "$ 2.150", state: "Borrador" },
  { name: "Ensalada verde", cost: "$ 3.900", state: "Activa" },
]

/* ─── Sidebar ────────────────────────────────────────────────────── */

function PreviewSidebar({ name, logoUrl, screen }: { name: string; logoUrl: string | null; screen: PreviewScreen }) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col" style={{ background: "var(--sidebar-bg)" }}>
      <div className="flex h-16 shrink-0 items-center px-5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo del negocio
          <img src={logoUrl} alt="" style={{ height: 36, width: "auto", maxWidth: 180, objectFit: "contain" }} />
        ) : (
          <span className="truncate text-2xl font-bold" style={{ color: "var(--sidebar-text)", fontFamily: "var(--font-display)" }}>
            {name}
          </span>
        )}
      </div>
      <div style={{ borderTop: "1px solid var(--sidebar-hairline)" }} />
      <div className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold" style={{ color: "var(--sidebar-muted)" }}>
        <GraduationCap size={14} aria-hidden /> Academia OMG
      </div>

      <nav className="flex-1 px-3 py-2">
        <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--sidebar-label)" }}>
          Operación
        </p>
        <ul className="flex flex-col gap-1">
          {NAV.map(({ id, label, icon: Icon, screen: s }) => {
            const active = s === screen
            return (
              <li key={id}>
                <span
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
                  style={{
                    background: active ? "var(--sidebar-active-bg, var(--accent))" : "transparent",
                    color: active ? "var(--sidebar-active-text, var(--on-accent))" : "var(--sidebar-muted)",
                  }}
                >
                  <Icon size={18} aria-hidden />
                  {label}
                </span>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Primeros pasos */}
      <div className="mx-3 mb-3 rounded-xl p-3" style={{ background: "var(--sidebar-hairline)" }}>
        <div className="flex items-center justify-between text-xs font-bold" style={{ color: "var(--sidebar-text)" }}>
          <span>Primeros pasos</span>
          <span style={{ color: "var(--sidebar-muted)" }}>1/3</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--sidebar-hairline)" }}>
          <div className="h-full w-1/3 rounded-full" style={{ background: "var(--sidebar-active-bg, var(--accent))" }} />
        </div>
        <ol className="mt-2 flex flex-col gap-1 text-xs" style={{ color: "var(--sidebar-muted)" }}>
          <li>1. Carga tu inventario</li>
          <li>2. Crea tu primera receta</li>
          <li>3. Arma tu menú</li>
        </ol>
      </div>

      <div className="px-3 py-3" style={{ borderTop: "1px solid var(--sidebar-hairline)" }}>
        {[
          { l: "Configuración", i: Settings },
          { l: "Mi cuenta", i: User },
        ].map(({ l, i: Icon }) => (
          <span key={l} className="flex items-center gap-3 px-3 py-2 text-sm font-medium" style={{ color: "var(--sidebar-muted)" }}>
            <Icon size={18} aria-hidden /> {l}
          </span>
        ))}
      </div>
    </aside>
  )
}

/* ─── Encabezado ─────────────────────────────────────────────────── */

function PreviewHeader({ name, title }: { name: string; title: string }) {
  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between gap-4 px-8"
      style={{ background: "var(--header-bg, var(--bg-surface))", color: "var(--header-text, var(--text-primary))", borderBottom: "1px solid var(--header-border, var(--border-light))" }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate text-base font-bold" style={{ fontFamily: "var(--font-display)" }}>{name}</span>
        <span
          className="rounded-full border px-2.5 py-0.5 text-xs font-semibold"
          style={{ background: "var(--chip-bg, var(--accent-light))", color: "var(--chip-text, var(--accent-text))", borderColor: "var(--chip-border, transparent)" }}
        >
          Plan Pro
        </span>
        <span aria-hidden style={{ opacity: 0.4 }}>·</span>
        <span className="truncate text-sm" style={{ opacity: 0.8 }}>{title}</span>
      </div>
      <Bell size={18} aria-hidden />
    </header>
  )
}

/* ─── Pantalla: Inicio ───────────────────────────────────────────── */


function HomeScreen() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Hola, Ana</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Buenas tardes</p>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="dash-section-title">¿Qué quieres revisar?</h3>
        <div className="glass-grid">
          {MODULES.map((m) => (
            <div key={m.key} className="glass glass-card">
              <div className="glass-card-icon">
                <ModuleIllustration module={m.key} />
              </div>
              <span className="glass-card-label">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Pantalla: Recetas / formulario ─────────────────────────────── */

type Tone = "success" | "warning" | "error" | "info"
const TONES: Record<Tone, CSSProperties> = {
  success: { background: "var(--success-bg)", borderColor: "var(--success-border, var(--success-bg-strong))", color: "var(--success-text)" },
  warning: { background: "var(--warning-bg)", borderColor: "var(--warning-border)", color: "var(--warning-text)" },
  error: { background: "var(--error-bg)", borderColor: "var(--error-border)", color: "var(--error-text)" },
  info: { background: "var(--info-bg, var(--accent-light))", borderColor: "var(--info-border, var(--accent))", color: "var(--info-text, var(--accent-text))" },
}

function Banner({ tone, icon: Icon, children }: { tone: Tone; icon: typeof Info; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 border p-3 text-sm font-medium" style={{ ...TONES[tone], borderRadius: "var(--radius-md)" }}>
      <Icon size={16} className="mt-px shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="p-5" style={{ background: "var(--bg-surface)", color: "var(--on-surface, var(--text-primary))", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}>
      <h3 className="mb-3 text-sm font-bold">{title}</h3>
      {children}
    </section>
  )
}

function RecipesScreen() {
  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="flex flex-col gap-5">
        <Panel title="Nueva receta">
          <div className="flex flex-col gap-3">
            <Input label="Nombre" defaultValue="Pollo asado" readOnly tabIndex={-1} />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Categoría</span>
              <div className="flex h-10 items-center justify-between border px-3 text-sm" style={{ background: "var(--bg-surface)", borderColor: "var(--border-light)", borderRadius: "var(--radius-md)" }}>
                <span>Platos fuertes</span>
                <ChevronDown size={16} aria-hidden style={{ color: "var(--text-muted)" }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" tabIndex={-1}>Guardar</Button>
              <Button type="button" variant="ghost" tabIndex={-1}>Cancelar</Button>
              <Button type="button" variant="danger" tabIndex={-1}>Eliminar</Button>
            </div>
          </div>
        </Panel>
        <div className="flex flex-col gap-2">
          <Banner tone="success" icon={CheckCircle2}>Receta guardada correctamente.</Banner>
          <Banner tone="warning" icon={AlertTriangle}>Falta el precio de un ingrediente.</Banner>
          <Banner tone="error" icon={XCircle}>No se pudo calcular el costo.</Banner>
          <Banner tone="info" icon={Info}>Tienes una actualización disponible.</Banner>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <Panel title="Mis recetas">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="accent">Destacada</Badge>
            <Badge variant="success">Activa</Badge>
            <Badge variant="warning">Pendiente</Badge>
            <Badge variant="muted">Borrador</Badge>
          </div>
          <Table
            columns={[
              { key: "name", header: "Receta" },
              { key: "cost", header: "Costo" },
              { key: "state", header: "Estado", render: (v) => <Badge variant={v === "Activa" ? "success" : "muted"}>{String(v)}</Badge> },
            ]}
            data={ROWS}
            rowKey="name"
          />
        </Panel>
        <Panel title="Ventana de confirmación (simulada)">
          <div className="p-3" style={{ background: "rgba(16,24,40,0.45)", borderRadius: "var(--radius-md)" }}>
            <div className="mx-auto max-w-xs p-4" style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)" }}>
              <p className="text-sm font-semibold">Eliminar receta</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>Esta acción no se puede deshacer.</p>
              <div className="mt-3 flex justify-end gap-2">
                <span className="border px-2.5 py-1 text-xs" style={{ borderColor: "var(--border-light)", borderRadius: "var(--radius-md)" }}>Cancelar</span>
                <span className="px-2.5 py-1 text-xs font-medium" style={{ background: "var(--error)", color: "var(--on-error, #fff)", borderRadius: "var(--radius-md)" }}>Eliminar</span>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

/* ─── Pantalla: Calculadora ──────────────────────────────────────── */

const KEYS: { k: string; kind: "num" | "op" | "eq" }[] = [
  { k: "7", kind: "num" }, { k: "8", kind: "num" }, { k: "9", kind: "num" }, { k: "÷", kind: "op" },
  { k: "4", kind: "num" }, { k: "5", kind: "num" }, { k: "6", kind: "num" }, { k: "×", kind: "op" },
  { k: "1", kind: "num" }, { k: "2", kind: "num" }, { k: "3", kind: "num" }, { k: "−", kind: "op" },
  { k: "0", kind: "num" }, { k: ".", kind: "num" }, { k: "=", kind: "eq" }, { k: "+", kind: "op" },
]
const KEY_STYLE: Record<"num" | "op" | "eq", CSSProperties> = {
  num: { background: "var(--calc-key)", color: "var(--calc-key-text)" },
  op: { background: "var(--calc-key-op)", color: "var(--calc-key-op-text)" },
  eq: { background: "var(--calc-key-equals)", color: "var(--calc-key-equals-text)" },
}

function CalcScreen() {
  return (
    <div className="flex items-start justify-center gap-8">
      <div
        className="w-[340px] shrink-0 p-5"
        style={{ background: "linear-gradient(160deg, var(--calc-body), var(--calc-body-2))", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)" }}
      >
        <div className="mb-3 flex items-center justify-between text-[11px] font-bold tracking-widest" style={{ color: "var(--calc-key)" }}>
          <span>COSAYB</span>
          <span aria-hidden className="h-3 w-8 rounded-sm" style={{ background: "var(--calc-accent)" }} />
        </div>
        <div className="mb-4 px-4 py-3 text-right" style={{ background: "var(--calc-display-bg)", color: "var(--calc-display-text)", borderRadius: "var(--radius-md)" }}>
          <p className="text-xs opacity-70">Costo por porción</p>
          <p className="font-mono text-3xl font-bold">12.450,00</p>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {KEYS.map(({ k, kind }) => (
            <span
              key={k}
              className="flex h-12 items-center justify-center text-lg font-bold"
              style={{ ...KEY_STYLE[kind], borderRadius: "var(--radius-md)", boxShadow: k === "5" ? "0 0 0 3px var(--calc-ring)" : "var(--shadow-sm)" }}
            >
              {k}
            </span>
          ))}
        </div>
      </div>
      <div className="w-72 shrink-0">
        <Panel title="Resumen del precio">
          <dl className="flex flex-col gap-2 text-sm">
            {[["Costo de ingredientes", "$ 8.400"], ["Mano de obra", "$ 2.100"], ["Margen objetivo", "35 %"]].map(([a, b]) => (
              <div key={a} className="flex justify-between gap-3">
                <dt style={{ color: "var(--text-secondary)" }}>{a}</dt>
                <dd className="font-semibold">{b}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 px-3 py-2 text-center text-sm font-bold" style={{ background: "var(--calc-key-equals)", color: "var(--calc-key-equals-text)", borderRadius: "var(--radius-md)" }}>
            Precio sugerido $ 16.150
          </div>
        </Panel>
      </div>
    </div>
  )
}

/* ─── Escenario completo ─────────────────────────────────────────── */

const TITLES: Record<PreviewScreen, string> = { home: "Inicio", recipes: "Recetas", calc: "Valoración" }

export default function PreviewStage({ screen, name, logoUrl }: { screen: PreviewScreen; name: string; logoUrl: string | null }) {
  return (
    <div
      className="flex"
      style={{
        width: STAGE_W,
        height: STAGE_H,
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
        overflow: "hidden",
      }}
    >
      <PreviewSidebar name={name} logoUrl={logoUrl} screen={screen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <PreviewHeader name={name} title={TITLES[screen]} />
        <main className="min-h-0 flex-1 overflow-hidden px-8 py-6">
          {screen === "home" && <HomeScreen />}
          {screen === "recipes" && <RecipesScreen />}
          {screen === "calc" && <CalcScreen />}
        </main>
      </div>
    </div>
  )
}
