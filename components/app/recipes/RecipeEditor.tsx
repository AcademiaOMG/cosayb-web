"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { AlertCircle, Check, RotateCcw, Save, Trash2 } from "lucide-react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import InfoTip from "@/components/ui/InfoTip"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import IngredientFormModal from "@/components/app/inventario/IngredientFormModal"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { usePermissions } from "@/hooks/usePermissions"
import { toast } from "@/lib/toast"
import { friendlyError } from "@/lib/errorMessage"
import { formatCOP } from "@/lib/utils"
import {
  SECTION_AFFECTS_COST,
  buildItemsPayload,
  costImpact,
  linesChanged,
  linesProblem,
  priceEditLines,
  totalMassG,
  validateYield,
  type CostLookup,
  type EditLine,
  type EditSection,
  type LineKind,
} from "@/lib/recipes/recipeEdit"
import { baseUnitOf, fromBaseQuantity, quantityText, toBaseQuantity, unitLabel, unitOptionsFor, type InputUnit } from "@/lib/recipes/units"
import LineAdder, { type LinePreselect } from "./LineAdder"
import BaseRecipeQuickCreateModal from "./BaseRecipeQuickCreateModal"
import { TENANT_SOURCE, resolveQuickCreate, type RecipeFormDataSource } from "./recipeSource"
import type { Ingrediente as Ingredient, Recipe } from "@/types/domain"

interface Catalog {
  ingredients: Ingredient[]
  baseRecipes: Recipe[]
}

// ── Utilidades ───────────────────────────────────────────────────────────────

function linesFromRecipe(recipe: Recipe, catalog: Catalog): EditLine[] {
  return (recipe.items ?? []).map((item) => {
    const kind: LineKind = item.componentType
    const refId = (kind === "ingredient" ? item.ingredientId : item.subRecipeId) ?? ""
    const catIng = kind === "ingredient" ? catalog.ingredients.find((i) => i.id === refId) : undefined
    const baseUnit = kind === "recipe" ? "g" : (item.unit ?? item.ingredientUnit ?? baseUnitOf(catIng))
    const fallback = kind === "ingredient" ? catIng?.name : catalog.baseRecipes.find((r) => r.id === refId)?.name
    return {
      key: crypto.randomUUID(),
      kind,
      refId,
      name: (kind === "ingredient" ? item.ingredientName : item.subRecipeName) ?? fallback ?? "Elemento eliminado",
      quantity: parseFloat(item.quantityG) || 0,
      unit: baseUnit as InputUnit,
      baseUnit,
    }
  })
}

const round = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d
const cop = (n: number | null) => (n == null ? "—" : formatCOP(n))

// ── Tarjeta de sección ───────────────────────────────────────────────────────

function Section({
  id,
  title,
  help,
  dirty,
  saving,
  canSave = true,
  error,
  onSave,
  onReset,
  children,
}: {
  id: string
  title: string
  help?: string
  dirty: boolean
  saving: boolean
  canSave?: boolean
  error?: string | null
  onSave: () => void
  onReset: () => void
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 rounded-2xl border p-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border-light)" }}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 id={id} className="m-0 text-base font-bold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h3>
          {dirty ? (
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "#FEF3C7", color: "#78350F" }}>
              Sin guardar
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <Check size={12} aria-hidden="true" /> Guardado
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button type="button" variant="ghost" size="sm" onClick={onReset} disabled={saving}>
              <RotateCcw size={14} aria-hidden="true" /> Descartar
            </Button>
          )}
          <Button type="button" size="sm" onClick={onSave} loading={saving} disabled={!dirty || !canSave}>
            <Save size={14} aria-hidden="true" /> Guardar {help ?? "sección"}
          </Button>
        </div>
      </header>
      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-sm" style={{ color: "#B42020" }}>
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}
      {children}
    </section>
  )
}

// ── Fila de ingrediente editable ─────────────────────────────────────────────

