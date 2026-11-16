"use client"

import { useId, useState } from "react"
import { AlertTriangle, CheckCircle2, ChevronDown, Sparkles, Undo2, Wand2 } from "lucide-react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { analyzeTheme, derivedInfo } from "@/lib/branding/draft"
import { brandVars, type PaletteHarmony, type SidebarStyle } from "@/lib/branding/editorEngine"
import { TOKEN_GROUPS, type TokenSpec } from "@/lib/branding/tokens"
import type { BrandColors, BrandOverrides, BrandTheme } from "@/lib/branding/types"
import ColorField from "./ColorField"

/** Colores con comprobación de contraste en el motor (se muestra «Contraste correcto» si pasan). */
const CHECKED = ["text", "secondary", "accent", "primary"]

export const HARMONY_OPTIONS: { value: PaletteHarmony; label: string }[] = [
  { value: "analogous", label: "Análoga (tonos vecinos)" },
  { value: "complementary", label: "Complementaria (contraste)" },
  { value: "triadic", label: "Triádica (equilibrada)" },
  { value: "monochrome", label: "Monocromática (un solo tono)" },
]
export const SIDEBAR_OPTIONS: { value: SidebarStyle; label: string }[] = [
  { value: "dark", label: "Oscura" },
  { value: "light", label: "Clara" },
  { value: "brand", label: "Color de marca" },
]

interface Props {
  theme: BrandTheme
  onColor: (key: keyof BrandColors, value: string) => void
  onCalculator: (value: string | undefined) => void
  onOverride: (key: keyof BrandOverrides, value: string) => void
  onClearOverride: (key: keyof BrandOverrides) => void
  onSuggest: (opts: { harmony: PaletteHarmony; sidebar: SidebarStyle }) => void
  onAutoFix: () => void
  /** Deshace la última paleta sugerida. */
  onUndo?: () => void
  canUndo?: boolean
}

const selectCls =
  "h-10 w-full rounded-[var(--radius-md)] border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
const selectStyle = { background: "var(--bg-surface)", borderColor: "var(--border-light)", color: "var(--text-primary)" }

function SuggestPanel({ primary, onSuggest, onUndo, canUndo }: { primary: string; onSuggest: Props["onSuggest"]; onUndo?: () => void; canUndo?: boolean }) {
  const id = useId()
  const [harmony, setHarmony] = useState<PaletteHarmony>("analogous")
  const [sidebar, setSidebar] = useState<SidebarStyle>("dark")
  return (
    <div className="mb-5 flex flex-col gap-3 border p-4" style={{ borderColor: "var(--border-light)", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}>
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          <Sparkles size={16} aria-hidden /> ¿Empezar rápido?
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
          Genera una paleta completa y armónica a partir de tu color principal ({primary}). Reemplaza los colores del borrador; puedes deshacerlo.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-h`} className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Armonía de colores</label>
          <select id={`${id}-h`} className={selectCls} style={selectStyle} value={harmony} onChange={(e) => setHarmony(e.target.value as PaletteHarmony)}>
            {HARMONY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-s`} className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Estilo de la barra lateral</label>
          <select id={`${id}-s`} className={selectCls} style={selectStyle} value={sidebar} onChange={(e) => setSidebar(e.target.value as SidebarStyle)}>
            {SIDEBAR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" type="button" onClick={() => onSuggest({ harmony, sidebar })}>
          <Sparkles size={14} aria-hidden /> Sugerir paleta desde mi color principal
        </Button>
        {canUndo && onUndo && (
          <Button size="sm" variant="ghost" type="button" onClick={onUndo}>
            <Undo2 size={14} aria-hidden /> Deshacer sugerencia
          </Button>
        )}
      </div>
    </div>
  )
}

function CalculatorField({ theme, spec, onCalculator, issues, onApplyFix }: { theme: BrandTheme; spec: TokenSpec; onCalculator: Props["onCalculator"]; issues?: ReturnType<typeof analyzeTheme>["issues"]; onApplyFix: (hex: string) => void }) {
  const follows = !theme.calculator
  if (follows) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{spec.label}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span aria-hidden className="h-10 w-12 shrink-0 rounded-md border" style={{ background: theme.colors.primary, borderColor: "var(--border-medium)" }} />
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>Automático:</strong> sigue a tu color principal ({theme.colors.primary})
          </span>
          <Button size="sm" variant="ghost" type="button" onClick={() => onCalculator(theme.colors.primary)}>Elegir otro color</Button>
        </div>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text-primary)" }}>Cambia:</strong> {spec.affects.join(" · ")}
        </p>
        {spec.doesNotAffect && (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>No cambia:</strong> {spec.doesNotAffect.join(" · ")}
          </p>
        )}
      </div>
    )
  }
  return (
    <ColorField label={spec.label} value={theme.calculator!} onChange={(v) => onCalculator(v)} affects={spec.affects} doesNotAffect={spec.doesNotAffect} issues={issues} onApplyFix={onApplyFix}>
      <div>
        <button type="button" onClick={() => onCalculator(undefined)} className="text-xs font-semibold underline focus-visible:outline-2 focus-visible:outline-[var(--accent)]" style={{ color: "var(--accent-text)" }}>
          Volver a seguir al color principal
        </button>
      </div>
    </ColorField>
  )
}

