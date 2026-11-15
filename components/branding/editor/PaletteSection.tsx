"use client"

import { Wand2 } from "lucide-react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { COLOR_GROUPS, analyzeTheme } from "@/lib/branding/draft"
import type { BrandColors, BrandTheme } from "@/lib/branding/types"
import ColorField from "./ColorField"

/** Colores con comprobación de contraste en validateTheme (ver lib/branding/theme.ts). */
const CHECKED: (keyof BrandColors)[] = ["text", "secondary", "accent", "primary"]

interface Props {
  theme: BrandTheme
  onColor: (key: keyof BrandColors, value: string) => void
  onAutoFix: () => void
}

export default function PaletteSection({ theme, onColor, onAutoFix }: Props) {
  const analysis = analyzeTheme(theme)

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
            PALETA
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Elige los colores; la app deriva automáticamente el resto de tonos.
          </p>
        </div>
        {!analysis.ok && (
          <Button size="sm" variant="ghost" onClick={onAutoFix}>
            <Wand2 size={14} aria-hidden /> Corregir automáticamente
          </Button>
        )}
      </div>

      <div role="status" aria-live="polite" className="mb-4 text-sm font-medium"
        style={{ color: analysis.ok ? "var(--success-text)" : "var(--warning-text)" }}>
        {analysis.ok
          ? "La paleta cumple el contraste mínimo AA."
          : `${analysis.issues.length} aviso(s) de contraste: el texto podría ser difícil de leer.`}
      </div>

      <div className="flex flex-col gap-6">
        {COLOR_GROUPS.map((group) => (
          <fieldset key={group.id} className="min-w-0">
            <legend className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {group.title}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.fields.map((f) => (
                <ColorField
                  key={f.key}
                  label={f.label}
                  hint={f.hint}
                  value={theme.colors[f.key]}
                  onChange={(v) => onColor(f.key, v)}
                  checked={CHECKED.includes(f.key)}
                  issues={analysis.byColor[f.key]}
                />
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </Card>
  )
}
