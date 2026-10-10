"use client"

import { useEffect, useRef, useState } from "react"
import SearchableSelect from "@/components/ui/SearchableSelect"
import { CalcActionKey, CalcDevice, CalcDisplay, CalcKeypad, CalcRegister, useCalcRegisters } from "@/components/calculator"
import {
  applyEntryKey,
  entryKeyFromKeyboard,
  formatPercentEntry,
  parseEntry,
  sanitizeEntry,
  type EntryKey,
  type EntryOptions,
} from "@/lib/calculator/entry"

export type MenuCalcField = "persons" | "margin" | "pctMP" | "grams"

/** Qué y con cuánto agregar a la lista del menú */
export interface MenuCalcAdd {
  componentType: "recipe" | "ingredient"
  id: string
  grams: string
}

type Mode = "recipes" | "ingredients"

const ENTRY: Record<MenuCalcField, EntryOptions> = {
  persons: { decimals: false, maxDigits: 4 },
  margin: { decimals: false, maxDigits: 2 },
  pctMP: { decimals: false, maxDigits: 2 },
  grams: { decimals: false, maxDigits: 4 },
}

/** Campos del formulario (no incluye gramos: ese valor es local al agregar) */
const ORDER: MenuCalcField[] = ["persons", "margin", "pctMP", "grams"]

