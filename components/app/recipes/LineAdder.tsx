"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import SearchableSelect from "@/components/ui/SearchableSelect"
import Button from "@/components/ui/Button"
import InfoTip from "@/components/ui/InfoTip"
import { lineError, type EditLine, type LineKind } from "@/lib/recipes/recipeEdit"
import { baseUnitOf, unitLabel, unitOptionsFor, type InputUnit } from "@/lib/recipes/units"
import type { Ingrediente as Ingredient, Recipe } from "@/types/domain"

export const CREATE_INGREDIENT_LABEL = "¿No encuentras el ingrediente? Agregar ingrediente"
export const CREATE_BASE_LABEL = "¿No encuentras la preparación? Agregar preparación base"

export interface LinePreselect {
  kind: LineKind
  id: string
  /** Cambia en cada selección para que repetir el mismo id vuelva a aplicarse */
  nonce: number
}

interface Props {
  ingredients: Ingredient[]
  baseRecipes: Recipe[]
  /** Preparaciones base permitidas (false = solo ingredientes, p. ej. dentro de una preparación base nueva) */
  allowBase?: boolean
  /** Receta que se edita: no puede contenerse a sí misma */
  excludeRecipeId?: string
  /** Permiso para crear desde el selector; sin permiso la opción ni aparece */
  canCreateIngredient: boolean
  canCreateBase: boolean
  onCreateIngredient: (query: string) => void
  onCreateBase: (query: string) => void
  /** Elemento recién creado: queda seleccionado de inmediato */
  preselect?: LinePreselect | null
  onAdd: (line: EditLine) => void
}

/**
 * Fila para agregar un ingrediente o una preparación base a una receta: buscador + cantidad + unidad.
 * La unidad ofrecida depende del ingrediente (huevos: solo «und»; harina: g o kg). Al final del
 * desplegable, si el usuario puede crear, aparece «¿No encuentras…? Agregar…».
 */
export default function LineAdder({
  ingredients,
  baseRecipes,
  allowBase = true,
  excludeRecipeId,
  canCreateIngredient,
  canCreateBase,
  onCreateIngredient,
  onCreateBase,
  preselect,
  onAdd,
}: Props) {
  const [kind, setKind] = useState<LineKind>("ingredient")
  const [pickId, setPickId] = useState("")
  const [qty, setQty] = useState("")
  const [unit, setUnit] = useState<InputUnit>("g")
  const [error, setError] = useState<string | null>(null)

  const ingredient = kind === "ingredient" ? ingredients.find((i) => i.id === pickId) : undefined
  const base = baseUnitOf(ingredient)
  const units = kind === "ingredient" ? unitOptionsFor(base) : [{ value: "g" as InputUnit, label: "g" }]

  // Elemento recién creado: se selecciona solo (se ajusta durante el render al cambiar el nonce)
  const [appliedNonce, setAppliedNonce] = useState<number | null>(null)
  if (preselect && preselect.nonce !== appliedNonce) {
    setAppliedNonce(preselect.nonce)
    setKind(preselect.kind)
    setPickId(preselect.id)
    setError(null)
    const ing = preselect.kind === "ingredient" ? ingredients.find((i) => i.id === preselect.id) : undefined
    setUnit(baseUnitOf(ing))
  }

  const options = useMemo(
    () =>
      kind === "ingredient"
        ? ingredients.map((i) => ({ value: i.id, label: `${i.name} · ${unitLabel(baseUnitOf(i))}` }))
        : baseRecipes.filter((r) => r.id !== excludeRecipeId).map((r) => ({ value: r.id, label: `${r.name} (N.° ${r.recipeNumber})` })),
    [kind, ingredients, baseRecipes, excludeRecipeId],
  )

  function pick(id: string) {
    setPickId(id)
    setError(null)
    const ing = kind === "ingredient" ? ingredients.find((i) => i.id === id) : undefined
    setUnit(baseUnitOf(ing))
  }

  function add() {
    const name = kind === "ingredient" ? ingredient?.name : baseRecipes.find((r) => r.id === pickId)?.name
    if (!pickId || !name) {
      setError(kind === "ingredient" ? "Elige un ingrediente de la lista" : "Elige una preparación base de la lista")
      return
    }
    const quantity = parseFloat(qty.replace(",", "."))
    const line: EditLine = {
      key: crypto.randomUUID(),
      kind,
      refId: pickId,
      name,
      quantity,
      unit: kind === "recipe" ? "g" : unit,
      baseUnit: kind === "recipe" ? "g" : base,
    }
    const problem = lineError(line)
    if (problem) {
      setError(problem)
      return
    }
    onAdd(line)
    setPickId("")
    setQty("")
    setError(null)
  }

  const canCreate = kind === "ingredient" ? canCreateIngredient : canCreateBase

  return (
    <div className="flex flex-col gap-2 rounded-xl p-3" style={{ background: "var(--bg-secondary)" }}>
      {allowBase && (
        <div role="group" aria-label="Qué vas a agregar" className="flex gap-2">
          {(["ingredient", "recipe"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => {
                setKind(k)
                setPickId("")
                setError(null)
                setUnit("g")
              }}
              className="rounded-full border px-3 py-1 text-xs font-semibold transition"
              style={{
                borderColor: kind === k ? "var(--accent)" : "var(--border-light)",
                background: kind === k ? "var(--accent-light)" : "var(--bg-surface)",
                color: kind === k ? "var(--accent-text)" : "var(--text-secondary)",
              }}
            >
              {k === "ingredient" ? "Ingrediente" : "Preparación base"}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_auto] sm:items-start">
        <SearchableSelect
          options={options}
          value={pickId}
          onChange={pick}
          placeholder={kind === "ingredient" ? "Buscar ingrediente…" : "Buscar preparación base…"}
          emptyMessage={kind === "ingredient" ? "No hay ingredientes con ese nombre" : "No hay preparaciones base con ese nombre"}
          ariaLabel={kind === "ingredient" ? "Ingrediente" : "Preparación base"}
          invalid={!!error && !pickId}
          onCreate={canCreate ? (q) => (kind === "ingredient" ? onCreateIngredient(q) : onCreateBase(q)) : undefined}
          createLabel={kind === "ingredient" ? CREATE_INGREDIENT_LABEL : CREATE_BASE_LABEL}
        />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Cantidad <InfoTip help="recipe.quantity" label="la cantidad" />
          </div>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={qty}
            onChange={(e) => {
              setQty(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                add()
              }
            }}
            aria-label="Cantidad"
            placeholder="0"
            className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Unidad <InfoTip help="recipe.unit" label="la unidad" />
          </div>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as InputUnit)}
            disabled={units.length < 2}
            aria-label="Unidad"
            className="h-10 w-full rounded-lg border px-2 text-sm"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
          >
            {units.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="primary" onClick={add} className="sm:mt-5">
          <Plus size={16} aria-hidden="true" /> Agregar
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs" style={{ color: "#B42020" }}>
          {error}
        </p>
      )}
    </div>
  )
}
