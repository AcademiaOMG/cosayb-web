/**
 * Elección del logo a mostrar con respaldo en cadena (pura, sin React: se prueba aparte).
 *  - primary (fondos claros): logoPrimary → logoAlt → icono
 *  - alt (fondos oscuros):    logoAlt → logoPrimary → icono
 *  - icon (marca compacta):   solo el icono
 * `source` dice de dónde salió: si pedimos «alt» y salió el primario, el logo
 * puede no contrastar con un fondo oscuro y conviene ponerlo sobre una placa clara.
 */
export type LogoVariant = "primary" | "alt" | "icon"
export type LogoSource = "logoPrimary" | "logoAlt" | "icon"

export interface LogoAssets {
  logoPrimary: string | null
  logoAlt: string | null
  icon: string | null
}

export interface PickedLogo {
  src: string | null
  source: LogoSource | null
}

export function pickLogo(variant: LogoVariant, a: LogoAssets): PickedLogo {
  const order: LogoSource[] =
    variant === "icon"
      ? ["icon"]
      : variant === "alt"
        ? ["logoAlt", "logoPrimary", "icon"]
        : ["logoPrimary", "logoAlt", "icon"]
  for (const source of order) {
    const src = a[source]
    if (src) return { src, source }
  }
  return { src: null, source: null }
}

/** ¿El logo elegido fue pensado para fondo claro pero se va a pintar sobre uno oscuro/de color? */
export function needsLightPlate(variant: LogoVariant, picked: PickedLogo): boolean {
  return variant === "alt" && picked.source !== null && picked.source !== "logoAlt"
}
