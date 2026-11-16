"use client"

import Link from "next/link"
import BrandLogo from "@/components/branding/BrandLogo"
import { useBrand } from "@/components/branding/BrandProvider"
import { pickLogo } from "@/components/branding/logoSource"

export const PLATFORM_NAME = "Academia OMG"

/** Isotipo de la plataforma (public/logo.png: plato, libro y «$»). Proporción 358×329. */
const MARK_RATIO = 358 / 329

/**
 * Isotipo de Academia OMG pintado con `currentColor` mediante una máscara: se adapta solo
 * al color del texto del sidebar (claro u oscuro) sin filtros ni versiones duplicadas.
 */
export function PlatformMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 ${className ?? ""}`}
      data-platform-mark=""
      style={{
        width: Math.round(size * MARK_RATIO),
        height: size,
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/logo.png)",
        maskImage: "url(/logo.png)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  )
}

/** ¿El negocio tiene identidad propia (marca activa con logo o nombre)? Si no, se ve el logo de la plataforma. */
export function hasCustomIdentity(b: { enabled: boolean; displayName: string | null; logoPrimary: string | null; logoAlt: string | null; icon: string | null }): boolean {
  return b.enabled && (!!b.displayName || pickLogo("alt", b).src !== null)
}

/**
 * Firma de la plataforma: «by [isotipo] ACADEMIA OMG». Pequeña, atenuada y con tracking;
 * el «by» en cursiva como acento tipográfico.
 */
export function PlatformLine({ className, color = "var(--sidebar-muted)" }: { className?: string; color?: string }) {
  return (
    <p
      className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${className ?? ""}`}
      style={{ color }}
    >
      <span className="text-[11px] font-normal normal-case italic tracking-normal" style={{ opacity: 0.8 }}>by</span>
      <PlatformMark size={14} />
      <span>{PLATFORM_NAME}</span>
    </p>
  )
}

/**
 * Cabecera del sidebar (w-60), centrada.
 * - Sin marca: el logo de la plataforma (isotipo + «ACADEMIA OMG»), como en la landing.
 * - Con marca: logo (o nombre) del negocio y, debajo, la firma «by [isotipo] ACADEMIA OMG».
 *   Sin divisor entre ambos: el aire y el cambio de escala bastan.
 */
export default function SidebarBrand() {
  const brand = useBrand()
  const custom = hasCustomIdentity(brand)

  if (!custom) {
    return (
      <div
        className="flex h-16 shrink-0 items-center justify-center px-5"
        style={{ borderBottom: "1px solid var(--sidebar-hairline)" }}
      >
        <Link
          href="/dashboard"
          aria-label={`${PLATFORM_NAME}: ir al inicio`}
          className="flex items-center gap-2.5"
          style={{ color: "var(--sidebar-text)" }}
        >
          <PlatformMark size={30} />
          <span className="font-display text-[19px] font-bold leading-none tracking-tight">ACADEMIA OMG</span>
        </Link>
      </div>
    )
  }

  const hasLogo = pickLogo("alt", brand).src !== null
  return (
    <div
      className="flex shrink-0 flex-col items-center gap-2.5 px-5 pb-4 pt-5 text-center"
      style={{ borderBottom: "1px solid var(--sidebar-hairline)" }}
      data-sidebar-brand=""
    >
      <Link
        href="/dashboard"
        aria-label={`${brand.displayName ?? PLATFORM_NAME}: ir al inicio`}
        className="flex min-h-10 min-w-0 max-w-full items-center justify-center rounded-lg"
        style={{ color: "var(--sidebar-text)" }}
      >
        <span className="font-display block min-w-0 max-w-full truncate text-xl font-bold leading-tight">
          <BrandLogo variant="alt" height={hasLogo ? 40 : 28} maxWidth={200} autoPlate />
        </span>
      </Link>
      <PlatformLine className="justify-center" />
    </div>
  )
}
