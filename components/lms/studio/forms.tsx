"use client"

import Cover, { COVER_KEYS } from "@/components/lms/art/Cover"
import { LEVEL_LABEL } from "@/lib/lms/format"
import type { CourseLevel, CourseMeta } from "@/lib/lms/types"
import { SelectField, TextField } from "./kit"

export const DEFAULT_META: CourseMeta = { category: "General", level: "beginner", durationMinutes: 0, tags: [], coverKey: "cocina", instructorName: "Academia OMG" }

/** Metadatos de catálogo: categoría, nivel, duración, etiquetas, portada ilustrada e instructor visible. */
export function CourseMetaForm({ value, onChange }: { value: CourseMeta; onChange: (v: CourseMeta) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField label="Categoría" value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value })} maxLength={40} />
        <TextField label="Instructor visible" value={value.instructorName} onChange={(e) => onChange({ ...value, instructorName: e.target.value })} maxLength={80} />
        <SelectField
          label="Nivel"
          value={value.level}
          onChange={(e) => onChange({ ...value, level: e.target.value as CourseLevel })}
          options={(Object.keys(LEVEL_LABEL) as CourseLevel[]).map((l) => ({ value: l, label: LEVEL_LABEL[l] }))}
        />
        <TextField
          label="Duración estimada (minutos)"
          type="number"
          min={0}
          max={100000}
          value={value.durationMinutes}
          onChange={(e) => onChange({ ...value, durationMinutes: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
        />
      </div>
      <TextField
        label="Etiquetas"
        hint="Separadas por coma, máximo 8."
        value={value.tags.join(", ")}
        onChange={(e) => onChange({ ...value, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8) })}
      />
      <fieldset>
        <legend className="l-label mb-2">Portada ilustrada</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {COVER_KEYS.map((k) => (
            <label key={k} className="relative cursor-pointer overflow-hidden rounded-2xl border-2 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[var(--l-brand)]" style={{ borderColor: value.coverKey === k ? "var(--l-brand)" : "transparent" }}>
              <input type="radio" name="cover" className="sr-only" checked={value.coverKey === k} onChange={() => onChange({ ...value, coverKey: k })} aria-label={`Portada ${k}`} />
              <Cover coverKey={k} className="block h-auto w-full" />
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
