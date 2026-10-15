import Link from "next/link"
import { ArrowLeft, BarChart3, ChefHat, TrendingUp } from "lucide-react"

/**
 * Marco común de las pantallas de autenticación (login, registro, recuperación,
 * verificación). Panel de marca a la izquierda (solo escritorio) y tarjeta de
 * formulario a la derecha. Extraído de /login para no duplicar el diseño.
 */
export interface AuthShellProps {
  title: string
  subtitle?: string
  /** Titular del panel de marca; por defecto el genérico del producto. */
  brandHeadline?: React.ReactNode
  brandText?: string
  children: React.ReactNode
  footer?: React.ReactNode
  /** Mostrar «Al continuar aceptas términos y privacidad». */
  showTerms?: boolean
}

export default function AuthShell({
  title,
  subtitle,
  brandHeadline,
  brandText,
  children,
  footer,
  showTerms = true,
}: AuthShellProps) {
  return (
    <div className="min-h-dvh flex" style={{ background: "var(--bg-primary)" }}>
      <div
        className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
        style={{
          backgroundImage: `url('/images/team-bg.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{ background: "rgba(18, 33, 58, 0.8)" }} />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative z-10">
          <span className="font-display text-4xl font-bold tracking-tight" style={{ color: "#fff" }}>
            CO$AYB
          </span>
        </div>

        <div className="relative z-10 flex flex-col gap-10 max-w-lg">
          <div className="flex flex-col gap-3">
            <p
              className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight"
              style={{ color: "#fff", fontFamily: "var(--font-barlow-condensed)" }}
            >
              {brandHeadline ?? (
                <>
                  Controla los costos
                  <br />
                  de tu restaurante
                </>
              )}
            </p>
            <p className="text-base leading-relaxed max-w-md" style={{ color: "rgba(255,255,255,0.5)" }}>
              {brandText ??
                "Calcula costos reales por porción, analiza rentabilidad y toma mejores decisiones para tu negocio."}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {[
              { icon: ChefHat, label: "Costos reales por porción", desc: "Ingredientes, rendimiento y recetas" },
              { icon: BarChart3, label: "Análisis de rentabilidad", desc: "Precios sugeridos al instante" },
              { icon: TrendingUp, label: "Menús para eventos", desc: "Planifica y cotiza servicios" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <Icon size={18} style={{ color: "var(--accent)" }} />
                </div>
                <div className="flex flex-col gap-0.5 pt-1">
                  <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{label}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            Software de costos para restaurantes en Colombia
          </p>
        </div>
      </div>

      <main id="contenido" className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-[400px] flex flex-col">
          <div className="lg:hidden flex flex-col items-center mb-10 gap-2">
            <span className="font-display text-4xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              CO$AYB
            </span>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Software de Costos para Restaurantes</p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-8 text-sm font-medium transition-colors self-start"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={14} />
            Volver al inicio
          </Link>

          <div className="mb-8">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-barlow-condensed)" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
            )}
          </div>

          <div
            className="rounded-2xl"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              boxShadow: "0 1px 3px rgba(18,33,58,0.04), 0 8px 24px rgba(18,33,58,0.06)",
            }}
          >
            <div className="px-6 py-7 flex flex-col gap-5 sm:px-8">{children}</div>
          </div>

          {footer && <div className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>{footer}</div>}

          {showTerms && (
            <p className="text-center text-xs mt-6 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Al continuar, aceptas nuestros{" "}
              <Link href="/terms" className="underline transition-colors hover:text-[var(--text-secondary)]">términos</Link>{" "}
              y{" "}
              <Link href="/privacy" className="underline transition-colors hover:text-[var(--text-secondary)]">política de privacidad</Link>
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

export function AuthSpinner() {
  return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
      <div
        role="status"
        aria-label="Cargando"
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
      />
    </div>
  )
}