function DerivedRow({ theme, spec, vars, onOverride, onClear, issues }: { theme: BrandTheme; spec: TokenSpec; vars: Record<string, string>; onOverride: Props["onOverride"]; onClear: Props["onClearOverride"]; issues?: ReturnType<typeof analyzeTheme>["issues"] }) {
  const key = spec.key as keyof BrandOverrides
  const info = derivedInfo(theme, key, vars)
  const failing = info.ratio !== null && !info.ok
  const ratioText =
    info.ratio !== null && info.min !== null ? (
      <span className="inline-flex items-center gap-1 font-semibold" style={{ color: failing ? "var(--warning-text)" : "var(--success-text)" }}>
        {failing ? <AlertTriangle size={13} aria-hidden /> : <CheckCircle2 size={13} aria-hidden />}
        Contraste {info.ratio.toFixed(1)}:1 {failing ? `(mínimo ${info.min}:1 sobre ${info.against})` : "correcto"}
      </span>
    ) : null

  return (
    <li className="flex flex-col gap-1.5 border-t pt-3 first:border-t-0 first:pt-0" style={{ borderColor: "var(--border-light)" }}>
      {info.isOverride && info.value ? (
        <ColorField label={spec.label} value={info.value} onChange={(v) => onOverride(key, v)} affects={spec.affects} doesNotAffect={spec.doesNotAffect} issues={issues} onApplyFix={(hex) => onOverride(key, hex)}>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>Fijado a mano</span>
            {ratioText}
            <Button size="sm" variant="ghost" type="button" onClick={() => onClear(key)}>
              <Undo2 size={14} aria-hidden /> Volver a automático
            </Button>
          </div>
        </ColorField>
      ) : (
        <>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{spec.label}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span aria-hidden className="h-7 w-9 shrink-0 rounded-md border" style={{ background: info.value ?? "transparent", borderColor: "var(--border-medium)" }} />
            <span className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>{info.value ?? "—"}</span>
            <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>Automático</span>
            {ratioText}
            {info.value && (
              <Button size="sm" variant="ghost" type="button" onClick={() => onOverride(key, info.value!)}>
                Fijar a mano
              </Button>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>Cambia:</strong> {spec.affects.join(" · ")}
          </p>
          {spec.derivation && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              <strong>Cómo se calcula:</strong> {spec.derivation}
            </p>
          )}
        </>
      )}
    </li>
  )
}

export default function PaletteSection({ theme, onColor, onCalculator, onOverride, onClearOverride, onSuggest, onAutoFix, onUndo, canUndo }: Props) {
  const analysis = analyzeTheme(theme)
  const vars = brandVars(theme)
  const overrideCount = Object.keys(theme.overrides ?? {}).length
  const fixField = (key: string, hex: string) => {
    if (key === "calculator") onCalculator(hex)
    else onColor(key as keyof BrandColors, hex)
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
            PALETA
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Elige pocos colores: los demás (texto del menú, encabezado, bordes…) se calculan solos para que siempre se lean bien.
          </p>
        </div>
        {!analysis.ok && (
          <Button size="sm" variant="ghost" onClick={onAutoFix}>
            <Wand2 size={14} aria-hidden /> Corregir automáticamente
          </Button>
        )}
      </div>

      <div role="status" aria-live="polite" className="mb-4 flex items-start gap-2 text-sm font-medium" style={{ color: analysis.ok ? "var(--success-text)" : "var(--warning-text)" }}>
        {analysis.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />}
        <span>
          {analysis.ok
            ? "La paleta cumple el contraste mínimo AA."
            : `${analysis.issues.length} aviso(s): hay colores con poco contraste o demasiado intensos. Usa «Corregir automáticamente» o el botón de cada aviso.`}
        </span>
      </div>

      <SuggestPanel primary={theme.colors.primary} onSuggest={onSuggest} onUndo={onUndo} canUndo={canUndo} />

      <div className="flex flex-col gap-7">
        {TOKEN_GROUPS.map((group) => {
          const inputs = group.tokens.filter((t) => t.source === "input")
          if (inputs.length === 0) return null
          return (
            <fieldset key={group.id} className="min-w-0">
              <legend className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {group.title}
              </legend>
              <p className="mb-3 mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>{group.description}</p>
              <div className="flex flex-col gap-5">
                {inputs.map((t) =>
                  t.key === "calculator" ? (
                    <CalculatorField key={t.key} theme={theme} spec={t} onCalculator={onCalculator} issues={analysis.byColor.calculator} onApplyFix={(hex) => fixField("calculator", hex)} />
                  ) : (
                    <ColorField
                      key={t.key}
                      label={t.label}
                      value={theme.colors[t.key as keyof BrandColors]}
                      onChange={(v) => onColor(t.key as keyof BrandColors, v)}
                      affects={t.affects}
                      doesNotAffect={t.doesNotAffect}
                      checked={CHECKED.includes(t.key)}
                      issues={analysis.byColor[t.key]}
                      onApplyFix={(hex) => fixField(t.key, hex)}
                    />
                  ),
                )}
              </div>
            </fieldset>
          )
        })}
      </div>

      <details className="group mt-7 border-t pt-4" style={{ borderColor: "var(--border-light)" }}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-[var(--accent)]" style={{ color: "var(--text-primary)" }}>
          <span>
            Avanzado: colores automáticos
            {overrideCount > 0 && <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>{overrideCount} fijado(s) a mano</span>}
          </span>
          <ChevronDown size={16} aria-hidden className="transition-transform group-open:rotate-180" />
        </summary>
        <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          Estos colores se calculan solos a partir de los anteriores, con contraste legible. Solo fíjalos a mano si tienes una razón; siempre puedes volver a automático.
        </p>
        <div className="mt-4 flex flex-col gap-6">
          {TOKEN_GROUPS.map((group) => {
            const derived = group.tokens.filter((t) => t.source === "derived")
            if (derived.length === 0) return null
            return (
              <div key={group.id}>
                <h3 className="mb-2 text-xs font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>{group.title}</h3>
                <ul className="flex flex-col gap-3" role="list">
                  {derived.map((t) => (
                    <DerivedRow key={t.key} theme={theme} spec={t} vars={vars} onOverride={onOverride} onClear={onClearOverride} issues={analysis.byColor[t.key]} />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </details>
    </Card>
  )
}
