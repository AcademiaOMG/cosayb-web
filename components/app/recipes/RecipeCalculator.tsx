"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import Button from "@/components/ui/Button"
import SearchableSelect from "@/components/ui/SearchableSelect"
import {
  CalcBreakdown,
  CalcDevice,
  CalcDisplay,
  CalcKeypad,
  CalcRegister,
  useSolverCalculator,
} from "@/components/calculator"
import {
  entryKeyFromKeyboard,
  formatPercentEntry,
  parseEntry,
  type EntryKey,
  type EntryOptions,
} from "@/lib/calculator/entry"
import { formatCOP, formatCOPDecimals, formatNumber, formatPercent } from "@/lib/calculator/format"
import {
  defaultServingWeight,
  moveLine,
  priceTape,
  solveRecipeTape,
  type CostLookup,
  type RecipeTapeField,
  type RecipeTapeInputs,
  type RecipeTapeOutcome,
  type TapeKind,
  type TapeLine,
} from "@/lib/calculator/recipeTape"
import type { RecipeItemPayload } from "@/lib/api"
import type { Ingrediente as Ingredient, Recipe } from "@/types/domain"
import { getStored, saveStored } from "@/app/(app)/valoracion/lib"
import type { RecipeFormDataSource, RecipePayload } from "./recipeSource"
import "./recipe-tape.css"

type Step = 1 | 2 | 3 | 4 | 5

/** Mismas claves que Valoración: el % de materia prima y el margen "habituales" se comparten. */
const PCT_MP_KEY = "cosayb_pct_mp"
const MARGIN_KEY = "cosayb_margin"

const ENTRY: Record<RecipeTapeField, EntryOptions> = {
  grams: { decimals: true, maxDigits: 7, maxDecimals: 2 },
  servings: { decimals: false, maxDigits: 4 },
  pctMP: { decimals: true, maxDigits: 5, maxDecimals: 2 },
  margin: { decimals: true, maxDigits: 4, maxDecimals: 2 },
}

const FIELD_IDS: Record<RecipeTapeField, string> = {
  grams: "recipe-calc-grams",
  servings: "recipe-calc-servings",
  pctMP: "recipe-calc-pctmp",
  margin: "recipe-calc-margin",
}

/** "1.230 g", conservando la coma mientras se escribe el decimal */
function formatGramsEntry(raw: string) {
  if (raw === "" || parseEntry(raw) == null) return ""
  const [int = "0", dec] = raw.split(".")
  const intText = Number(int).toLocaleString("es-CO", { maximumFractionDigits: 0 })
  return `${intText}${raw.includes(".") ? `,${dec ?? ""}` : ""} g`
}

const formatServingsEntry = (raw: string) => (raw === "" ? "" : Number(raw).toLocaleString("es-CO", { maximumFractionDigits: 0 }))

const grams = (n: number) => `${formatNumber(n, 1)} g`

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
}

