// Lógica pura del selector con búsqueda (components/ui/SearchableSelect).
// Vive aparte para probarla sin DOM.

export interface SelectOption {
  value: string
  label: string
}

/** Minúsculas y sin tildes: "cafe" encuentra "Café". */
export function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

export function filterOptions<T extends SelectOption>(options: T[], query: string): T[] {
  const q = normalizeText(query)
  if (!q) return options
  return options.filter((o) => normalizeText(o.label).includes(q))
}

/** Siguiente posición resaltada con flechas (circular). `-1` = ninguna todavía. */
export function moveHighlight(current: number, delta: 1 | -1, count: number): number {
  if (count <= 0) return -1
  if (current < 0) return delta === 1 ? 0 : count - 1
  return (current + delta + count) % count
}

export interface DropdownPlacement {
  /** "down" = bajo el disparador; "up" = encima */
  side: "down" | "up"
  /** Alto máximo de TODO el panel */
  maxHeight: number
  left: number
  width: number
  /** Posición fija: `top` si abre hacia abajo, `bottom` si abre hacia arriba */
  top?: number
  bottom?: number
}

/**
 * Dónde abrir la lista para que no se corte: debajo si cabe (o si hay más
 * espacio abajo que arriba), si no, encima. Acota el ancho/posición al viewport.
 */
export function placeDropdown(
  rect: { top: number; bottom: number; left: number; width: number },
  viewport: { width: number; height: number },
  desiredHeight = 320,
  margin = 8,
  gap = 4,
): DropdownPlacement {
  const below = viewport.height - rect.bottom - margin - gap
  const above = rect.top - margin - gap
  const side = below >= Math.min(desiredHeight, 200) || below >= above ? "down" : "up"
  const room = side === "down" ? below : above
  const width = Math.min(rect.width, viewport.width - margin * 2)
  const left = Math.max(margin, Math.min(rect.left, viewport.width - width - margin))
  const maxHeight = Math.max(120, Math.min(desiredHeight, room))
  return side === "down"
    ? { side, maxHeight, left, width, top: rect.bottom + gap }
    : { side, maxHeight, left, width, bottom: viewport.height - rect.top + gap }
}

/**
 * ¿Se ofrece "Crear «texto»"? Solo con texto buscado y sin una opción que coincida
 * exactamente (ignora tildes/mayúsculas y un sufijo " · unidad" en la etiqueta).
 */
export function shouldOfferCreate(options: SelectOption[], query: string): boolean {
  const q = normalizeText(query)
  if (!q) return false
  return !options.some((o) => {
    const label = normalizeText(o.label)
    return label === q || normalizeText(o.label.split(" · ")[0]) === q
  })
}
