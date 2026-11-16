"use client"

import Link from "next/link"
import BrandLogo from "@/components/branding/BrandLogo"
import { useBrand } from "@/components/branding/BrandProvider"
import { pickLogo } from "@/components/branding/logoSource"

export const PLATFORM_NAME = "Academia OMG"

/** ¿El negocio tiene identidad propia (marca activa con logo o nombre)? Si no, se ve el «ACADEMIA OMG» de siempre. */
export function hasCustomIdentity(b: { enabled: boolean; displayName: string | null; logoPrimary: string | null; logoAlt: string | null; icon: string | null }): boolean {
  return b.enabled && (!!b.displayName || pickLogo("alt", b).src !== null)
}

/** Línea «by Academia OMG»: pequeña, atenuada y con tracking; el «by» en cursiva como acento tipográfico. */
export function PlatformLine({ className, color = "var(--sidebar-muted)" }: { className?: string; color?: string }) {
  return (
    <p
      className={`flex items-baseline gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${className ?? ""}`}
      style={{ color }}
    >
      <span className="text-[11px] font-normal normal-case italic tracking-normal" style={{ opacity: 0.8 }}>by</span>
      <span>{PLATFORM_NAME}</span>
    </p>
  )
}

/**
 * Cabecera del sidebar (w-60). Sin marca: «ACADEMIA OMG» como logo, igual que antes.
 * Con marca: composición en tres niveles — logo del negocio (alto reservado, sin saltos,
 * object-contain) → divisor fino → «by Academia OMG» atenuado.
 */
export default function SidebarBrand() {
  const brand = useBrand()
  const custom = hasCustomIdentity(brand)

  if (!custom) {
    return (
      <div
        className="flex items-center px-5 h-16 shrink-0"
        style={{ borderBottom: "1px solid var(--sidebar-hairline)" }}
      >
        <Link href="/dashboard" className="font-display text-2xl font-bold" style={{ color: "var(--sidebar-text)" }}>
          <BrandLogo variant="alt" height={36} />
        </Link>
      </div>
    )
  }

  const hasLogo = pickLogo("alt", brand).src !== null
  return (
    <div className="shrink-0 px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--sidebar-hairline)" }} data-sidebar-brand="">
      <Link
        href="/dashboard"
        aria-label={`${brand.displayName ?? PLATFORM_NAME}: ir al inicio`}
        className="flex items-center min-w-0 rounded-lg"
        style={{ minHeight: 44, color: "var(--sidebar-text)" }}
      >
        <span className="font-display block min-w-0 truncate text-xl font-bold leading-tight">
          <BrandLogo variant="alt" height={hasLogo ? 36 : 28} maxWidth={200} autoPlate />
        </span>
      </Link>
      <div aria-hidden className="my-2.5 h-px w-full" style={{ background: "var(--sidebar-hairline)" }} />
      <PlatformLine />
    </div>
  )
}
