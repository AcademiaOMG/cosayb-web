"use client"

import Link from "next/link"
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from "react"

// Librería de componentes base del LMS (estilos en app/(learn)/lms.css).

export type Tone = "brand" | "amber" | "rose" | "mint" | "sky" | "neutral"

export const TONE: Record<Tone, { bg: string; fg: string; ink: string }> = {
  brand: { bg: "var(--l-tint-bg)", fg: "var(--l-tint)", ink: "var(--l-tint-ink)" },
  amber: { bg: "var(--l-amber-bg)", fg: "var(--l-amber)", ink: "var(--l-amber-ink)" },
  rose: { bg: "var(--l-rose-bg)", fg: "var(--l-rose)", ink: "var(--l-rose-ink)" },
  mint: { bg: "var(--l-mint-bg)", fg: "var(--l-mint)", ink: "var(--l-mint-ink)" },
  sky: { bg: "var(--l-sky-bg)", fg: "var(--l-sky)", ink: "var(--l-sky-ink)" },
  neutral: { bg: "#eceff5", fg: "#8792a6", ink: "#3f4a5e" },
}

/** Índice de entrada escalonada (CSS var --i). */
export const rise = (i: number): CSSProperties => ({ ["--i" as string]: i })

export function Card({ children, className = "", hover, style }: { children: ReactNode; className?: string; hover?: boolean; style?: CSSProperties }) {
  return (
    <div className={`l-card ${hover ? "l-card-hover" : ""} ${className}`} style={style}>
      {children}
    </div>
  )
}

export function Badge({ tone = "brand", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  const t = TONE[tone]
  return (
    <span className={`l-badge ${className}`} style={{ background: t.bg, color: t.ink }}>
      {children}
    </span>
  )
}

type Variant = "primary" | "soft" | "ghost"

export function Button({ variant = "primary", size, loading, className = "", children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm"; loading?: boolean }) {
  return (
    <button type="button" {...rest} disabled={rest.disabled || loading} className={`l-btn l-btn-${variant} ${size === "sm" ? "l-btn-sm" : ""} ${className}`}>
      {loading ? <span aria-hidden="true" className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  )
}

export function LinkButton({ href, variant = "primary", size, children, className = "", ...rest }: { href: string; variant?: Variant; size?: "sm"; children: ReactNode; className?: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} {...rest} className={`l-btn l-btn-${variant} ${size === "sm" ? "l-btn-sm" : ""} ${className}`}>
      {children}
    </Link>
  )
}

export function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="l-chip" aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  )
}

/** Pestañas accesibles (roles tablist/tab, flechas izquierda/derecha). */
export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="l-tabs"
      onKeyDown={(e) => {
        const i = tabs.findIndex((t) => t.id === value)
        if (e.key === "ArrowRight") onChange(tabs[(i + 1) % tabs.length].id)
        if (e.key === "ArrowLeft") onChange(tabs[(i - 1 + tabs.length) % tabs.length].id)
      }}
    >
      {tabs.map((t) => (
        <button key={t.id} role="tab" type="button" className="l-tab" aria-selected={value === t.id} tabIndex={value === t.id ? 0 : -1} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count !== undefined ? (
            <span className="ml-1.5 rounded-full px-1.5 text-xs" style={{ background: "var(--l-tint-bg)", color: "var(--l-tint-ink)" }}>
              {t.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

const AV = ["var(--accent)", "#d6336c", "#16885a", "#b86e00", "#12213A"]
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  const color = AV[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AV.length]
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {initials}
    </span>
  )
}

export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden="true" className={`l-skeleton ${className}`} style={style} />
}

export function EmptyState({ art, title, description, action }: { art?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="l-card l-rise flex flex-col items-center gap-3 px-6 py-12 text-center" role="status">
      {art}
      <h2 className="text-lg font-extrabold">{title}</h2>
      {description && (
        <p className="max-w-md text-sm" style={{ color: "var(--l-muted)" }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

export function ErrorPanel({ title = "No pudimos cargar esto", description = "Revisa tu conexión e inténtalo de nuevo.", onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="l-card flex flex-col items-center gap-3 px-6 py-10 text-center" role="alert">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="max-w-md text-sm" style={{ color: "var(--l-muted)" }}>
        {description}
      </p>
      {onRetry && (
        <Button variant="soft" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}

/** Barra de progreso accesible con color por tono y relleno animado. */
export function ProgressBar({ value, tone = "brand", label, index = 0, height = 8 }: { value: number; tone?: Tone; label: string; index?: number; height?: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={label} className="w-full overflow-hidden rounded-full" style={{ height, background: TONE[tone].bg }}>
      <div className="l-bar-fill h-full rounded-full" style={{ width: `${v}%`, background: TONE[tone].fg, ["--i" as string]: index }} />
    </div>
  )
}

/** Donut SVG con arco animado. */
export function Donut({ value, tone = "brand", size = 64, stroke = 8, label, children, index = 0 }: { value: number; tone?: Tone; size?: number; stroke?: number; label: string; children?: ReactNode; index?: number }) {
  const v = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div role="img" aria-label={`${label}: ${Math.round(v)}%`} className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TONE[tone].bg} strokeWidth={stroke} />
        <circle
          className="l-ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE[tone].fg}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: c * (1 - v / 100), ["--ring-from" as string]: c, ["--ring-to" as string]: c * (1 - v / 100), ["--i" as string]: index }}
        />
      </svg>
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-center font-extrabold" style={{ fontSize: size * 0.24 }}>
        {children ?? `${Math.round(v)}%`}
      </span>
    </div>
  )
}

export function IconTile({ tone, children, size = 40 }: { tone: Tone; children: ReactNode; size?: number }) {
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center rounded-2xl" style={{ width: size, height: size, background: TONE[tone].fg, color: "#fff" }}>
      {children}
    </span>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-balance text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions}
    </header>
  )
}
