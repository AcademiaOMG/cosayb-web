"use client"

import { useState } from "react"
import { useBrand } from "./BrandProvider"
import { DEFAULT_BRAND_NAME } from "@/lib/branding/resolve"

interface Props {
  /** primary: fondos claros. alt: fondos oscuros (cae al primario). icon: marca compacta. */
  variant?: "primary" | "alt" | "icon"
  className?: string
  /** Altura de la imagen en px (por defecto 32). */
  height?: number
  /** Texto de reserva cuando no hay logo (por defecto el nombre visible o «ACADEMIA OMG»). */
  fallback?: string
}

/** Logo del negocio con respaldo al nombre actual cuando no hay imagen (o falla al cargar). */
export default function BrandLogo({ variant = "primary", className, height = 32, fallback }: Props) {
  const { displayName, logoPrimary, logoAlt, icon } = useBrand()
  const [failed, setFailed] = useState<string | null>(null)

  const src =
    variant === "icon" ? icon ?? null : variant === "alt" ? logoAlt ?? logoPrimary : logoPrimary ?? logoAlt
  const name = fallback ?? displayName ?? DEFAULT_BRAND_NAME

  if (src && failed !== src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- recurso privado con cookie de sesión; next/image no aplica
      <img
        src={src}
        alt={displayName ?? DEFAULT_BRAND_NAME}
        height={height}
        style={{ height, width: "auto", maxWidth: variant === "icon" ? height : 180, objectFit: "contain" }}
        className={className}
        onError={() => setFailed(src)}
      />
    )
  }
  return <span className={className}>{variant === "icon" ? name.charAt(0).toUpperCase() : name}</span>
}
