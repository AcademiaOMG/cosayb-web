"use client"

import { useRef, useState } from "react"
import { Trash2 } from "lucide-react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { createRecipe as createTenantRecipe } from "@/lib/api"
import { toast } from "@/lib/toast"
import { friendlyError } from "@/lib/errorMessage"
import { findDuplicateIngredient } from "@/lib/recipes/ingredientForm"
import { buildItemsPayload, linesProblem, type EditLine } from "@/lib/recipes/recipeEdit"
import { quantityText } from "@/lib/recipes/units"
import LineAdder, { type LinePreselect } from "./LineAdder"
import type { Ingrediente as Ingredient, Recipe } from "@/types/domain"
import type { RecipePayload } from "./recipeSource"

interface Props {
  open: boolean
  initialName?: string
  ingredients: Ingredient[]
  /** Preparaciones base existentes (para no duplicar nombres) */
  existing: Recipe[]
  canCreateIngredient: boolean
  onCreateIngredient: (query: string) => void
  onClose: () => void
  onCreated: (recipe: Recipe) => void
  /** Ingrediente recién creado desde este formulario: queda seleccionado */
  preselect?: LinePreselect | null
  /** Cómo se guarda la preparación. Ausente = recetas del negocio; el banco inyecta el suyo */
  createRecipe?: (payload: RecipePayload) => Promise<{ data: Recipe }>
}

/**
 * Formulario compacto para crear una preparación base sin salir de la receta en curso (salsa, masa, fondo…).
 * Se guarda en el banco de recetas del negocio y queda lista para seleccionar. Cuenta como una receta propia
 * dentro del límite del plan.
 */
export default function BaseRecipeQuickCreateModal(props: Props) {
  // Se monta solo mientras está abierto: cada apertura arranca limpia.
  return props.open ? <Form {...props} /> : null
}

function Form({ initialName = "", ingredients, existing, canCreateIngredient, onCreateIngredient, onClose, onCreated, preselect, createRecipe = createTenantRecipe }: Props) {
  const [name, setName] = useState(initialName)
  const [servings, setServings] = useState("1")
  const [lines, setLines] = useState<EditLine[]>([])
  const [errors, setErrors] = useState<{ name?: string; servings?: string; lines?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const lock = useRef(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (lock.current) return
    const next: typeof errors = {}
    if (!name.trim()) next.name = "Escribe el nombre de la preparación"
    else if (findDuplicateIngredient(name, existing)) next.name = `Ya existe «${findDuplicateIngredient(name, existing)!.name}». Selecciónala en lugar de crearla de nuevo.`
    const s = parseFloat(servings.replace(",", "."))
    if (!Number.isFinite(s) || s <= 0 || !Number.isInteger(s)) next.servings = "Escribe un número entero de porciones"
    const lp = linesProblem(lines)
    if (lp) next.lines = lp
    setErrors(next)
    if (Object.keys(next).length > 0) return

    lock.current = true
    setSaving(true)
    setServerError(null)
    try {
      const res = await createRecipe({
        name: name.trim(),
        recipeNumber: `R-${Date.now().toString(36).toUpperCase().slice(-5)}`,
        servings: s,
        safetyMargin: 3,
        isBase: true,
        description: null,
        items: buildItemsPayload(lines),
      })
      toast.success("Preparación base creada", { description: name.trim() })
      onCreated(res.data)
    } catch (err) {
      setServerError(friendlyError(err, "No se pudo crear la preparación base"))
      lock.current = false
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={() => !saving && onClose()}
      title="Nueva preparación base"
      blur
      wide
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="base-recipe-quick-form" loading={saving}>
            {saving ? "Guardando…" : "Crear preparación base"}
          </Button>
        </>
      }
    >
      <form id="base-recipe-quick-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Una salsa, masa o fondo que luego usas como ingrediente. Se guarda en tus recetas y queda seleccionada.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
          <Input label="Nombre" placeholder="Ej. Salsa bechamel" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Input
            label="Porciones que rinde"
            help="recipe.servings"
            type="number"
            min="1"
            step="1"
            value={servings}
            error={errors.servings}
            onChange={(e) => setServings(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Ingredientes
          </span>
          <LineAdder
            ingredients={ingredients}
            baseRecipes={[]}
            allowBase={false}
            canCreateIngredient={canCreateIngredient}
            canCreateBase={false}
            preselect={preselect}
            onCreateIngredient={onCreateIngredient}
            onCreateBase={() => {}}
            onAdd={(l) => {
              setLines((p) => [...p, l])
              setErrors((p) => ({ ...p, lines: undefined }))
            }}
          />
          {lines.length > 0 && (
            <ul className="m-0 flex flex-col gap-1 p-0">
              {lines.map((l) => (
                <li key={l.key} className="flex list-none items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm" style={{ background: "var(--bg-secondary)" }}>
                  <span className="min-w-0 truncate">{l.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums">{quantityText(l.quantity, l.unit)}</span>
                    <button
                      type="button"
                      aria-label={`Quitar ${l.name}`}
                      onClick={() => setLines((p) => p.filter((x) => x.key !== l.key))}
                      className="p-1 text-[var(--text-secondary)] hover:text-[#B42020]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {errors.lines && (
            <p role="alert" className="text-xs" style={{ color: "#B42020" }}>
              {errors.lines}
            </p>
          )}
        </div>
        {serverError && (
          <p role="alert" className="text-sm" style={{ color: "#B42020" }}>
            {serverError}
          </p>
        )}
      </form>
    </Modal>
  )
}
