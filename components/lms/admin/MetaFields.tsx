"use client"

import "@/app/(learn)/lms.css"
import Input from "@/components/ui/Input"
import Cover, { COVER_KEYS } from "@/components/lms/art/Cover"
import { LEVEL_LABEL } from "@/lib/lms/format"
import type { CourseLevel, CourseMeta } from "@/lib/lms/types"
import { NumberField, fieldStyle } from "./ui"

export const DEFAULT_META: CourseMeta = { category: "General", level: "beginner", durationMinutes: 0, tags: [], coverKey: "cocina", instructorName: "Academia OMG" }

/** Metadatos de catálogo (categoría, nivel, duración, etiquetas, portada, instructor visible). */
export default function MetaFields({ value, onChange }: { value: CourseMeta; onChange: (v: CourseMeta) => void }) {
  return (
    <div className="lms-root !min-h-0 flex flex-col gap-4 !bg-transparent">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Categoría" value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value })} maxLength={40} />
        <Input label="Instructor visible" value={value.instructorName} onChange={(e) => onChange({ ...value, instructorName: e.target.value })} maxLength={80} />
        <label className="flex flex-col gap-1.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Nivel
          <select className="h-10 w-full px-3 text-sm font-normal" style={fieldStyle} value={value.level} onChange={(e) => onChange({ ...value, level: e.target.value as CourseLevel })}>
            {(Object.keys(LEVEL_LABEL) as CourseLevel[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
          </select>
        </label>
        <NumberField label="Duración estimada (minutos)" min={0} max={100000} value={value.durationMinutes} onChange={(e) => onChange({ ...value, durationMinutes: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
      </div>
      <Input label="Etiquetas (separadas por coma, máx. 8)" value={value.tags.join(", ")} onChange={(e) => onChange({ ...value, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8) })} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Portada ilustrada</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {COVER_KEYS.map((k) => (
            <label key={k} className="relative cursor-pointer overflow-hidden rounded-2xl border-2" style={{ borderColor: value.coverKey === k ? "var(--accent)" : "transparent" }}>
              <input type="radio" name="cover" className="sr-only" checked={value.coverKey === k} onChange={() => onChange({ ...value, coverKey: k })} aria-label={`Portada ${k}`} />
              <Cover coverKey={k} className="block h-auto w-full" />
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