function LineRow({
  priced,
  onChange,
  onRemove,
}: {
  priced: ReturnType<typeof priceEditLines>["lines"][number]
  onChange: (patch: Partial<EditLine>) => void
  onRemove: () => void
}) {
  const { line } = priced
  const [text, setText] = useState(String(line.quantity))
  const units = line.kind === "recipe" ? [{ value: "g" as InputUnit, label: "g" }] : unitOptionsFor(line.baseUnit)

  function changeUnit(next: InputUnit) {
    // Conserva la cantidad real: 500 g → 0,5 kg (no 500 kg)
    const base = toBaseQuantity(line.quantity, line.unit, line.baseUnit)
    const q = base == null ? line.quantity : round(fromBaseQuantity(base, next))
    setText(String(q))
    onChange({ unit: next, quantity: q })
  }

  return (
    <li className="list-none rounded-xl border p-3" style={{ borderColor: priced.error ? "#FCA5A5" : "var(--border-light)", background: "var(--bg-primary)" }}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_6.5rem_5.5rem_6rem_6.5rem_2rem] sm:items-center">
        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }} title={line.name}>
            {line.name}
            {line.kind === "recipe" && (
              <span className="ml-2 text-xs font-medium" style={{ color: "var(--accent-text)" }}>
                Preparación base
              </span>
            )}
          </p>
        </div>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={text}
          aria-label={`Cantidad de ${line.name}`}
          aria-invalid={!!priced.error}
          onChange={(e) => {
            setText(e.target.value)
            const n = parseFloat(e.target.value.replace(",", "."))
            onChange({ quantity: Number.isFinite(n) ? n : NaN })
          }}
          className="h-9 w-full rounded-lg border px-2 text-right text-sm tabular-nums outline-none focus:ring-2"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
        />
        <select
          value={line.unit}
          onChange={(e) => changeUnit(e.target.value as InputUnit)}
          disabled={units.length < 2}
          aria-label={`Unidad de ${line.name}`}
          className="h-9 w-full rounded-lg border px-2 text-sm"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
        >
          {units.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
        <p className="m-0 text-xs tabular-nums sm:text-right" style={{ color: "var(--text-muted)" }}>
          {priced.costPerBase != null ? `${formatCOP(priced.costPerBase)}/${unitLabel(line.baseUnit)}` : "sin costo"}
        </p>
        <p className="m-0 text-sm font-semibold tabular-nums sm:text-right" style={{ color: "var(--text-primary)" }}>
          {priced.cost != null ? formatCOP(priced.cost) : "—"}
        </p>
        <button
          type="button"
          aria-label={`Quitar ${line.name}`}
          onClick={onRemove}
          className="justify-self-end p-1.5 text-[var(--text-secondary)] transition hover:text-[#B42020]"
        >
          <Trash2 size={15} />
        </button>
      </div>
      {priced.error && (
        <p role="alert" className="mt-1.5 text-xs" style={{ color: "#B42020" }}>
          {priced.error}
        </p>
      )}
    </li>
  )
}

// ── Editor ───────────────────────────────────────────────────────────────────

