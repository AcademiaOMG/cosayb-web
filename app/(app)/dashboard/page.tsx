"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import useSWR from "swr"
import { Bell } from "lucide-react"
import "./glass.css"
import PageHeader from "@/components/ui/PageHeader"
import { usePermissions } from "@/hooks/usePermissions"
import { authClient } from "@/lib/auth"
import { getDashboardInsights } from "@/lib/api"
import type { Resource, Action } from "@/lib/api"

type PermCheck = (can: (r: Resource, a: Action) => boolean, hasFeature: (k: string) => boolean) => boolean

interface ModuleCardDef {
  href: string
  label: string
  icon: string
  isVisible: PermCheck
}

const module_ = (resource: Resource, action: Action, feature: string): PermCheck =>
  (can, hasFeature) => can(resource, action) && hasFeature(feature)

const getTimeGreeting = (hour: number) => {
  if (hour < 6) return "Buenas noches!"
  if (hour < 12) return "Buenos días!"
  if (hour < 19) return "Buenas tardes!"
  return "Buenas noches!"
}

// Mismo criterio de acceso que el Sidebar (permiso de rol + feature de
// membresía) — un módulo que no aparece acá tampoco aparece en el nav.
// Las 8 funcionalidades viven en una sola grilla pareja — nada de columna
// aparte para Config/Cuenta, todas son "algo que revisar".
const ALL_CARDS: ModuleCardDef[] = [
  { href: "/inventario", label: "Inventario", icon: "/iconos/inventario2.png", isVisible: module_("ingredients", "list", "module_ingredients") },
  { href: "/factor-rendimiento", label: "Factor de Rendimiento", icon: "/iconos/rendimiento2.png", isVisible: module_("yieldFactors", "list", "module_yieldFactors") },
  { href: "/recetas", label: "Recetas", icon: "/iconos/receta2.png", isVisible: module_("recipes", "list", "module_recipes") },
  { href: "/menu", label: "Menú", icon: "/iconos/menu2.png", isVisible: module_("menus", "list", "module_menus") },
  { href: "/valoracion", label: "Valoración", icon: "/iconos/calculadora.png", isVisible: module_("valuations", "list", "module_valuations") },
  { href: "/punto-equilibrio", label: "Punto de Equilibrio", icon: "/iconos/equilibrio2.png", isVisible: module_("breakEven", "list", "module_breakEven") },
  { href: "/configuracion", label: "Configuración", icon: "/iconos/configuracion2.png", isVisible: (can) => can("organization", "update") || can("members", "list") },
  { href: "/cuenta", label: "Mi cuenta", icon: "/iconos/user2.png", isVisible: () => true },
]

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)

interface InsightContent {
  context: string
  figure: string
  explanation: string
  /** Substring de `explanation` a destacar (cursiva + acento) */
  emphasis: string
}

// Contexto corto → dato protagonista → explicación, nunca tutorial/CTA en
// el banner. Con datos reales de merma usa la organización; sin datos
// todavía, un insight ILUSTRATIVO (números ficticios) para que la
// composición visual se vea terminada — reemplazar/gatear esto cuando el
// motor de insights (sub-proyecto 3) tenga más fuentes reales que la merma.
function buildInsight(merma?: { totalRecoverable: number; items: { ingredientName: string; amount: number }[] }): InsightContent {
  const topItem = merma?.items[0]
  if (topItem && merma!.totalRecoverable > 0) {
    return {
      context: "Podrías recuperar",
      figure: fmtCOP(merma!.totalRecoverable),
      explanation: `si reduces la merma en ${topItem.ingredientName}`,
      emphasis: topItem.ingredientName,
    }
  }
  return {
    context: "Podrías recuperar",
    figure: fmtCOP(45000),
    explanation: "si reduces la merma del tomate",
    emphasis: "tomate",
  }
}

function withEmphasis(text: string, emphasis: string): ReactNode {
  const idx = text.indexOf(emphasis)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <em className="dash-banner-emph">{text.slice(idx, idx + emphasis.length)}</em>
      {text.slice(idx + emphasis.length)}
    </>
  )
}

