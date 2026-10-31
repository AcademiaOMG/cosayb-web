"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Info } from "lucide-react"
import { FIELD_HELP, type FieldHelp, type HelpKey } from "@/lib/help/fieldHelp"

interface InfoTipProps {
  /** Clave del diccionario central (lib/help/fieldHelp.ts) */
  help?: HelpKey
  /** Texto propio cuando no vale la pena una entrada del diccionario */
  text?: string
  example?: string
  /** Nombre del campo, para lectores de pantalla ("Ayuda sobre Porciones") */
  label?: string
  className?: string
}

/**
 * Ayuda contextual de un campo: un icono pequeño que explica el campo.
 *  - Ratón: aparece al pasar el cursor.
 *  - Teclado: aparece al enfocarlo con Tab; Esc la cierra.
 *  - Móvil/táctil (sin hover): un toque la abre y otro (o tocar fuera) la cierra.
 * Un solo icono discreto por campo; el texto no ocupa espacio permanente en la interfaz.
 */
export default function InfoTip({ help, text, example, label, className }: InfoTipProps) {
  const entry: FieldHelp | undefined = help ? FIELD_HELP[help] : text ? { text, example } : undefined
  const id = useId()
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [pinned, setPinned] = useState(false) // abierta por clic/toque
  const rootRef = useRef<HTMLSpanElement>(null)
  const open = hover || focus || pinned

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setHover(false)
        setPinned(false)
      }
    }
    function onOutside(e: Event) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setPinned(false)
        setHover(false)
      }
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onOutside)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onOutside)
    }
  }, [open])

  if (!entry) return null

  // Los contenedores (p. ej. los registros de la calculadora) activan su campo al hacer clic:
  // la ayuda no debe disparar eso.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  return (
    <span
      ref={rootRef}
      className={`relative inline-flex align-middle ${className ?? ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={stop}
      onMouseDown={stop}
    >
      <button
        type="button"
        aria-label={label ? `Ayuda sobre ${label}` : "Ayuda"}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault()
          setPinned((p) => !p)
        }}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-muted)] outline-none transition hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        style={{ minWidth: 20 }}
      >
        <Info size={14} aria-hidden="true" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-1.5 w-60 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-lg border px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal shadow-lg"
          style={{
            background: "var(--bg-surface, #fff)",
            color: "var(--text-primary, #12213A)",
            borderColor: "var(--border, #e7e5e4)",
            textTransform: "none",
            letterSpacing: "normal",
          }}
        >
          {entry.text}
          {entry.example && (
            <span className="mt-1 block" style={{ color: "var(--text-secondary, #4A4438)" }}>
              <strong>Ejemplo:</strong> {entry.example}
            </span>
          )}
        </span>
      )}
    </span>
  )
}