function Editor({
  recipe,
  catalog,
  dataSource,
  refreshCatalog,
  onChanged,
  onClose,
  onDirtyChange,
}: {
  recipe: Recipe
  catalog: Catalog
  dataSource: RecipeFormDataSource
  refreshCatalog: () => Promise<Catalog | undefined>
  onChanged: (name: string) => void
  onClose: () => void
  onDirtyChange: (dirty: boolean) => void
}) {
  const confirm = useConfirm()
  const { can, platformCan } = usePermissions()
  // Crear desde los selectores: permisos y guardado según la fuente (negocio o banco de plataforma)
  const quick = resolveQuickCreate(dataSource.quickCreate, { can, platformCan })
  const canCreateIngredient = quick.ingredient
  const canCreateBase = quick.base

  // Estado guardado (baseline) y de trabajo por sección
  const [saved, setSaved] = useState(() => ({
    name: recipe.name,
    recipeNumber: recipe.recipeNumber,
    description: recipe.description ?? "",
    isBase: recipe.isBase,
    servings: String(Math.round(parseFloat(recipe.servings))),
    servingWeight: recipe.servingWeightG ? String(parseFloat(recipe.servingWeightG)) : "",
    margin: String(parseFloat(recipe.safetyMargin)),
    lines: linesFromRecipe(recipe, catalog),
  }))
  const [general, setGeneral] = useState({ name: saved.name, recipeNumber: saved.recipeNumber, description: saved.description, isBase: saved.isBase })
  const [yieldV, setYieldV] = useState({ servings: saved.servings, servingWeight: saved.servingWeight, margin: saved.margin })
  const [lines, setLines] = useState<EditLine[]>(saved.lines)
  const [busy, setBusy] = useState<EditSection | null>(null)
  const [errors, setErrors] = useState<Partial<Record<EditSection, string>>>({})
  const lock = useRef(false)

  // Costos: ingredientes desde el catálogo; preparaciones base desde el API (una vez cada una)
  const [subCosts, setSubCosts] = useState<Record<string, number | null>>({})
  const requested = useRef(new Set<string>())
  useEffect(() => {
    const load = dataSource.loadCostPerGram
    if (!load) return
    for (const l of [...saved.lines, ...lines]) {
      if (l.kind !== "recipe" || !l.refId || requested.current.has(l.refId)) continue
      requested.current.add(l.refId)
      load(l.refId)
        .then((c) => setSubCosts((p) => ({ ...p, [l.refId]: c != null && Number.isFinite(c) && c > 0 ? c : null })))
        .catch(() => setSubCosts((p) => ({ ...p, [l.refId]: null })))
    }
  }, [lines, saved.lines, dataSource.loadCostPerGram])

  const lookup = useCallback<CostLookup>(
    (kind, id) => {
      if (kind === "ingredient") {
        const ing = catalog.ingredients.find((i) => i.id === id)
        return ing ? parseFloat(ing.costPerGram) : null
      }
      return id in subCosts ? subCosts[id] : dataSource.loadCostPerGram ? undefined : null
    },
    [catalog.ingredients, subCosts, dataSource.loadCostPerGram],
  )

  const priced = useMemo(() => priceEditLines(lines, lookup), [lines, lookup])
  const pricedSaved = useMemo(() => priceEditLines(saved.lines, lookup), [saved.lines, lookup])

  /** Costo por porción con margen (estimado con los precios actuales del catálogo) */
  function perServing(p: ReturnType<typeof priceEditLines>, servingsText: string, marginText: string): number | null {
    const s = parseFloat(servingsText.replace(",", "."))
    const m = parseFloat(marginText.replace(",", ".") || "0")
    if (p.pending > 0 || p.unpriced > 0 || !Number.isFinite(s) || s <= 0 || !Number.isFinite(m)) return null
    return (p.total / s) * (1 + m / 100)
  }

  const generalDirty =
    general.name !== saved.name || general.recipeNumber !== saved.recipeNumber || general.description !== saved.description || general.isBase !== saved.isBase
  const yieldDirty = yieldV.servings !== saved.servings || yieldV.servingWeight !== saved.servingWeight || yieldV.margin !== saved.margin
  const linesDirty = linesChanged(saved.lines, lines)
  const anyDirty = generalDirty || yieldDirty || linesDirty
  useEffect(() => onDirtyChange(anyDirty), [anyDirty, onDirtyChange])

  // Creación desde el selector
  const [preselect, setPreselect] = useState<(LinePreselect & { target: "editor" | "base" }) | null>(null)
  const [ingModal, setIngModal] = useState<{ name: string; target: "editor" | "base" } | null>(null)
  const [baseModal, setBaseModal] = useState<{ name: string } | null>(null)

  async function run(section: EditSection, patch: Record<string, unknown>, successLabel: string) {
    if (lock.current) return
    lock.current = true
    setBusy(section)
    setErrors((e) => ({ ...e, [section]: undefined }))
    try {
      await (dataSource.updatePartial
        ? dataSource.updatePartial(recipe.id, patch)
        : Promise.reject(new Error("Esta fuente de datos no admite edición por secciones")))
      const fresh = await dataSource.loadRecipe(recipe.id)
      const nextLines = linesFromRecipe(fresh, catalog)
      const next = {
        name: fresh.name,
        recipeNumber: fresh.recipeNumber,
        description: fresh.description ?? "",
        isBase: fresh.isBase,
        servings: String(Math.round(parseFloat(fresh.servings))),
        servingWeight: fresh.servingWeightG ? String(parseFloat(fresh.servingWeightG)) : "",
        margin: String(parseFloat(fresh.safetyMargin)),
        lines: nextLines,
      }
      setSaved(next)
      // Solo se reinicia la sección guardada; lo que se edita en otras queda intacto
      if (section === "general") setGeneral({ name: next.name, recipeNumber: next.recipeNumber, description: next.description, isBase: next.isBase })
      if (section === "yield") setYieldV({ servings: next.servings, servingWeight: next.servingWeight, margin: next.margin })
      if (section === "ingredients") setLines(nextLines)
      toast.success(successLabel, { description: next.name })
      onChanged(next.name)
    } catch (e) {
      setErrors((p) => ({ ...p, [section]: friendlyError(e, "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo; tus cambios siguen aquí.") }))
    } finally {
      lock.current = false
      setBusy(null)
    }
  }

  async function confirmCost(before: number | null, after: number | null, what: string): Promise<boolean> {
    const impact = costImpact(before, after)
    if (!impact.changes) return true
    const description =
      impact.delta == null
        ? `${what} puede cambiar el costo por porción y los precios sugeridos de esta receta, y de los menús y recetas que la usan. No pudimos estimar el nuevo valor (hay ingredientes sin costo).`
        : `${what} cambia el costo por porción de ${cop(impact.before)} a ${cop(impact.after)} (${impact.delta >= 0 ? "+" : "−"}${Math.abs(impact.pct ?? 0).toFixed(1)} %). También se actualizan los menús y recetas que usan esta receta. Valores estimados con los precios actuales.`
    return confirm({ title: "Este cambio afecta los costos", itemName: general.name || saved.name, description, confirmLabel: "Guardar cambios", cancelLabel: "Revisar" })
  }

  async function saveGeneral() {
    if (!general.name.trim()) return setErrors((e) => ({ ...e, general: "Escribe el nombre de la receta" }))
    if (!general.recipeNumber.trim()) return setErrors((e) => ({ ...e, general: "Escribe el número de la receta" }))
    await run(
      "general",
      { name: general.name.trim(), recipeNumber: general.recipeNumber.trim(), description: general.description.trim() || null, isBase: general.isBase },
      "Datos de la receta guardados",
    )
  }

  async function saveYield() {
    const problems = validateYield(yieldV)
    const first = problems.servings ?? problems.servingWeight ?? problems.margin
    if (first) return setErrors((e) => ({ ...e, yield: first }))
    const before = perServing(pricedSaved, saved.servings, saved.margin)
    const after = perServing(pricedSaved, yieldV.servings, yieldV.margin)
    if (SECTION_AFFECTS_COST.yield && !(await confirmCost(before, after, "Cambiar las porciones o el margen"))) return
    await run(
      "yield",
      {
        servings: parseFloat(yieldV.servings.replace(",", ".")),
        servingWeightG: yieldV.servingWeight.trim() ? parseFloat(yieldV.servingWeight.replace(",", ".")) : null,
        safetyMargin: parseFloat(yieldV.margin.replace(",", ".") || "0"),
      },
      "Porciones y margen guardados",
    )
  }

  async function saveIngredients() {
    const problem = linesProblem(lines)
    if (problem) return setErrors((e) => ({ ...e, ingredients: problem }))
    const before = perServing(pricedSaved, saved.servings, saved.margin)
    const after = perServing(priced, saved.servings, saved.margin)
    if (SECTION_AFFECTS_COST.ingredients && !(await confirmCost(before, after, "Cambiar los ingredientes"))) return
    await run("ingredients", { items: buildItemsPayload(lines) }, "Ingredientes guardados")
  }

  const servingsN = parseFloat(yieldV.servings.replace(",", "."))
  const liveCost = perServing(priced, yieldV.servings, yieldV.margin)
  const yieldProblems = validateYield(yieldV)

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen siempre visible */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-live="polite">
        {[
          ["Costo por porción (con margen)", cop(liveCost)],
          ["Costo total (sin margen)", priced.pending || priced.unpriced ? "—" : cop(priced.total)],
          ["Porciones", Number.isFinite(servingsN) && servingsN > 0 ? String(servingsN) : "—"],
          ["Peso total", `${totalMassG(lines).toLocaleString("es-CO", { maximumFractionDigits: 1 })} g`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl px-3 py-2" style={{ background: "var(--bg-secondary)" }}>
            <p className="m-0 text-xs" style={{ color: "var(--text-muted)" }}>
              {k}
            </p>
            <p className="m-0 text-base font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {v}
            </p>
          </div>
        ))}
      </div>

      <Section id="sec-general" title="Datos de la receta" help="datos" dirty={generalDirty} saving={busy === "general"} error={errors.general} onSave={saveGeneral} onReset={() => setGeneral({ name: saved.name, recipeNumber: saved.recipeNumber, description: saved.description, isBase: saved.isBase })}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <Input label="Nombre" value={general.name} onChange={(e) => setGeneral((g) => ({ ...g, name: e.target.value }))} />
          <Input label="Número de receta" help="recipe.number" value={general.recipeNumber} onChange={(e) => setGeneral((g) => ({ ...g, recipeNumber: e.target.value }))} />
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Descripción
          <textarea
            value={general.description}
            onChange={(e) => setGeneral((g) => ({ ...g, description: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm font-normal outline-none focus:ring-2"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
          />
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
          <input type="checkbox" checked={general.isBase} onChange={(e) => setGeneral((g) => ({ ...g, isBase: e.target.checked }))} />
          Es una preparación base
          <InfoTip help="recipe.isBase" label="preparación base" />
        </label>
      </Section>

      <Section id="sec-yield" title="Porciones y margen" help="porciones" dirty={yieldDirty} saving={busy === "yield"} error={errors.yield} onSave={saveYield} onReset={() => setYieldV({ servings: saved.servings, servingWeight: saved.servingWeight, margin: saved.margin })}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input label="Porciones" help="recipe.servings" type="number" min="1" step="1" value={yieldV.servings} error={yieldProblems.servings} onChange={(e) => setYieldV((v) => ({ ...v, servings: e.target.value }))} />
          <Input label="Peso por porción (g)" help="recipe.servingWeight" type="number" min="0" step="any" placeholder="Automático" value={yieldV.servingWeight} error={yieldProblems.servingWeight} onChange={(e) => setYieldV((v) => ({ ...v, servingWeight: e.target.value }))} />
          <Input label="Margen de seguridad (%)" help="recipe.margin" type="number" min="0" max="5" step="any" value={yieldV.margin} error={yieldProblems.margin} onChange={(e) => setYieldV((v) => ({ ...v, margin: e.target.value }))} />
        </div>
      </Section>

      <Section id="sec-ingredients" title="Ingredientes" help="ingredientes" dirty={linesDirty} saving={busy === "ingredients"} error={errors.ingredients} onSave={saveIngredients} onReset={() => setLines(saved.lines.map((l) => ({ ...l, key: crypto.randomUUID() })))}>
        {lines.length === 0 ? (
          <p className="m-0 text-sm" style={{ color: "var(--text-muted)" }}>
            La receta no tiene ingredientes. Agrega al menos uno.
          </p>
        ) : (
          <ul className="m-0 flex flex-col gap-2 p-0">
            {priced.lines.map((p) => (
              <LineRow
                key={p.line.key}
                priced={p}
                onChange={(patch) => setLines((prev) => prev.map((l) => (l.key === p.line.key ? { ...l, ...patch } : l)))}
                onRemove={() => setLines((prev) => prev.filter((l) => l.key !== p.line.key))}
              />
            ))}
          </ul>
        )}
        <LineAdder
          ingredients={catalog.ingredients}
          baseRecipes={catalog.baseRecipes}
          excludeRecipeId={recipe.id}
          canCreateIngredient={canCreateIngredient}
          canCreateBase={canCreateBase}
          onCreateIngredient={(q) => setIngModal({ name: q, target: "editor" })}
          onCreateBase={(q) => setBaseModal({ name: q })}
          preselect={preselect?.target === "editor" ? preselect : null}
          onAdd={(l) => setLines((p) => [...p, l])}
        />
        {priced.lines.length > 0 && (
          <p className="m-0 text-right text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
            Total ingredientes: {priced.pending || priced.unpriced ? "—" : formatCOP(priced.total)}
            {priced.unpriced > 0 && <span className="ml-2 text-xs font-normal" style={{ color: "#B42020" }}>({priced.unpriced} sin costo)</span>}
          </p>
        )}
      </Section>

      <div className="flex justify-end">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      </div>

      {/* Crear ingrediente sin salir de la receta */}
      <IngredientFormModal
        open={!!ingModal}
        initialName={ingModal?.name ?? ""}
        existing={catalog.ingredients}
        createIngredient={dataSource.quickCreate?.createIngredient}
        onClose={() => setIngModal(null)}
        onSaved={async (savedIng) => {
          const target = ingModal?.target ?? "editor"
          await refreshCatalog()
          if (savedIng) setPreselect({ kind: "ingredient", id: savedIng.id, nonce: Date.now(), target })
        }}
      />
      {/* Crear preparación base sin salir de la receta */}
      <BaseRecipeQuickCreateModal
        open={!!baseModal}
        initialName={baseModal?.name ?? ""}
        ingredients={catalog.ingredients}
        existing={catalog.baseRecipes}
        createRecipe={dataSource.quickCreate?.createBaseRecipe}
        canCreateIngredient={canCreateIngredient}
        onCreateIngredient={(q) => setIngModal({ name: q, target: "base" })}
        preselect={preselect?.target === "base" ? preselect : null}
        onClose={() => setBaseModal(null)}
        onCreated={async (r) => {
          await refreshCatalog()
          setPreselect({ kind: "recipe", id: r.id, nonce: Date.now(), target: "editor" })
          setBaseModal(null)
        }}
      />
    </div>
  )
}

// ── Vista (ventana) ──────────────────────────────────────────────────────────

/**
 * Edición ágil de una receta existente: secciones compactas con guardado independiente, sin recorrer el
 * asistente de pasos (que se mantiene para crear). Cada guardado que puede cambiar costos pide confirmar
 * con el antes/después.
 */
export default function RecipeEditorView({
  recipeId,
  dataSource = TENANT_SOURCE,
  onClose,
  onChanged,
}: {
  recipeId: string
  dataSource?: RecipeFormDataSource
  onClose: () => void
  /** Una sección se guardó: refrescar la lista sin cerrar el editor */
  onChanged: (name: string) => void
}) {
  const confirm = useConfirm()
  const [dirty, setDirty] = useState(false)
  const catalog = useSWR(["recipes-catalog", dataSource.sourceKey], () => dataSource.loadCatalog(), { revalidateOnFocus: false })
  const recipe = useSWR(["recipe-editor", dataSource.sourceKey, recipeId], () => dataSource.loadRecipe(recipeId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 0,
  })

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const requestClose = useCallback(async () => {
    if (dirty) {
      const ok = await confirm({
        title: "Descartar cambios",
        description: "Tienes cambios sin guardar en alguna sección. Si cierras, se perderán.",
        confirmLabel: "Descartar",
        cancelLabel: "Seguir editando",
        variant: "danger",
      })
      if (!ok) return
    }
    onClose()
  }, [dirty, confirm, onClose])

  const failed = (!catalog.data && catalog.error) || (!recipe.data && recipe.error)
  const ready = !!catalog.data && !!recipe.data

  return (
    <Modal open onClose={() => void requestClose()} title={recipe.data ? `Editar receta · ${recipe.data.name}` : "Editar receta"} wide>
      {failed ? (
        <div role="alert" className="flex items-center gap-2 rounded-xl p-4 text-sm" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B42020" }}>
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">No se pudo cargar la receta. Revisa tu conexión e inténtalo de nuevo.</span>
          <Button variant="ghost" size="sm" onClick={() => { void catalog.mutate(); void recipe.mutate() }}>
            Reintentar
          </Button>
        </div>
      ) : !ready ? (
        <div role="status" aria-label="Cargando" className="flex justify-center py-14">
          <LoadingSpinner size={32} />
        </div>
      ) : (
        <Editor
          recipe={recipe.data!}
          catalog={catalog.data!}
          dataSource={dataSource}
          refreshCatalog={() => catalog.mutate()}
          onChanged={onChanged}
          onClose={() => void requestClose()}
          onDirtyChange={setDirty}
        />
      )}
    </Modal>
  )
}

// Reexport para pruebas / otros módulos
export { quantityText }
