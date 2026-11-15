/**
 * Vista previa temporal en TODA la plataforma. Guarda el borrador en memoria
 * (no persiste nada) y lo inyecta como <style id="brand-preview"> en <head>.
 * Cada declaración lleva !important porque el wrapper .app-theme-neutral y el
 * ThemeProvider pueden fijar los mismos tokens en línea más abajo en el árbol.
 */
import type { BrandTheme } from "./types"
import { themeToCssVars } from "./theme"

export const PREVIEW_STYLE_ID = "brand-preview"

export interface PlatformPreviewState {
  active: boolean
  theme: BrandTheme | null
  displayName: string
}

const INACTIVE: PlatformPreviewState = { active: false, theme: null, displayName: "" }
let state: PlatformPreviewState = INACTIVE
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function subscribePreview(l: () => void): () => void {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function getPreviewState(): PlatformPreviewState {
  return state
}

/** CSS del borrador; solo nombres --token y valores generados por themeToCssVars. */
export function previewCss(theme: BrandTheme): string {
  const body = Object.entries(themeToCssVars(theme))
    .filter(([k, v]) => /^--[a-z0-9-]+$/.test(k) && !/[;{}<>!]/.test(v))
    .map(([k, v]) => `${k}:${v} !important`)
    .join(";")
  return `:root,body,.app-theme-neutral{${body}}`
}

function applyStyle(theme: BrandTheme | null) {
  if (typeof document === "undefined") return
  let el = document.getElementById(PREVIEW_STYLE_ID)
  if (!theme) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement("style")
    el.id = PREVIEW_STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = previewCss(theme)
}

export function startPlatformPreview(theme: BrandTheme, displayName: string) {
  state = { active: true, theme, displayName }
  applyStyle(theme)
  emit()
}

/** Actualiza el borrador mientras la vista previa está activa. */
export function updatePlatformPreview(theme: BrandTheme, displayName: string) {
  if (!state.active) return
  state = { active: true, theme, displayName }
  applyStyle(theme)
  emit()
}

export function stopPlatformPreview() {
  state = INACTIVE
  applyStyle(null)
  emit()
}
