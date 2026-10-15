"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Pencil, Trash2, Copy, Download, ChefHat } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import RecipeCalculatorView from "@/components/app/recipes/RecipeCalculatorView"
import type { RecipeFormDataSource } from "@/components/app/recipes/recipeSource"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import Pagination from "@/components/app/inventario/Pagination"
import type { FilterGroup } from "@/components/ui/FilterMenu"
import { formatCOP, formatGrams } from "@/components/app/inventario/format"
import {
  bancoCreateRecipe, bancoDeleteRecipe, bancoGetRecipe, bancoListIngredients, bancoListRecipes,
  bancoUpdateRecipe,
} from "@/lib/api"
import { toast } from "@/lib/toast"
import { friendlyError } from "@/lib/errorMessage"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { useBanco } from "@/components/plataforma/banco/useBanco"
import BancoTable, { AccionFila, Aviso, type BancoColumn } from "@/components/plataforma/banco/BancoTable"
import BancoToolbar from "@/components/plataforma/banco/BancoToolbar"
import { BarraSeleccion, PanelCalidad, type ChequeoCalidad } from "@/components/plataforma/banco/BancoBarras"
import { descargarCsv, fechaParaArchivo } from "@/components/plataforma/banco/descargar"
import { filtrarRecetas, paginar, type FiltroRecetas, type OrdenRecetas } from "@/lib/plataforma/banco/filters"
import { PROBLEMA_RECETA_TEXTO, type ProblemaReceta, type RecetaBanco } from "@/lib/plataforma/banco/quality"
import { construirCsv } from "@/lib/plataforma/banco/csv"
import { ejecutarEnLote } from "@/lib/plataforma/banco/lote"
import type { Recipe } from "@/types/domain"

type RecetaFila = Recipe & { itemCount: number }

const PAGE_SIZE = 20

const ORDENES: { value: OrdenRecetas; label: string }[] = [
  { value: "nombre", label: "Nombre (A-Z)" },
  { value: "costo_desc", label: "Más caras por porción" },
  { value: "costo_asc", label: "Más baratas por porción" },
  { value: "reciente", label: "Modificadas hace poco" },
]

const FILTRO_VACIO: FiltroRecetas = { busqueda: "", tipo: "all", orden: "nombre" }

const AYUDA: Record<ProblemaReceta, { ayuda: string; gravedad: "alta" | "media" }> = {
  sin_peso: { ayuda: "Sin el peso de la porción no se puede costear el menú de los negocios.", gravedad: "alta" },
  sin_ingredientes: { ayuda: "La receta no tiene ningún componente.", gravedad: "alta" },
  fuera_del_banco: { ayuda: "Un ingrediente o preparación fue eliminado o no pertenece al banco.", gravedad: "alta" },
  sin_costo: { ayuda: "Falta algún precio o cantidad para calcular lo que cuesta.", gravedad: "media" },
  sin_descripcion: { ayuda: "No tiene texto que la explique a quien la importe.", gravedad: "media" },
}

