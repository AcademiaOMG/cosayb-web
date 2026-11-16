"use client"

import { useState } from "react"
import { useBrand } from "./BrandProvider"
import { DEFAULT_BRAND_NAME } from "@/lib/branding/resolve"
import { needsLightPlate, pickLogo, type LogoVariant } from "./logoSource"

interface Props {
  /** primary: fondos claros. alt: fondos oscuros. icon: marca compacta. Respaldo en cadena (ver logoSource). */
  variant?: LogoVariant
  className?: string
  /** Altura de la imagen en px (por defecto 32). */
  height?: number
  /** Ancho máximo en px (por defecto 180; el icono es cuadrado). */
  maxWidth?: number
  /** Placa clara tras la imagen cuando un logo pensado para fondo claro cae sobre un fondo oscuro (variant «alt» sin logo alterno). */
  autoPlate?: boolean
  /** Texto de reserva cuando no hay logo (por defecto el nombre visible o «ACADEMIA OMG»). */
  fallback?: string
}

/**
 * Logo del negocio con respaldo al nombre cuando no hay imagen o falla al cargar.
 * Nunca deforma (object-contain) ni cambia de alto: el contenedor padre puede reservar
 * `height` para que no haya saltos de layout mientras carga la imagen.
 */
export default function BrandLogo({ variant = "primary", className, height = 32, maxWidth, autoPlate = false, fallback }: Props) {
  const { displayName, logoPrimary, logoAlt, icon } = useBrand()
  const [failed, setFailed] = useState<string | null>(null)

  const picked = pickLogo(variant, { logoPrimary, logoAlt, icon })
  const src = picked.src
  const name = fallback ?? displayName ?? DEFAULT_BRAND_NAME

  if (src && failed !== src) {
    const img = (
      // eslint-disable-next-line @next/next/no-img-element -- recurso privado con cookie de sesión; next/image no aplica
      <img
        src={src}
        alt={displayName ?? DEFAULT_BRAND_NAME}
        height={height}
        decoding="async"
        draggable={false}
        style={{
          height,
          width: "auto",
          maxWidth: maxWidth ?? (variant === "icon" ? height : 180),
          objectFit: "contain",
          objectPosition: "left center",
          display: "block",
        }}
        className={className}
        onError={() => setFailed(src)}
      />
    )
    if (autoPlate && needsLightPlate(variant, picked)) {
      return (
        <span
          data-logo-plate=""
          style={{
            display: "inline-flex",
            padding: "6px 10px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-surface)",
            boxShadow: "0 0 0 1px var(--sidebar-hairline)",
            maxWidth: "100%",
          }}
        >
          {img}
        </span>
      )
    }
    return img
  }
  return <span className={className}>{variant === "icon" ? name.charAt(0).toUpperCase() : name}</span>
}