const fmtCOP = (v: number) => `$${v.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
}

/**
 * Calculadora del módulo Menú: mismo aparato, pantalla, registros y teclado
 * que la calculadora de punto de equilibrio, con la funcionalidad del menú —
 * personas, margen de seguridad y % de materia prima. Para agregar platos se
 * elige Recetas o Ingredientes, se busca en el select, se escriben los gramos
 * (o unidades) por porción con el teclado y se pulsa "Agregar a la lista",
 * que comparte fila con los gramos; el producto queda en la
 * lista de la derecha y "Calcular" muestra el resultado en su modal.
 */
export default function MenuCalculator({
  values,
  resetValues,
  itemCount,
  costoPorcion,
  loading = false,
  pctNote,
  recipes,
  ingredients,
  onChange,
  onAddItem,
  onCalculate,
}: {
  /** Valores actuales (crudos): personas, margen y % de materia prima */
  values: Record<"persons" | "margin" | "pctMP", string>
  /** Con qué valores abrió la vista: la tecla "Limpiar" los restaura */
  resetValues: Record<"persons" | "margin" | "pctMP", string>
  /** Platos y extras ya en la lista */
  itemCount: number
  /** Total por porción si hay costo calculable; null si falta algo */
  costoPorcion: number | null
  /** Alguno de los platos todavía resuelve su costo */
  loading?: boolean
  /** Semáforo del % de materia prima (debajo del registro) */
  pctNote?: React.ReactNode
  /** Recetas disponibles (selector en modo Recetas) */
  recipes: { id: string; name: string }[]
  /** Ingredientes disponibles (selector en modo Ingredientes) */
  ingredients: { id: string; name: string }[]
  onChange: (field: "persons" | "margin" | "pctMP", raw: string) => void
  onAddItem: (item: MenuCalcAdd) => void
  /** Abre el modal con el resultado del cálculo del menú */
  onCalculate: () => void
}) {
  const regs = useCalcRegisters<MenuCalcField>(ENTRY, { ...values, grams: "" }, "persons")
  const [clearArmed, setClearArmed] = useState(false)
  const [mode, setMode] = useState<Mode>("recipes")
  const [selected, setSelected] = useState("")
  const [addError, setAddError] = useState<string | null>(null)

  const wrapRef = useRef<HTMLDivElement>(null)
  const registerRefs = useRef<Partial<Record<MenuCalcField, HTMLInputElement | null>>>({})

  /** Solo los campos del formulario se notifican al padre; gramos es local. */
  function notify(f: MenuCalcField, raw: string) {
    if (f !== "grams") onChange(f, raw)
  }

  function press(key: EntryKey) {
    setClearArmed(false)
    const f = regs.active
    const next = applyEntryKey(regs.values[f], key, regs.fresh, ENTRY[f])
    regs.press(key)
    notify(f, next)
  }

  function handleRaw(f: MenuCalcField, raw: string) {
    setClearArmed(false)
    regs.setRaw(f, raw)
    notify(f, sanitizeEntry(raw, ENTRY[f]))
  }

  /** "Limpiar" restaura los valores con que se abrió la vista: hay que tocarlo dos veces. */
  function handleClearAll() {
    if (!clearArmed) {
      setClearArmed(true)
      return
    }
    setClearArmed(false)
    regs.assign({ ...resetValues, grams: "" })
    for (const f of ["persons", "margin", "pctMP"] as const) onChange(f, resetValues[f])
  }

  useEffect(() => {
    if (!clearArmed) return
    const t = window.setTimeout(() => setClearArmed(false), 4000)
    return () => window.clearTimeout(t)
  }, [clearArmed])

  /** Lleva el foco (y la vista) al dato: el teclado físico y el lector de pantalla siguen al dato activo. */
  function focusField(f: MenuCalcField) {
    requestAnimationFrame(() => {
      const el = registerRefs.current[f]
      el?.focus({ preventScroll: true })
      el?.scrollIntoView({ block: "nearest" })
    })
  }

  /** Enter en un registro: pasa al siguiente. */
  function advance() {
    const i = ORDER.indexOf(regs.active)
    const next = ORDER[i + 1]
    if (!next) return
    regs.activate(next)
    focusField(next)
  }

  function pickMode(m: Mode) {
    setClearArmed(false)
    setAddError(null)
    setMode(m)
    setSelected("")
  }

  /** Botón "Agregar a la lista" (en la fila de los gramos): agrega lo seleccionado con sus gramos. */
  function handleAdd() {
    setClearArmed(false)
    const grams = parseEntry(regs.values.grams)
    if (!selected) {
      setAddError(mode === "recipes" ? "Selecciona una receta en el buscador" : "Selecciona un ingrediente en el buscador")
      return
    }
    if (!(grams && grams > 0)) {
      setAddError(
        mode === "recipes"
          ? "Escribe los gramos por porción con el teclado"
          : "Escribe las unidades por porción con el teclado",
      )
      regs.activate("grams")
      focusField("grams")
      return
    }
    setAddError(null)
    onAddItem({ componentType: mode === "recipes" ? "recipe" : "ingredient", id: selected, grams: regs.values.grams })
    setSelected("")
  }

  // Teclado físico: escribe en el dato activo sin hacer clic antes.
  const live = useRef({ active: regs.active, press })
  useEffect(() => {
    live.current = { active: regs.active, press }
  })
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return
      if (isTypingTarget(e.target)) return
      if (document.querySelector('[role="listbox"]')) return
      const dialog = document.querySelector('[aria-modal="true"]')
      if (dialog && !dialog.contains(wrapRef.current)) return
      const key = entryKeyFromKeyboard(e.key)
      if (!key) return
      e.preventDefault()
      registerRefs.current[live.current.active]?.focus({ preventScroll: true })
      live.current.press(key)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const parsedPers = parseEntry(regs.values.persons)
  const parsedPct = parseEntry(regs.values.pctMP)

  // Pantalla: total por porción en reposo; qué falta para poder calcular.
  let tone: "idle" | "error" = "idle"
  const value = costoPorcion != null ? fmtCOP(costoPorcion) : "$ 0"
  let sub: string =
    itemCount === 0
      ? "Agrega platos con el botón Agregar a la lista"
      : !(parsedPers && parsedPers > 0)
        ? "Define el número de personas"
        : !(parsedPct && parsedPct > 0)
          ? "Define el % de materia prima"
          : costoPorcion == null
            ? loading
              ? "Calculando el costo de tus platos…"
              : "Hay platos sin costo: revísalos en la lista"
            : `${itemCount} en la lista · ${parsedPers} personas`
  if (itemCount > 0 && (!(parsedPers && parsedPers > 0) || !(parsedPct && parsedPct > 0) || (costoPorcion == null && !loading))) {
    tone = "error"
  }
  if (addError) {
    tone = "error"
    sub = addError
  }
  if (clearArmed) sub = "Toca Limpiar otra vez para restaurar los valores"

  const isRecipes = mode === "recipes"
  const registerMeta: Record<
    MenuCalcField,
    { label: string; aria: string; display: string; placeholder: string; note?: React.ReactNode }
  > = {
    persons: {
      label: "N° DE PERSONAS",
      aria: "Número de personas",
      display: regs.values.persons,
      placeholder: "10",
    },
    margin: {
      label: "MARGEN DE SEGURIDAD",
      aria: "Margen de seguridad (%)",
      display: formatPercentEntry(regs.values.margin),
      placeholder: "5 %",
    },
    pctMP: {
      label: "% MATERIA PRIMA",
      aria: "Porcentaje de materia prima",
      display: formatPercentEntry(regs.values.pctMP),
      placeholder: "31 %",
      note: pctNote,
    },
    grams: {
      label: isRecipes ? "GRAMOS POR PORCIÓN" : "UNIDADES POR PORCIÓN",
      aria: isRecipes ? "Gramos por porción" : "Unidades por porción",
      display: regs.values.grams,
      placeholder: isRecipes ? "200" : "1",
    },
  }

  function renderRegister(f: MenuCalcField) {
    const meta = registerMeta[f]
    return (
      <CalcRegister
        key={f}
        ref={(el) => {
          registerRefs.current[f] = el
        }}
        id={`menu-${f}`}
        label={meta.label}
        ariaLabel={meta.aria}
        display={meta.display}
        placeholder={meta.placeholder}
        active={regs.active === f}
        fresh={regs.fresh}
        note={meta.note}
        onActivate={() => {
          setClearArmed(false)
          regs.activate(f)
        }}
        onKey={press}
        onRawInput={(raw) => handleRaw(f, raw)}
        onEnter={advance}
      />
    )
  }

  const modeBtn = (m: Mode, title: string) => {
    const on = mode === m
    return (
      <button
        type="button"
        onClick={() => pickMode(m)}
        aria-pressed={on}
        className="flex-1 min-w-0 flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-center transition-colors"
        style={{
          background: on ? "var(--accent-light)" : "var(--bg-surface)",
          border: `1px solid ${on ? "var(--accent)" : "var(--border-light)"}`,
          color: "var(--text-primary)",
        }}
      >
        <span className="text-sm font-semibold truncate">{title}</span>
      </button>
    )
  }

  return (
    <div ref={wrapRef} className="flex flex-col gap-3 min-w-0">
      <CalcDevice label="Calculadora del menú">
        <CalcDisplay
          label="TOTAL POR PORCIÓN"
          value={value}
          sub={sub}
          subId="menu-calc-msg"
          tone={tone}
        />

        {/* 2°) Personas, margen de seguridad y % de materia prima en una sola fila */}
        <div className="calc-registers" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {renderRegister("persons")}
          {renderRegister("margin")}
          {renderRegister("pctMP")}
        </div>

        {/* 3°) Qué agregar: recetas o ingredientes, buscado en el select y con sus gramos */}
        <div className="flex flex-col gap-2.5" aria-label="Producto a agregar a la lista">
          <div className="flex gap-2" role="group" aria-label="Tipo de producto">
            {modeBtn("recipes", "Recetas")}
            {modeBtn("ingredients", "Ingredientes")}
          </div>

          <SearchableSelect
            options={(isRecipes ? recipes : ingredients).map((x) => ({ value: x.id, label: x.name }))}
            value={selected}
            onChange={(v) => {
              setClearArmed(false)
              setAddError(null)
              setSelected(v)
            }}
            placeholder={isRecipes ? "Buscar receta…" : "Buscar ingrediente…"}
            searchPlaceholder={isRecipes ? "Buscar receta…" : "Buscar ingrediente…"}
            clearLabel={isRecipes ? "Seleccionar receta" : "Seleccionar ingrediente"}
            emptyMessage={isRecipes ? "No se encontraron recetas" : "No se encontraron ingredientes"}
            ariaLabel={isRecipes ? "Seleccionar receta para agregar" : "Seleccionar ingrediente para agregar"}
            variant="calculator"
          />

          {/* Gramos + agregar: misma fila (el botón saca el teclado el hueco de la coma) */}
          <div className="flex items-stretch gap-2">
            <div className="flex-1 min-w-0">{renderRegister("grams")}</div>
            <CalcActionKey slotClassName="calc-slot-inline" className="calc-key-inline" onClick={handleAdd}>
              Agregar a la lista
            </CalcActionKey>
          </div>
        </div>

        <div className="calc-keypad-slot">
          <CalcKeypad
            onKey={press}
            onClearAll={handleClearAll}
            decimalEnabled={false}
          />
        </div>

        {/* Calcular integrado al aparato, al pie del teclado (como en Punto de equilibrio) */}
        <CalcActionKey onClick={onCalculate}>Calcular</CalcActionKey>
      </CalcDevice>
    </div>
  )
}