const toRaw = (value: string | number | null | undefined, fallback: string) => {
  const n = typeof value === "number" ? value : parseFloat(value ?? "")
  return Number.isFinite(n) && n > 0 ? String(Number(n.toFixed(2))) : fallback
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Foto de lo que el usuario puede haber escrito: sirve para saber si hay algo sin guardar. */
function makeSnapshot(p: {
  name: string
  isBase: boolean
  description: string
  servingWeight: string
  lines: TapeLine[]
  servings: string
  margin: string
}) {
  return JSON.stringify([
    p.name.trim(),
    p.isBase,
    p.description.trim(),
    p.servingWeight.trim(),
    p.lines.map((l) => [l.kind, l.refId, l.grams]),
    p.servings,
    p.margin,
  ])
}

export interface RecipeCatalog {
  ingredients: Ingredient[]
  baseRecipes: Recipe[]
}

export interface RecipeSavedInfo {
  name: string
  created: boolean
}

/**
 * Crear o editar una receta (hoja FORMATORECETA): el proceso ES la calculadora.
 * Asistente de 5 pasos: Nombre → Ingredientes (una cinta, como la de una
 * sumadora) → Porciones y margen → % de materia prima → Resultado y guardar.
 * Solo con un resultado calculado (y con nombre) se puede guardar.
 */
export default function RecipeCalculator({
  catalog,
  editRecipe,
  dataSource,
  onSaved,
  onDirtyChange,
}: {
  catalog: RecipeCatalog
  editRecipe?: Recipe | null
  dataSource: RecipeFormDataSource
  /** Se llama una vez guardada; quien la contiene decide a dónde volver */
  onSaved: (info: RecipeSavedInfo) => void
  /** Avisa si hay datos escritos sin guardar (para confirmar antes de salir) */
  onDirtyChange?: (dirty: boolean) => void
}) {
  const isEditing = !!editRecipe

  // ── Estado inicial (se arma una sola vez: el componente se monta ya con los datos) ──
  const [boot] = useState(() => {
    const lines: TapeLine[] = (editRecipe?.items ?? []).map((item) => {
      const kind: TapeKind = item.componentType
      const refId = (kind === "ingredient" ? item.ingredientId : item.subRecipeId) ?? ""
      const fallbackName =
        kind === "ingredient"
          ? catalog.ingredients.find((i) => i.id === refId)?.name
          : catalog.baseRecipes.find((r) => r.id === refId)?.name
      return {
        key: crypto.randomUUID(),
        kind,
        refId,
        name: (kind === "ingredient" ? item.ingredientName : item.subRecipeName) ?? fallbackName ?? "Elemento eliminado",
        grams: parseFloat(item.quantityG) || 0,
      }
    })
    const servingsNum = editRecipe ? Math.round(parseFloat(editRecipe.servings)) : NaN
    const totalG = lines.reduce((s, l) => s + l.grams, 0)
    const savedWeight = editRecipe?.servingWeightG ? parseFloat(editRecipe.servingWeightG) : NaN
    const autoWeight = defaultServingWeight(totalG, servingsNum)
    // Un peso que ya coincide con el calculado se vuelve a calcular solo.
    const customWeight = Number.isFinite(savedWeight) && (autoWeight == null || Math.abs(savedWeight - autoWeight) > 0.05)

    // El último % y margen que usó la persona (compartidos con Valoración)
    const storedPct = parseFloat(getStored(PCT_MP_KEY, ""))
    const pctFromStore = Number.isFinite(storedPct) && storedPct > 0 && storedPct < 100
    const storedMargin = parseFloat(getStored(MARGIN_KEY, ""))
    const marginFromStore = Number.isFinite(storedMargin) && storedMargin >= 0 && storedMargin <= 5

    const values = {
      grams: "",
      servings: Number.isFinite(servingsNum) && servingsNum > 0 ? String(servingsNum) : "",
      pctMP: pctFromStore ? String(storedPct) : "35",
      margin: editRecipe
        ? String(Number.isFinite(parseFloat(editRecipe.safetyMargin)) ? parseFloat(editRecipe.safetyMargin) : 3)
        : marginFromStore
          ? String(storedMargin)
          : "3",
    } satisfies Record<RecipeTapeField, string>
    const servingWeight = customWeight ? toRaw(savedWeight, "") : ""
    return {
      lines,
      values,
      servingWeight,
      pctFromStore,
      initialSnapshot: makeSnapshot({
        name: editRecipe?.name ?? "",
        isBase: editRecipe?.isBase ?? false,
        description: editRecipe?.description ?? "",
        servingWeight,
        lines,
        servings: values.servings,
        margin: values.margin,
      }),
    }
  })

  const [lines, setLines] = useState<TapeLine[]>(boot.lines)
  const [name, setName] = useState(editRecipe?.name ?? "")
  const [isBase, setIsBase] = useState(editRecipe?.isBase ?? false)
  const [description, setDescription] = useState(editRecipe?.description ?? "")
  const [servingWeight, setServingWeight] = useState(boot.servingWeight)
  const [nameError, setNameError] = useState<string | null>(null)

  // Asistente: una pregunta por pantalla. Al editar, todos los pasos de datos ya están al alcance.
  const [step, setStep] = useState<Step>(1)
  const [maxStep, setMaxStep] = useState<Step>(isEditing ? 4 : 1)

  const [pickKind, setPickKind] = useState<TapeKind>("ingredient")
  const [pickId, setPickId] = useState("")
  /** Mensaje del paso actual (qué falta o qué corregir): siempre explica por qué no avanza */
  const [stepError, setStepError] = useState<string | null>(null)
  /** Confirmación de la última línea agregada: el rollo queda bajo el teclado y puede no verse */
  const [lastAdded, setLastAdded] = useState<string | null>(null)
  /** Aviso de "algo a medias" ya mostrado (segundo clic = continuar de todos modos) */
  const halfAck = useRef("")

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const savingRef = useRef(false)

  // ── Catálogo y costos ─────────────────────────────────────────────────────
  const ingredientCost = useMemo(() => {
    const m = new Map<string, number>()
    for (const i of catalog.ingredients) {
      const c = parseFloat(i.costPerGram)
      if (Number.isFinite(c)) m.set(i.id, c)
    }
    return m
  }, [catalog.ingredients])

  const baseOptions = useMemo(
    () => catalog.baseRecipes.filter((r) => r.id !== editRecipe?.id),
    [catalog.baseRecipes, editRecipe?.id],
  )

  /** Costo por gramo de cada receta base (la API lo calcula; null = no disponible) */
  const [subCosts, setSubCosts] = useState<Record<string, number | null>>({})
  const requested = useRef(new Set<string>())
  const canCostBase = !!dataSource.loadCostPerGram

  const loadCostPerGram = dataSource.loadCostPerGram
  const baseIdsKey = lines
    .filter((l) => l.kind === "recipe")
    .map((l) => l.refId)
    .join(",")
  const pickedBaseId = pickKind === "recipe" ? pickId : ""
  useEffect(() => {
    if (!loadCostPerGram) return
    const ids = [...baseIdsKey.split(",").filter(Boolean), ...(pickedBaseId ? [pickedBaseId] : [])]
    for (const id of ids) {
      if (requested.current.has(id)) continue
      requested.current.add(id)
      loadCostPerGram(id)
        .then((c) => setSubCosts((p) => ({ ...p, [id]: c != null && Number.isFinite(c) && c > 0 ? c : null })))
        .catch(() => setSubCosts((p) => ({ ...p, [id]: null })))
    }
  }, [baseIdsKey, pickedBaseId, loadCostPerGram])

  const lookup = useCallback<CostLookup>(
    (kind, id) => {
      if (kind === "ingredient") return ingredientCost.get(id) ?? null
      if (!canCostBase) return null
      return subCosts[id]
    },
    [ingredientCost, subCosts, canCostBase],
  )

  const tape = useMemo(() => priceTape(lines, lookup), [lines, lookup])

  // ── Calculadora ───────────────────────────────────────────────────────────
  const solve = useCallback(
    (v: Record<RecipeTapeField, number | null>) => solveRecipeTape(v as RecipeTapeInputs, tape),
    [tape],
  )
  const calc = useSolverCalculator<RecipeTapeField, RecipeTapeOutcome>({
    entry: ENTRY,
    initial: boot.values,
    first: "grams",
    solve,
  })

  // El resultado solo vale mientras la cinta no haya cambiado.
  const result = calc.outcome?.ok && calc.outcome.signature === tape.signature ? calc.outcome : null
  const error = calc.outcome && !calc.outcome.ok ? calc.outcome : null

  /** Toda tecla pasa por aquí: escribir corrige el aviso del paso */
  const press = useCallback(
    (key: EntryKey) => {
      setStepError(null)
      setLastAdded(null)
      calc.press(key)
    },
    [calc],
  )

  const pickOptions = useMemo(
    () =>
      pickKind === "ingredient"
        ? catalog.ingredients.map((i) => ({
            value: i.id,
            label: `${i.name} (${formatCOPDecimals(parseFloat(i.costPerGram) || 0)} /g)`,
          }))
        : baseOptions.map((r) => ({ value: r.id, label: `${r.name} (N.° ${r.recipeNumber})` })),
    [pickKind, catalog.ingredients, baseOptions],
  )
  const pickedName =
    pickKind === "ingredient"
      ? catalog.ingredients.find((i) => i.id === pickId)?.name
      : baseOptions.find((r) => r.id === pickId)?.name
  const pickedCost = pickId ? lookup(pickKind, pickId) : null
  const pickedCostText =
    !pickId || pickedCost === undefined
      ? pickId
        ? "calculando costo…"
        : ""
      : pickedCost == null
        ? "sin costo conocido"
        : `${formatCOPDecimals(pickedCost)}/g`

  function changeKind(next: TapeKind) {
    if (next === pickKind) return
    setPickKind(next)
    setPickId("")
    setStepError(null)
  }

  function choose(id: string) {
    setPickId(id)
    setStepError(null)
    setLastAdded(null)
    calc.activate("grams")
  }

  function addLine() {
    const g = calc.inputs.grams
    if (!pickId || !pickedName) {
      setStepError(pickKind === "ingredient" ? "Primero elige un ingrediente de la lista" : "Primero elige una receta base de la lista")
      return
    }
    if (g == null || g <= 0) {
      setStepError("Escribe los gramos con el teclado de abajo")
      calc.activate("grams")
      return
    }
    setStepError(null)
    const repeated = lines.some((l) => l.kind === pickKind && l.refId === pickId)
    setLastAdded(
      repeated
        ? `Ya tenías ${pickedName}: se agregó otra línea de ${grams(g)}`
        : `Agregaste ${pickedName}: ${grams(g)}`,
    )
    setLines((prev) => [...prev, { key: crypto.randomUUID(), kind: pickKind, refId: pickId, name: pickedName, grams: g }])
    calc.fill({ grams: "" })
    calc.activate("grams")
    setPickId("")
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key))
    setLastAdded(null)
    setStepError(null)
  }

  // Teclado físico: escribe en el dato activo sin hacer clic antes (como CalcPanel)
  const wrapRef = useRef<HTMLDivElement>(null)
  const registerRefs = useRef<Partial<Record<RecipeTapeField, HTMLInputElement | null>>>({})
  const live = useRef({ active: calc.active, press, keys: false, enter: () => {} })
  /** Enter: agrega la línea (paso 2) o avanza al siguiente paso. */
  function enter(field: RecipeTapeField) {
    if (step === 2) {
      if (field === "grams" && (pickId || (calc.inputs.grams ?? 0) > 0)) addLine()
      else nextFrom2()
    } else if (step === 3) nextFrom3()
    else if (step === 4) finish()
  }

  useEffect(() => {
    live.current = { active: calc.active, press, keys: step >= 2 && step <= 4, enter: () => enter(calc.active) }
  })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return
      if (isTypingTarget(e.target)) return
      if (document.querySelector('[role="listbox"]')) return
      const dialog = document.querySelector('[aria-modal="true"]')
      if (dialog && !dialog.contains(wrapRef.current)) return
      const c = live.current
      if (!c.keys) return
      if (e.key === "Enter" && !(e.target as HTMLElement | null)?.closest?.("a,button,summary,[role]")) {
        e.preventDefault()
        c.enter()
        return
      }
      const key = entryKeyFromKeyboard(e.key)
      if (!key) return
      e.preventDefault()
      registerRefs.current[c.active]?.focus({ preventScroll: true })
      c.press(key)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // El rollo baja solo al agregar una línea
  const linesRef = useRef<HTMLOListElement>(null)
  useEffect(() => {
    const el = linesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines.length])

  // Al cambiar de paso: arriba del asistente y con el foco en la pregunta (teclado y lectores de pantalla;
  // en el celular el botón "Siguiente" queda al fondo y el paso nuevo se vería a media altura).
  const prevStep = useRef<Step>(step)
  useEffect(() => {
    if (prevStep.current === step) return
    prevStep.current = step
    wrapRef.current?.scrollIntoView({ block: "start" })
    document.getElementById(`rw-q${step}`)?.focus({ preventScroll: true })
  }, [step])

  function goStep(n: Step, message?: string) {
    setStep(n)
    setMaxStep((m) => (n > m ? n : m))
    setStepError(message ?? null)
    setLastAdded(null)
    setSaveError(null)
    if (n === 2) calc.activate("grams")
    if (n === 3) calc.activate("servings")
    if (n === 4) calc.activate("pctMP")
  }

  // ── Datos derivados de los pasos ──────────────────────────────────────────
  const unpricedNames = tape.lines.filter((p) => !p.pending && p.cost == null).map((p) => p.line.name)
  const goneLines = lines.filter((l) => !l.refId)
  const pendingCount = tape.pending
  const summary = `${plural(lines.length, "ingrediente", "ingredientes")} · ${grams(tape.totalGrams)}`

  const servingsNum = calc.inputs.servings
  const marginNum = calc.inputs.margin ?? 0
  const pctNum = calc.inputs.pctMP
  const hasServings = servingsNum != null && servingsNum > 0
  const marginOk = marginNum >= 0 && marginNum <= 5
  const perServing = hasServings && tape.rawCost > 0 ? tape.rawCost / servingsNum : null
  const perServingWithMargin = perServing != null ? perServing * (1 + marginNum / 100) : null
  const weightPerServing = hasServings && tape.totalGrams > 0 ? tape.totalGrams / servingsNum : null

  const preview = calc.preview.ok ? calc.preview : null
  const pctIndicator =
    pctNum == null || pctNum <= 0 ? null : pctNum < 32 ? { text: "Muy bueno", tone: "good" } : pctNum > 37 ? { text: "Alto: ganas poco", tone: "bad" } : { text: "Regular", tone: "mid" }

  const pendingEntry = !!pickId && (calc.inputs.grams ?? 0) > 0

  const MARGIN_MSG = "El margen de seguridad debe estar entre 0 % y 5 %. Elige uno de los botones."

  /** Qué falta para pasar del paso 2 al 3 (null = todo bien) */
  function step2Problem(): string | null {
    if (lines.length === 0 && !pendingEntry) {
      return "Agrega al menos un ingrediente: elige uno de la lista, escribe sus gramos y pulsa Agregar."
    }
    if (goneLines.length > 0) {
      return `«${goneLines[0].name}» ya no existe en tu lista. Quítalo con el icono de la papelera para poder continuar.`
    }
    if (pendingCount > 0) return "Espera un momento: aún se está calculando el costo de las recetas base."
    if (!pendingEntry && lines.length > 0 && tape.rawCost <= 0) {
      return "Ningún ingrediente de la lista tiene costo, así que no se puede calcular el precio. Revisa los precios en Inventario."
    }
    return null
  }

  function nextFrom2() {
    const problem = step2Problem()
    if (problem) {
      setStepError(problem)
      return
    }
    if (pendingEntry) {
      addLine()
    } else if (pickId || (calc.inputs.grams ?? 0) > 0) {
      // Algo a medias (ingrediente sin gramos o gramos sin ingrediente): avisar una vez, no perderlo en silencio
      const key = `${pickId}|${calc.inputs.grams ?? 0}`
      if (halfAck.current !== key) {
        halfAck.current = key
        setStepError(
          pickId
            ? `Elegiste «${pickedName}» pero no escribiste sus gramos. Escríbelos y pulsa Agregar, o pulsa Siguiente otra vez para seguir sin agregarlo.`
            : `Escribiste ${grams(calc.inputs.grams ?? 0)} pero no elegiste el ingrediente. Elígelo y pulsa Agregar, o pulsa Siguiente otra vez para seguir sin agregarlo.`,
        )
        return
      }
    }
    goStep(3)
  }

  function nextFrom3() {
    if (!hasServings) {
      setStepError("Escribe cuántas porciones salen de la receta (por ejemplo, 4).")
      calc.activate("servings")
      return
    }
    if (!marginOk) {
      setStepError(MARGIN_MSG)
      return
    }
    goStep(4)
  }

  function finish() {
    if (goneLines.length > 0) {
      goStep(2, `«${goneLines[0].name}» ya no existe en tu lista. Quítalo con el icono de la papelera para poder continuar.`)
      return
    }
    const r = calc.calculate()
    if (r.ok) {
      goStep(5)
      return
    }
    if (r.field === "grams") goStep(2, r.message)
    else if (r.field === "servings" || r.field === "margin") goStep(3, r.message)
    else setStepError(r.message)
  }

  /** Puede abrirse este paso desde la barra de arriba (sin saltarse lo que falta)? */
  function canOpen(n: Step) {
    if (n > maxStep) return false
    if (n >= 3 && lines.length === 0) return false
    if (n >= 4 && !hasServings) return false
    if (n === 5 && !result) return false
    return true
  }

  // ── Guardado ──────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!result || savingRef.current) return
    if (!name.trim()) {
      setSaveError("Escribe el nombre de la receta (paso 1).")
      return
    }
    let servingWeightG = result.servingWeightG ?? undefined
    if (servingWeight.trim()) {
      const w = parseFloat(servingWeight.replace(",", "."))
      if (!Number.isFinite(w) || w <= 0) {
        setSaveError("El peso por porción debe ser un número positivo.")
        return
      }
      servingWeightG = w
    }
    const payload: RecipePayload = {
      name: name.trim(),
      // Al editar se conserva el número que ya tenía (antes cambiaba en cada edición)
      recipeNumber: editRecipe?.recipeNumber ?? `R-${Date.now().toString(36).toUpperCase().slice(-5)}`,
      servings: result.servings,
      servingWeightG,
      safetyMargin: calc.inputs.margin ?? 0,
      isBase,
      description: description.trim() || null,
      items: lines.map(
        (l, idx): RecipeItemPayload => ({
          componentType: l.kind,
          ingredientId: l.kind === "ingredient" ? l.refId : undefined,
          subRecipeId: l.kind === "recipe" ? l.refId : undefined,
          quantityG: l.grams,
          sortOrder: idx,
        }),
      ),
    }
    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    try {
      if (editRecipe) await dataSource.update(editRecipe.id, payload)
      else await dataSource.create(payload)
      setSaved(true)
      // Recordar lo último que usó la persona: el próximo cálculo arranca con eso
      saveStored(PCT_MP_KEY, calc.values.pctMP)
      saveStored(MARGIN_KEY, calc.values.margin)
      onSaved({ name: payload.name, created: !isEditing })
    } catch (e) {
      savingRef.current = false
      setSaveError(e instanceof Error ? e.message : "No se pudo guardar la receta.")
    } finally {
      setSaving(false)
    }
  }

  // ── ¿Hay algo sin guardar? ────────────────────────────────────────────────
  const snapshot = makeSnapshot({
    name,
    isBase,
    description,
    servingWeight,
    lines,
    servings: calc.values.servings,
    margin: calc.values.margin,
  })
  const dirty = !saved && (snapshot !== boot.initialSnapshot || !!pickId || calc.values.grams !== "")
  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  const fieldProps = (f: RecipeTapeField) => ({
    id: FIELD_IDS[f],
    active: calc.active === f,
    fresh: calc.fresh && !result,
    error: error?.field === f,
    describedBy: "recipe-calc-message",
    onActivate: () => calc.activate(f),
    onKey: press,
    onRawInput: (raw: string) => {
      setStepError(null)
      setLastAdded(null)
      calc.setRaw(f, raw)
    },
    onEnter: () => enter(f),
  })
  const setRef = (f: RecipeTapeField) => (el: HTMLInputElement | null) => {
    registerRefs.current[f] = el
  }

  /** Teclado de la calculadora: "Limpiar" borra solo el dato de este paso. */
  const keypad = (
    <div className="calc-keypad-slot">
      <CalcKeypad
        onKey={press}
        onClearAll={() => {
          calc.fill({ [calc.active]: "" })
          setStepError(null)
          setLastAdded(null)
        }}
        decimalEnabled={ENTRY[calc.active].decimals}
      />
    </div>
  )

  const STEPS: { n: Step; label: string }[] = [
    { n: 1, label: "Nombre" },
    { n: 2, label: "Ingredientes" },
    { n: 3, label: "Porciones" },
    { n: 4, label: "Precio" },
    { n: 5, label: "Listo" },
  ]

  const nav = (back: Step | null, next: React.ReactNode) => (
    <div className="rw-nav">
      {back ? (
        <Button variant="ghost" onClick={() => goStep(back)} type="button">
          <ArrowLeft size={16} /> Atrás
        </Button>
      ) : (
        <span />
      )}
      {next}
    </div>
  )

  /** Lo ya decidido, a la vista en los pasos siguientes */
  const recap = (withServings: boolean) => (
    <p className="rw-recap">
      <strong>«{name.trim()}»</strong> · {summary} · costo {formatCOP(tape.rawCost)}
      {withServings && hasServings && (
        <>
          {" "}
          · {plural(servingsNum ?? 0, "porción", "porciones")} · margen {formatPercent(marginNum, 0)}
        </>
      )}
    </p>
  )

  const warnUnpriced = (unpricedNames.length > 0 || pendingCount > 0) && (
    <div role="status" className="rw-warn">
      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
      <p>
        {pendingCount > 0 && "Calculando el costo de las recetas base… "}
        {unpricedNames.length > 0 &&
          (canCostBase
            ? `Sin costo disponible: ${unpricedNames.join(", ")}. No suma(n) al costo, así que el precio saldrá más bajo de lo real. Una receta base necesita su peso por porción para conocer el costo del gramo.`
            : `Aquí no se puede conocer el costo de las recetas base (${unpricedNames.join(", ")}): no suman al costo.`)}
      </p>
    </div>
  )

  return (
    <div className="rw" ref={wrapRef}>
      {/* Dónde voy */}
      <ol className="rw-steps" aria-label="Pasos para crear la receta">
        {STEPS.map((s) => {
          const reachable = canOpen(s.n)
          return (
            <li key={s.n} className={`rw-step${step === s.n ? " is-current" : ""}${s.n < step ? " is-done" : ""}`}>
              <button
                type="button"
                disabled={!reachable || saved}
                aria-current={step === s.n ? "step" : undefined}
                title={reachable || s.n <= step ? undefined : "Completa el paso anterior para llegar aquí"}
                onClick={() => goStep(s.n)}
              >
                <span className="rw-step-n">{s.n < step ? <Check size={13} /> : s.n}</span>
                <span className="rw-step-label">{s.label}</span>
              </button>
            </li>
          )
        })}
      </ol>

      {/* ── 1. Nombre ─────────────────────────────────────────────────── */}
      {step === 1 && (
        <section className="rw-card" aria-labelledby="rw-q1">
          <h3 id="rw-q1" className="rw-q" tabIndex={-1}>
            ¿Cómo se llama tu receta?
          </h3>
          <p className="rw-help">Por ejemplo: Arroz con pollo, Salsa bechamel, Torta de chocolate.</p>
          <div>
            <input
              id="recipe-name"
              type="text"
              autoFocus
              value={name}
              aria-label="Nombre de la receta"
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? "recipe-name-error" : undefined}
              onChange={(e) => {
                setName(e.target.value)
                setNameError(null)
                setSaveError(null)
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return
                if (name.trim()) goStep(2)
                else setNameError("Escribe un nombre para continuar.")
              }}
              placeholder="Nombre de la receta"
              className="rw-input"
              maxLength={120}
            />
            {nameError && (
              <p id="recipe-name-error" role="alert" className="rw-field-error">
                {nameError}
              </p>
            )}
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isBase}
            onClick={() => setIsBase((v) => !v)}
            className="rw-switch"
            data-on={isBase}
          >
            <span aria-hidden="true" className="rw-switch-track">
              <span className="rw-switch-thumb" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Es una receta base
              </span>
              <span className="block text-xs rw-soft">
                Actívalo si es una preparación que usarás dentro de otras (salsas, fondos, masas…).
              </span>
            </span>
          </button>
          {isBase && (
            <p role="status" className="rw-indicator is-mid">
              Ojo: una receta base no se puede editar ni eliminar después de guardarla. Revísala bien antes de guardar.
            </p>
          )}

          {nav(
            null,
            <Button
              variant="primary"
              type="button"
              onClick={() => {
                if (name.trim()) goStep(2)
                else {
                  setNameError("Escribe un nombre para continuar.")
                  document.getElementById("recipe-name")?.focus()
                }
              }}
            >
              Siguiente <ArrowRight size={16} />
            </Button>,
          )}
        </section>
      )}

      {/* ── 2. Ingredientes ───────────────────────────────────────────── */}
      {step === 2 && (
        <section className="rw-card" aria-labelledby="rw-q2">
          <h3 id="rw-q2" className="rw-q" tabIndex={-1}>
            ¿Qué ingredientes lleva «{name.trim() || "tu receta"}»?
          </h3>
          {lines.length === 0 ? (
            <ol className="rw-howto">
              <li>Elige un ingrediente de la lista.</li>
              <li>Escribe con el teclado cuántos gramos lleva.</li>
              <li>
                Pulsa <strong>Agregar</strong>. Repite con cada ingrediente.
              </li>
            </ol>
          ) : (
            <p className="rw-help">
              Repite con cada ingrediente. Cuando termines, pulsa <strong>Siguiente</strong>.
            </p>
          )}

          {catalog.ingredients.length === 0 && pickKind === "ingredient" && (
            <div role="status" className="rw-warn">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <p>
                Aún no hay ingredientes para elegir.{" "}
                {dataSource.ingredientsHref ? (
                  <>
                    Crea primero tus ingredientes en{" "}
                    <Link href={dataSource.ingredientsHref} className="underline font-semibold">
                      Inventario
                    </Link>{" "}
                    y vuelve a esta pantalla.
                  </>
                ) : (
                  "Crea primero los ingredientes y vuelve a esta pantalla."
                )}
              </p>
            </div>
          )}

          <CalcDevice label="Calculadora de ingredientes">
            <CalcDisplay
              label="COSTO DE LOS INGREDIENTES"
              value={formatCOP(tape.rawCost)}
              sub={stepError ?? lastAdded ?? (lines.length === 0 ? "Aún no has agregado ingredientes" : summary)}
              subId="recipe-calc-message"
              tone={stepError ? "error" : lines.length === 0 ? "idle" : "result"}
              announce={stepError ? "" : (lastAdded ?? "")}
            />

            <div className="rt-slip">
              <div className="rt-kind" role="group" aria-label="Qué vas a agregar">
                <button type="button" aria-pressed={pickKind === "ingredient"} onClick={() => changeKind("ingredient")}>
                  Ingrediente
                </button>
                <button type="button" aria-pressed={pickKind === "recipe"} onClick={() => changeKind("recipe")}>
                  Receta base
                </button>
              </div>
              <SearchableSelect
                options={pickOptions}
                value={pickId}
                onChange={choose}
                placeholder={pickKind === "ingredient" ? "Buscar ingrediente…" : "Buscar receta base…"}
                emptyMessage={pickKind === "ingredient" ? "No hay ingredientes" : "Aún no hay recetas base"}
                ariaLabel={pickKind === "ingredient" ? "Ingrediente" : "Receta base"}
              />
            </div>

            <div className="calc-registers">
              <CalcRegister
                ref={setRef("grams")}
                {...fieldProps("grams")}
                label="GRAMOS"
                ariaLabel="Gramos del ingrediente a agregar"
                display={formatGramsEntry(calc.values.grams)}
                placeholder="0 g"
                note={
                  pickedName ? (
                    <span title={pickedName}>
                      {pickedName}
                      {pickedCostText && ` · ${pickedCostText}`}
                    </span>
                  ) : (
                    <span>elige arriba qué agregar</span>
                  )
                }
              />
              <button type="button" className="calc-key calc-key-fn rt-add" onMouseDown={(e) => e.preventDefault()} onClick={addLine}>
                <span className="inline-flex items-center gap-1.5">
                  <Plus size={16} /> Agregar
                </span>
                <small>a la lista</small>
              </button>
            </div>

            {keypad}
          </CalcDevice>

          {/* La cinta: lo ya agregado, fuera del aparato para que se lea cómodo */}
          <div className="rt-tape">
            <div className="rt-tape-head">
              <span>TU LISTA</span>
              <span>{lines.length > 0 ? summary : "VACÍA"}</span>
            </div>
            {lines.length === 0 ? (
              <p className="rt-empty">Los ingredientes que agregues irán apareciendo aquí con su costo.</p>
            ) : (
              <ol ref={linesRef} className="rt-lines" aria-label="Ingredientes agregados">
                {tape.lines.map((p, idx) => (
                  <li key={p.line.key} className="rt-line">
                    <span className="rt-n">{idx + 1}</span>
                    <div className="rt-main">
                      <span className="rt-name">
                        {p.line.name}
                        {p.line.kind === "recipe" && <span className="rt-chip">BASE</span>}
                      </span>
                      <span className="rt-meta">
                        {grams(p.line.grams)}
                        {p.costPerGram != null && ` × ${formatCOPDecimals(p.costPerGram)}/g`}
                        {!p.line.refId && " · ya no existe"}
                      </span>
                    </div>
                    <span className={`rt-cost${p.cost == null && !p.pending ? " is-missing" : ""}`}>
                      {p.cost != null ? formatCOP(p.cost) : p.pending ? "…" : "sin costo"}
                    </span>
                    <div className="rt-actions">
                      <button type="button" className="rt-icon-btn" aria-label={`Subir ${p.line.name}`} disabled={idx === 0} onClick={() => setLines((prev) => moveLine(prev, idx, idx - 1))}>
                        <ChevronUp size={14} />
                      </button>
                      <button type="button" className="rt-icon-btn" aria-label={`Bajar ${p.line.name}`} disabled={idx === lines.length - 1} onClick={() => setLines((prev) => moveLine(prev, idx, idx + 1))}>
                        <ChevronDown size={14} />
                      </button>
                      <button type="button" className="rt-icon-btn is-danger" aria-label={`Quitar ${p.line.name}`} onClick={() => removeLine(p.line.key)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <div className="rt-total" aria-live="polite">
              <span>TOTAL</span>
              <span>
                {grams(tape.totalGrams)} · {formatCOP(tape.rawCost)}
              </span>
            </div>
          </div>

          {warnUnpriced}

          {nav(
            1,
            <Button variant="primary" type="button" onClick={nextFrom2}>
              {pendingEntry ? "Agregar y seguir" : "Siguiente"} <ArrowRight size={16} />
            </Button>,
          )}
        </section>
      )}

      {/* ── 3. Porciones y margen ─────────────────────────────────────── */}
      {step === 3 && (
        <section className="rw-card" aria-labelledby="rw-q3">
          <h3 id="rw-q3" className="rw-q" tabIndex={-1}>
            ¿Cuántas porciones salen de esta receta?
          </h3>
          {recap(false)}
          <p className="rw-help">Cuántos platos o raciones se sirven con todo lo que agregaste ({grams(tape.totalGrams)}).</p>

          <CalcDevice label="Calculadora de porciones">
            <CalcDisplay
              label="COSTO POR PORCIÓN"
              value={perServingWithMargin != null ? formatCOP(perServingWithMargin) : formatCOP(0)}
              sub={
                stepError ??
                (perServing != null
                  ? `Cada porción pesa ${grams(weightPerServing ?? 0)} · incluye margen de seguridad ${formatPercent(marginNum, 0)}`
                  : "Escribe cuántas porciones salen")
              }
              subId="recipe-calc-message"
              tone={stepError ? "error" : perServing != null ? "result" : "idle"}
              announce=""
            />
            <div className="calc-registers">
              <CalcRegister
                ref={setRef("servings")}
                {...fieldProps("servings")}
                label="PORCIONES"
                ariaLabel="Número de porciones que rinde la receta"
                display={formatServingsEntry(calc.values.servings)}
                placeholder="0"
              />
            </div>
            {keypad}
          </CalcDevice>

          <div className="rw-group">
            <p className="rw-group-title">Margen de seguridad</p>
            <p className="rw-help">
              Un pequeño colchón que se suma al costo por si suben los precios o se desperdicia algo. Lo recomendado es 3 %.
            </p>
            <div className="rw-chips" role="group" aria-label="Margen de seguridad">
              {[0, 1, 2, 3, 4, 5].map((m) => (
                <button key={m} type="button" className="rw-chip" aria-pressed={marginNum === m} onClick={() => { setStepError(null); calc.fill({ margin: String(m) }) }}>
                  {m} %
                </button>
              ))}
              {![0, 1, 2, 3, 4, 5].includes(marginNum) && (
                <button type="button" className="rw-chip" aria-pressed="true" disabled>
                  {formatPercent(marginNum, 1)} (actual)
                </button>
              )}
            </div>
            {!marginOk && (
              <p role="alert" className="rw-indicator is-bad">
                {MARGIN_MSG}
              </p>
            )}
          </div>

          {nav(
            2,
            <Button variant="primary" type="button" onClick={nextFrom3}>
              Siguiente <ArrowRight size={16} />
            </Button>,
          )}
        </section>
      )}

      {/* ── 4. % de materia prima ─────────────────────────────────────── */}
      {step === 4 && (
        <section className="rw-card" aria-labelledby="rw-q4">
          <h3 id="rw-q4" className="rw-q" tabIndex={-1}>
            ¿Qué parte del precio de venta quieres que se vaya en ingredientes?
          </h3>
          {recap(true)}
          <p className="rw-help">
            Es tu «porcentaje de materia prima». En cocina lo habitual es entre 30 % y 35 %: lo que sobra paga arriendo,
            sueldos y tu ganancia.
            {boot.pctFromStore && " Empezamos con el que usaste la última vez; cámbialo si quieres."}
          </p>

          <CalcDevice label="Calculadora de precio de venta">
            <CalcDisplay
              label="PRECIO DE VENTA SUGERIDO POR PORCIÓN"
              value={preview ? formatCOP(preview.pricePerServing) : formatCOP(0)}
              sub={
                stepError ??
                (preview
                  ? `Cada porción te cuesta ${formatCOP(preview.costWithMarginPerServing)} con el margen`
                  : "Escribe el % o elige uno de abajo")
              }
              subId="recipe-calc-message"
              tone={stepError ? "error" : preview ? "result" : "idle"}
              announce={stepError ? "" : preview ? `Precio sugerido por porción: ${formatCOP(preview.pricePerServing)}` : ""}
            />
            <div className="calc-registers">
              <CalcRegister
                ref={setRef("pctMP")}
                {...fieldProps("pctMP")}
                label="% MATERIA PRIMA"
                ariaLabel="Porcentaje del precio de venta que se va en materia prima"
                display={formatPercentEntry(calc.values.pctMP)}
                placeholder="0 %"
              />
            </div>
            {keypad}
          </CalcDevice>

          <div className="rw-group">
            <p className="rw-group-title">Atajos</p>
            <div className="rw-chips" role="group" aria-label="Porcentajes frecuentes">
              {[30, 33, 35, 37].map((p) => (
                <button key={p} type="button" className="rw-chip" aria-pressed={pctNum === p} onClick={() => { setStepError(null); calc.fill({ pctMP: String(p) }) }}>
                  {p} %
                </button>
              ))}
            </div>
            {pctIndicator && (
              <p className={`rw-indicator is-${pctIndicator.tone}`} role="status">
                Con {formatPercent(pctNum ?? 0, 0)}: {pctIndicator.text}
              </p>
            )}
          </div>

          {nav(
            3,
            <Button variant="primary" type="button" onClick={finish}>
              Ver mi receta <ArrowRight size={16} />
            </Button>,
          )}
        </section>
      )}

      {/* ── 5. Resultado y guardado ───────────────────────────────────── */}
      {step === 5 && !result && (
        <section className="rw-card" aria-labelledby="rw-q5">
          <h3 id="rw-q5" className="rw-q" tabIndex={-1}>
            Hay que recalcular tu receta
          </h3>
          <p className="rw-help">Cambió algún costo mientras la revisabas. Pulsa el botón para ver el resultado actualizado.</p>
          {nav(4, <Button variant="primary" type="button" onClick={finish}>Recalcular <ArrowRight size={16} /></Button>)}
        </section>
      )}
      {step === 5 && result && (
        <section className="rw-card" aria-labelledby="rw-q5">
          <h3 id="rw-q5" className="rw-q" tabIndex={-1}>
            Tu receta «{name.trim()}» está lista
          </h3>

          <CalcDevice label="Resultado de la receta">
            <CalcDisplay
              label="PRECIO POTENCIAL POR PORCIÓN"
              value={formatCOP(result.pricePerServing)}
              sub={`Costo por porción ${formatCOP(result.rawCostPerServing)} · materia prima ${result.pricing.indicator.toLowerCase()}`}
              tone="result"
              announce={`Precio potencial por porción: ${formatCOP(result.pricePerServing)}`}
              revealKey={result.pricePerServing}
            />
          </CalcDevice>

          {warnUnpriced}

          <div className="rw-adjust">
            <Button variant="ghost" type="button" onClick={() => goStep(2)}>
              Cambiar ingredientes
            </Button>
            <Button variant="ghost" type="button" onClick={() => goStep(3)}>
              Cambiar porciones o margen
            </Button>
            <Button variant="ghost" type="button" onClick={() => goStep(4)}>
              Cambiar % de materia prima
            </Button>
          </div>

          <CalcBreakdown
            title="Costos"
            rows={[
              { label: "Peso total de la receta", value: grams(result.totalGrams) },
              { label: "Peso de una porción", value: result.servingWeightG != null ? grams(result.servingWeightG) : "—" },
              { label: "Costo de 1 gramo (sin margen)", value: formatCOPDecimals(result.costPerGram) },
              { label: "Materia prima de la receta", value: formatCOP(result.rawCostTotal) },
              { label: `Costo con margen (${formatPercent(calc.inputs.margin ?? 0, 2)}), receta completa`, value: formatCOP(result.costWithMarginTotal) },
              { label: "Costo por porción", value: formatCOP(result.rawCostPerServing) },
              { label: "Costo por porción con margen", value: formatCOP(result.costWithMarginPerServing), strong: true },
            ]}
          />
          <CalcBreakdown
            title="Precio de venta"
            rows={[
              { label: "% de materia prima", value: formatPercent(result.pricing.pctMP, 2) },
              { label: "Indicador", value: result.pricing.indicator },
              { label: `Costos fijos (${formatPercent(result.pricing.pctFixedCosts)}), por porción`, value: formatCOP((result.pricePerServing * result.pricing.pctFixedCosts) / 100) },
              { label: `Ganancia (${formatPercent(result.pricing.pctProfit)}), por porción`, value: formatCOP((result.pricePerServing * result.pricing.pctProfit) / 100) },
              { label: "Precio potencial por porción", value: formatCOP(result.pricePerServing), strong: true },
              { label: `Precio potencial de la receta (${result.servings} porc.)`, value: formatCOP(result.priceTotal), strong: true },
            ]}
          />

          <details className="rw-details" open={!!(boot.servingWeight || editRecipe?.description) || undefined}>
            <summary>Detalles opcionales (peso por porción, descripción)</summary>
            <div className="flex flex-col gap-3 pt-3">
              <div>
                <label htmlFor="recipe-serving-weight" className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Peso por porción (g)
                </label>
                <input
                  id="recipe-serving-weight"
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={servingWeight}
                  onChange={(e) => setServingWeight(e.target.value)}
                  placeholder={result.servingWeightG != null ? `Se calcula solo: ${result.servingWeightG} g` : "Se calcula solo"}
                  className="rw-input is-small"
                />
              </div>
              <div>
                <label htmlFor="recipe-description" className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Descripción
                </label>
                <textarea
                  id="recipe-description"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descripción del plato…"
                  className="rw-input is-small resize-y"
                />
              </div>
            </div>
          </details>

          {saveError && (
            <p className="text-sm" role="alert" style={{ color: "#B42020" }}>
              {saveError}
            </p>
          )}
          {saved && (
            <p className="text-sm flex items-center gap-1.5" role="status" style={{ color: "#166534" }}>
              <CheckCircle2 size={14} /> {isEditing ? "Receta actualizada" : "Receta creada"}
            </p>
          )}
          <Button id="btn-save-recipe" variant="primary" onClick={handleSave} loading={saving} disabled={saved} className="w-full">
            {isEditing ? "Guardar cambios" : "Guardar receta"}
          </Button>
        </section>
      )}
    </div>
  )
}