export default function BancoRecetasPage() {
  const { platformCan } = usePermissions()
  const canCreate = platformCan("publicRecipes", "create")
  const canUpdate = platformCan("publicRecipes", "update")
  const canDelete = platformCan("publicRecipes", "delete")
  const confirm = useConfirm()

  const banco = useBanco()
  const { recetas, costos, usos, problemasDeReceta } = banco

  const [filtro, setFiltro] = useState<FiltroRecetas>(FILTRO_VACIO)
  const [claveBusqueda, setClaveBusqueda] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [eliminando, setEliminando] = useState(false)
  const [vista, setVista] = useState<"lista" | "calculadora">("lista")
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0 })
  }, [vista])

  // Fuente de datos de la calculadora; con el costo estimado de las preparaciones base
  const fuente = useMemo<RecipeFormDataSource>(
    () => ({
      sourceKey: "banco",
      ingredientsHref: "/plataforma/banco/ingredientes",
      loadCatalog: async () => {
        const [ing, rec] = await Promise.all([
          bancoListIngredients(undefined, 1, 1000).then((r) => r.data),
          bancoListRecipes(undefined, 1, "base", 300).then((r) => r.data),
        ])
        return { ingredients: ing, baseRecipes: rec }
      },
      loadRecipe: (id) => bancoGetRecipe(id).then((r) => r.data),
      create: (payload) => bancoCreateRecipe(payload),
      update: (id, payload) => bancoUpdateRecipe(id, payload),
      loadCostPerGram: async (id) => costos?.get(id)?.costoPorGramo ?? null,
    }),
    [costos]
  )

  function cambiar(parcial: Partial<FiltroRecetas>) {
    setFiltro((f) => ({ ...f, ...parcial }))
    setPagina(1)
  }
  function limpiarFiltros() {
    setFiltro(FILTRO_VACIO)
    setClaveBusqueda((k) => k + 1)
    setPagina(1)
  }

  const filtradas = useMemo(
    () => (recetas ? filtrarRecetas(recetas as RecetaFila[], filtro, problemasDeReceta, costos) : []),
    [recetas, filtro, problemasDeReceta, costos]
  )
  const pag = paginar(filtradas, pagina, PAGE_SIZE)

  const cuentas = useMemo(() => {
    const c: Record<ProblemaReceta, number> = { sin_peso: 0, sin_ingredientes: 0, fuera_del_banco: 0, sin_costo: 0, sin_descripcion: 0 }
    for (const r of recetas ?? []) for (const p of problemasDeReceta(r as RecetaFila)) c[p]++
    return c
  }, [recetas, problemasDeReceta])

  const chequeos: ChequeoCalidad[] = (["sin_peso", "sin_ingredientes", "fuera_del_banco", "sin_costo", "sin_descripcion"] as ProblemaReceta[]).map((id) => ({
    id,
    texto: PROBLEMA_RECETA_TEXTO[id],
    ayuda: AYUDA[id].ayuda,
    gravedad: AYUDA[id].gravedad,
    // lo que depende de los componentes solo se sabe cuando termina la revisión
    cuenta: id === "sin_peso" || id === "sin_descripcion" || banco.detalleListo ? cuentas[id] : null,
    activo: filtro.problema === id,
    onClick: () => cambiar({ problema: filtro.problema === id ? undefined : id }),
  }))

  const grupos: FilterGroup[] = [
    {
      id: "tipo",
      label: "Tipo",
      options: [
        { value: "base", label: "Preparaciones base", count: (recetas ?? []).filter((r) => r.isBase).length },
        { value: "principal", label: "Platos", count: (recetas ?? []).filter((r) => !r.isBase).length },
      ],
      value: filtro.tipo === "all" ? undefined : filtro.tipo,
      onChange: (v) => cambiar({ tipo: (v as FiltroRecetas["tipo"] | undefined) ?? "all" }),
    },
    {
      id: "problema",
      label: "Revisión",
      options: chequeos.filter((c) => c.cuenta !== null).map((c) => ({ value: c.id, label: c.texto, count: c.cuenta ?? 0 })),
      value: filtro.problema,
      onChange: (v) => cambiar({ problema: v as ProblemaReceta | undefined }),
    },
  ]

  // ── Selección ──
  function alternar(id: string) {
    setSeleccion((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }
  function alternarPagina(marcar: boolean) {
    setSeleccion((s) => {
      const n = new Set(s)
      pag.items.forEach((r) => (marcar ? n.add(r.id) : n.delete(r.id)))
      return n
    })
  }

  // ── Exportar ──
  function exportar(lista: RecetaBanco[]) {
    descargarCsv(
      `recetas-banco-${fechaParaArchivo()}.csv`,
      construirCsv(
        ["nombre", "codigo", "tipo", "porciones", "peso_porcion_g", "ingredientes", "costo_por_porcion_estimado"],
        lista.map((r) => [
          r.name,
          r.recipeNumber,
          r.isBase ? "Preparación base" : "Plato",
          parseFloat(r.servings),
          r.servingWeightG == null ? null : parseFloat(r.servingWeightG),
          r.itemCount ?? 0,
          costos?.get(r.id)?.costoPorPorcion == null ? null : Math.round(costos.get(r.id)!.costoPorPorcion! * 100) / 100,
        ])
      )
    )
    toast.success(`${lista.length} ${lista.length === 1 ? "receta exportada" : "recetas exportadas"}`)
  }

  // ── Duplicar ──
  async function duplicar(r: RecetaFila) {
    try {
      const { data } = await bancoGetRecipe(r.id)
      await bancoCreateRecipe({
        name: `${data.name} (copia)`,
        recipeNumber: `${data.recipeNumber}-COPIA`,
        servings: parseFloat(data.servings),
        servingWeightG: data.servingWeightG == null ? null : parseFloat(data.servingWeightG),
        safetyMargin: parseFloat(data.safetyMargin),
        isBase: data.isBase,
        description: data.description ?? null,
        items: (data.items ?? []).map((it, idx) => ({
          componentType: it.componentType,
          ingredientId: it.ingredientId ?? undefined,
          subRecipeId: it.subRecipeId ?? undefined,
          quantityG: parseFloat(it.quantityG),
          sortOrder: idx,
        })),
      })
      await banco.recargarTodo()
      toast.success("Receta duplicada", { description: `${data.name} (copia)` })
    } catch (e) {
      toast.error("No se pudo duplicar la receta", { description: friendlyError(e, "Inténtalo de nuevo en unos segundos.") })
    }
  }

  // ── Eliminar (una o varias) ──
  async function eliminar(objetivos: RecetaFila[]) {
    if (objetivos.length === 0) return
    const comoBase = usos ? objetivos.filter((o) => (usos.subRecetas.get(o.id) ?? 0) > 0) : []
    const aviso = !usos
      ? "Aún no se terminó de revisar si otras recetas las usan como preparación."
      : comoBase.length > 0
      ? `${comoBase.length === 1 ? "Una está" : `${comoBase.length} están`} en uso como preparación dentro de otras recetas del banco, que quedarán incompletas.`
      : "Ninguna otra receta del banco las usa como preparación."
    const ok = await confirm({
      title: objetivos.length === 1 ? "Eliminar receta del banco" : `Eliminar ${objetivos.length} recetas del banco`,
      itemName: objetivos.length === 1 ? objetivos[0].name : `${objetivos.length} recetas seleccionadas`,
      description: `Dejará de estar disponible para quien quiera importarla. ${aviso} Los negocios que ya la importaron conservan su copia. No se puede deshacer y queda en la auditoría.`,
      confirmLabel: objetivos.length === 1 ? "Eliminar" : `Eliminar ${objetivos.length}`,
      variant: "danger",
    })
    if (!ok) return
    setEliminando(true)
    const r = await ejecutarEnLote(objetivos, (o) => bancoDeleteRecipe(o.id), undefined, (e) => friendlyError(e, "Error al eliminar."))
    setEliminando(false)
    await banco.recargarTodo()
    setSeleccion((s) => {
      const n = new Set(s)
      r.hechos.forEach((o) => n.delete(o.id))
      return n
    })
    if (r.hechos.length > 0) toast.success(r.hechos.length === 1 ? "Receta eliminada del banco" : `${r.hechos.length} recetas eliminadas del banco`)
    if (r.fallidos.length > 0) toast.error(`No se pudo eliminar ${r.fallidos.length} ${r.fallidos.length === 1 ? "receta" : "recetas"}`, { description: r.fallidos[0].motivo })
  }

  const seleccionadas = (recetas ?? []).filter((r) => seleccion.has(r.id)) as RecetaFila[]

  if (vista === "calculadora") {
    return (
      <RecipeCalculatorView
        key={editId ?? "nueva"}
        editRecipeId={editId}
        dataSource={fuente}
        onBack={() => setVista("lista")}
        onSaved={(info) => {
          void banco.recargarTodo()
          toast.success(info.created ? "Receta creada en el banco" : "Receta actualizada", { description: info.name })
          setVista("lista")
        }}
      />
    )
  }

  const columnas: BancoColumn<RecetaFila>[] = [
    {
      label: "Receta",
      width: "minmax(0,1fr)",
      render: (r) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold" style={{ color: "var(--text-primary)" }} title={r.name}>{r.name}</span>
          {r.isBase && <Aviso tono="muted">Preparación base</Aviso>}
          <Avisos problemas={problemasDeReceta(r)} />
        </span>
      ),
    },
    { label: "Porciones", width: "6rem", align: "right", render: (r) => Math.round(parseFloat(r.servings)).toLocaleString("es-CO") },
    {
      label: "Peso por porción",
      width: "8rem",
      align: "right",
      render: (r) => (r.servingWeightG && parseFloat(r.servingWeightG) > 0 ? formatGrams(r.servingWeightG) : "—"),
    },
    { label: "Componentes", width: "7rem", align: "right", render: (r) => r.itemCount },
    {
      label: "Costo por porción",
      width: "9rem",
      align: "right",
      strong: true,
      render: (r) => {
        if (!costos) return "…"
        const c = costos.get(r.id)?.costoPorPorcion
        return c == null ? "—" : formatCOP(c)
      },
    },
  ]

  const hayFiltros = !!filtro.busqueda || !!filtro.problema || filtro.tipo !== "all"

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Recetas del banco"
        subtitle={
          recetas
            ? `${recetas.length.toLocaleString("es-CO")} recetas visibles para todos los negocios. El costo por porción es una estimación con los precios del banco.`
            : "Cargando el banco…"
        }
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => exportar(filtradas)} disabled={filtradas.length === 0}>
              <Download size={15} aria-hidden="true" /> <span className="hidden sm:inline">Exportar</span>
            </Button>
            {canCreate && (
              <Button variant="primary" onClick={() => { setEditId(null); setVista("calculadora") }}>
                <Plus size={16} aria-hidden="true" /> <span className="hidden sm:inline">Nueva receta</span>
                <span className="sm:hidden">Nueva</span>
              </Button>
            )}
          </div>
        }
      />

      {recetas && <PanelCalidad chequeos={chequeos} revisando={banco.revisando} />}

      {banco.error ? (
        <ErrorState title="No pudimos cargar el banco" description="Revisa tu conexión e inténtalo de nuevo." onRetry={() => void banco.recargarTodo()} />
      ) : (
        <>
          <BancoToolbar
            busquedaInicial={filtro.busqueda}
            claveBusqueda={claveBusqueda}
            placeholder="Buscar receta por nombre o código"
            etiquetaBusqueda="Buscar receta"
            onBusqueda={(v) => cambiar({ busqueda: v })}
            grupos={grupos}
            orden={filtro.orden}
            opcionesOrden={ORDENES}
            onOrden={(o) => cambiar({ orden: o })}
          />

          {banco.cargando ? (
            <div className="animate-pulse overflow-hidden" aria-busy="true" aria-label="Cargando recetas" style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)" }}>
              {Array.from({ length: 8 }).map((_, k) => (
                <div key={k} className="px-5 py-4"><div className="h-3.5 rounded-md" style={{ width: `${40 + ((k * 17) % 30)}%`, background: "var(--bg-secondary)" }} /></div>
              ))}
            </div>
          ) : filtradas.length === 0 ? (
            <EmptyState
              icon={<ChefHat size={36} />}
              title={hayFiltros ? "Ninguna receta coincide" : "El banco todavía no tiene recetas"}
              description={hayFiltros ? "Prueba con otra búsqueda o quita algún filtro." : "Crea la primera con el botón Nueva receta."}
              action={hayFiltros ? <Button variant="ghost" size="sm" onClick={limpiarFiltros}>Ver todas las recetas</Button> : undefined}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <BancoTable
                rows={pag.items as RecetaFila[]}
                rowKey={(r) => r.id}
                columns={columnas}
                seleccion={canDelete ? seleccion : undefined}
                onToggle={canDelete ? alternar : undefined}
                onToggleTodas={canDelete ? alternarPagina : undefined}
                actionsWidth="7.5rem"
                ariaLabel="Recetas del banco"
                rowLabel={(r) => r.name}
                actions={(r) => (
                  <>
                    {canCreate && <AccionFila label={`Duplicar ${r.name}`} onClick={() => void duplicar(r)}><Copy size={15} /></AccionFila>}
                    {canUpdate && <AccionFila label={`Editar ${r.name}`} onClick={() => { setEditId(r.id); setVista("calculadora") }}><Pencil size={15} /></AccionFila>}
                    {canDelete && <AccionFila label={`Eliminar ${r.name}`} peligro onClick={() => void eliminar([r])}><Trash2 size={15} /></AccionFila>}
                  </>
                )}
                mobile={(r) => (
                  <div className="flex flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-1.5 text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      {r.name}
                      {r.isBase && <Aviso tono="muted">Preparación base</Aviso>}
                      <Avisos problemas={problemasDeReceta(r)} />
                    </span>
                    <span className="text-[13px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {Math.round(parseFloat(r.servings))} porciones · {r.itemCount} componentes
                      {costos?.get(r.id)?.costoPorPorcion != null && ` · ${formatCOP(costos.get(r.id)!.costoPorPorcion!)} por porción`}
                    </span>
                  </div>
                )}
              />
              <div className="flex items-center justify-between gap-4">
                <p className="text-[13px] tabular-nums" style={{ color: "var(--text-muted)" }} aria-live="polite">
                  {filtradas.length <= PAGE_SIZE
                    ? `${filtradas.length} ${filtradas.length === 1 ? "receta" : "recetas"}`
                    : `${((pag.pagina - 1) * PAGE_SIZE + 1).toLocaleString("es-CO")}–${((pag.pagina - 1) * PAGE_SIZE + pag.items.length).toLocaleString("es-CO")} de ${filtradas.length.toLocaleString("es-CO")}`}
                </p>
                <Pagination currentPage={pag.pagina} totalPages={pag.paginas} onPageChange={(p) => { setPagina(p); document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" }) }} />
              </div>
            </div>
          )}
        </>
      )}

      <BarraSeleccion
        cantidad={seleccionadas.length}
        singular="receta"
        plural="recetas"
        onLimpiar={() => setSeleccion(new Set())}
        onExportar={() => exportar(seleccionadas)}
        onEliminar={canDelete ? () => void eliminar(seleccionadas) : undefined}
        eliminando={eliminando}
      />
    </div>
  )
}

function Avisos({ problemas }: { problemas: ProblemaReceta[] }) {
  // «sin descripción» es menor y llenaría la lista; se ve en el panel y con el filtro
  const visibles = problemas.filter((p) => p !== "sin_descripcion")
  return (
    <>
      {visibles.map((p) => (
        <Aviso key={p} tono={p === "sin_costo" ? "muted" : "warning"}>{PROBLEMA_RECETA_TEXTO[p]}</Aviso>
      ))}
    </>
  )
}