export default function DashboardPage() {
  // La sesión de Better Auth se resuelve en el cliente (localStorage/cookie),
  // así que en el primer render del cliente puede ya tener el avatar
  // mientras el servidor siempre renderizó las iniciales — eso rompe la
  // hidratación (span vs img). Se retrasa el avatar real hasta después del
  // montaje para que el primer render del cliente calce con el del server.
  const [mounted, setMounted] = useState(false)
  const [timeGreeting, setTimeGreeting] = useState("Buenos días")
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true)
      setTimeGreeting(getTimeGreeting(new Date().getHours()))
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const { can, hasFeature, isLoading } = usePermissions()
  const { data: session } = authClient.useSession()
  const { data: insights } = useSWR(
    "dashboard-insights",
    () => getDashboardInsights().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  const cards = isLoading ? ALL_CARDS : ALL_CARDS.filter((c) => c.isVisible(can, hasFeature))
  const userName = session?.user?.name?.trim()
  const firstName = userName?.split(" ")[0]
  const userImage = mounted ? session?.user?.image ?? null : null
  const merma = insights?.merma
  const insight = buildInsight(merma)

  return (
    <div className="flex flex-col gap-8">
      {/* Mobile: sin navbar en Inicio — esta fila es contenido de la página,
          comparte el fondo del main, sin card/borde/sombra propios. */}
      <div className="flex lg:hidden items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="relative shrink-0 rounded-full overflow-hidden flex items-center justify-center"
            style={{ width: 36, height: 36, background: "var(--accent-light)" }}
          >
            {userImage ? (
              <Image src={userImage} alt="" fill className="object-cover" sizes="36px" />
            ) : (
              <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                {(firstName ?? "U").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-[17px] font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
              Hola, {firstName ?? "Usuario"}
            </span>
            <span className="text-xs font-medium tracking-[0.01em]" style={{ color: "var(--text-muted)" }}>
              {timeGreeting}
            </span>
          </div>
        </div>
        <button type="button" aria-label="Notificaciones" style={{ color: "var(--text-secondary)" }}>
          <Bell size={20} />
        </button>
      </div>

      <div className="hidden lg:block">
        <PageHeader
          title={firstName ? `Hola, ${firstName}` : "Inicio"}
          subtitle={timeGreeting}
        />
      </div>

      <div className="glass-grid-wrap glass-grid-wrap-wide">
        <div className="dash-banner">
          <span className="dash-banner-context">{insight.context}</span>
          <span className="dash-banner-figure">{insight.figure}</span>
          <p className="dash-banner-explanation">{withEmphasis(insight.explanation, insight.emphasis)}</p>
        </div>
      </div>

      <div className="glass-grid-wrap glass-grid-wrap-wide flex flex-col gap-3">
        <h2 className="dash-section-title">¿Qué quieres revisar?</h2>
        <div className="glass-grid">
          {isLoading
            ? [1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="glass-card-skeleton" />)
            : cards.map((c) => <ModuleCard key={c.href} {...c} />)}
        </div>
      </div>

      {merma && merma.items.length > 0 && (
        <div className="glass-grid-wrap glass-grid-wrap-wide flex flex-col gap-3">
          <h2 className="dash-section-title">Información que importa</h2>
          <div className="dash-insights-row">
            {merma.items.slice(0, 3).map((item) => (
              <div key={item.ingredientName} className="dash-insight-stat">
                <span className="dash-insight-stat-label">Recuperable por merma — {item.ingredientName}</span>
                <span className="dash-insight-stat-value">{fmtCOP(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ModuleCard({ href, label, icon, style }: ModuleCardDef & { style?: CSSProperties }) {
  return (
    <Link href={href} className="glass glass-card" style={style}>
      <div className="relative glass-card-icon">
        <Image src={icon} alt="" fill className="object-contain" sizes="96px" />
      </div>
      <span className="glass-card-label">{label}</span>
    </Link>
  )
}
