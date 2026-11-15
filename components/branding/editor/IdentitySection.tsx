"use client"

import { useId } from "react"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import { FONT_OPTIONS, RADIUS_OPTIONS, SHADOW_OPTIONS } from "@/lib/branding/draft"
import { BRAND_FONT_VARIABLE } from "@/lib/branding/theme"
import type { BrandFont, BrandRadius, BrandShadow, BrandTheme } from "@/lib/branding/types"

interface Props {
  theme: BrandTheme
  displayName: string
  onRadius: (v: BrandRadius) => void
  onShadow: (v: BrandShadow) => void
  onFont: (v: BrandFont) => void
  onDisplayName: (v: string) => void
}

const RADIUS_PX: Record<BrandRadius, string> = { none: "0px", sm: "4px", md: "10px", lg: "14px", pill: "999px" }
const SHADOW_CSS: Record<BrandShadow, string> = {
  flat: "none",
  soft: "0 1px 4px rgba(16,24,40,0.18)",
  elevated: "0 6px 14px rgba(16,24,40,0.28)",
}

interface Choice<T extends string> {
  value: T
  label: string
}

/** Grupo de opciones tipo radio, navegable con flechas y con foco visible. */
function ChoiceGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  render,
  cols = "grid-cols-2 sm:grid-cols-5",
}: {
  legend: string
  name: string
  options: Choice<T>[]
  value: T
  onChange: (v: T) => void
  render: (o: Choice<T>) => React.ReactNode
  cols?: string
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {legend}
      </legend>
      <div className={`grid gap-2 ${cols}`}>
        {options.map((o) => {
          const selected = o.value === value
          return (
            <label
              key={o.value}
              className="relative flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-md)] border p-3 text-center text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--accent)] has-[:focus-visible]:ring-offset-2"
              style={{
                background: selected ? "var(--accent-light)" : "var(--bg-surface)",
                borderColor: selected ? "var(--accent)" : "var(--border-light)",
                color: selected ? "var(--accent-text)" : "var(--text-primary)",
                fontWeight: selected ? 600 : 400,
              }}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={selected}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {render(o)}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default function IdentitySection({ theme, displayName, onRadius, onShadow, onFont, onDisplayName }: Props) {
  const uid = useId()
  return (
    <Card>
      <h2 className="mb-4 text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
        IDENTIDAD VISUAL
      </h2>
      <div className="flex flex-col gap-6">
        <Input
          label="Nombre visible"
          hint="Aparece junto al logotipo en la barra lateral y los encabezados. Opcional."
          value={displayName}
          maxLength={60}
          onChange={(e) => onDisplayName(e.target.value)}
          placeholder="Nombre de tu marca"
        />

        <ChoiceGroup
          legend="Radio de bordes"
          name={`${uid}-radius`}
          options={RADIUS_OPTIONS}
          value={theme.radius}
          onChange={onRadius}
          render={(o) => (
            <>
              <span
                aria-hidden
                className="h-8 w-12 border-2"
                style={{ borderRadius: RADIUS_PX[o.value], borderColor: "currentColor" }}
              />
              {o.label}
            </>
          )}
        />

        <ChoiceGroup
          legend="Sombras"
          name={`${uid}-shadow`}
          options={SHADOW_OPTIONS}
          value={theme.shadow}
          onChange={onShadow}
          cols="grid-cols-3"
          render={(o) => (
            <>
              <span
                aria-hidden
                className="h-8 w-12 rounded-md"
                style={{ background: "var(--bg-surface)", boxShadow: SHADOW_CSS[o.value], border: "1px solid var(--border-light)" }}
              />
              {o.label}
            </>
          )}
        />

        <ChoiceGroup
          legend="Tipografía"
          name={`${uid}-font`}
          options={FONT_OPTIONS}
          value={theme.font}
          onChange={onFont}
          cols="grid-cols-2 sm:grid-cols-4"
          render={(o) => (
            <span style={{ fontFamily: `var(${BRAND_FONT_VARIABLE[o.value]}, var(--font-manrope))` }}>
              <span className="block text-xl leading-none">Aa</span>
              <span className="mt-1 block text-xs">{o.label}</span>
            </span>
          )}
        />
      </div>
    </Card>
  )
}
