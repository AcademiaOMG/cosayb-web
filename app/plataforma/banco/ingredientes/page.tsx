"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, Copy, Upload, Download, Carrot } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import Pagination from "@/components/app/inventario/Pagination"
import type { FilterGroup } from "@/components/ui/FilterMenu"
import { displayName, formatCOP, formatGrams, formatPerGram } from "@/components/app/inventario/format"
import type { Ingrediente } from "@/types/domain"
import { bancoDeleteIngredient } from "@/lib/api"
import { toast } from "@/lib/toast"
import { friendlyError } from "@/lib/errorMessage"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { useBanco } from "@/components/plataforma/banco/useBanco"
import BancoTable, { AccionFila, Aviso, type BancoColumn } from "@/components/plataforma/banco/BancoTable"
import BancoToolbar from "@/components/plataforma/banco/BancoToolbar"
import { BarraSeleccion, PanelCalidad, type ChequeoCalidad } from "@/components/plataforma/banco/BancoBarras"
import IngredienteFormModal, { type FormularioIngrediente } from "@/components/plataforma/banco/IngredienteFormModal"
import ImportarIngredientesModal from "@/components/plataforma/banco/ImportarIngredientesModal"
import SincronizarPrecios from "@/components/plataforma/banco/SincronizarPrecios"
import { descargarCsv, fechaParaArchivo } from "@/components/plataforma/banco/descargar"
import {
  filtrarIngredientes, origenIngrediente, paginar, type FiltroIngredientes, type OrdenIngredientes,
} from "@/lib/plataforma/banco/filters"
import { PROBLEMA_INGREDIENTE_TEXTO, type ProblemaIngrediente } from "@/lib/plataforma/banco/quality"
import { construirCsv } from "@/lib/plataforma/banco/csv"
import { ejecutarEnLote } from "@/lib/plataforma/banco/lote"
import { haceFecha } from "@/lib/plataforma/banco/tiempo"

const PAGE_SIZE = 25

const ORDENES: { value: OrdenIngredientes; label: string }[] = [
  { value: "nombre", label: "Nombre (A-Z)" },
  { value: "precio_desc", label: "Más caros por gramo" },
  { value: "precio_asc", label: "Más baratos por gramo" },
  { value: "reciente", label: "Modificados hace poco" },
]

const UNIDADES: Record<string, string> = { g: "Gramos", ml: "Mililitros", und: "Unidades", porcion: "Porciones" }

const FILTRO_VACIO: FiltroIngredientes = { busqueda: "", orden: "nombre" }

export default function BancoIngredientesPage() {
  const { platformCan } = usePermissions()
  const canCreate = platformCan("publicIngredients", "create")
  const canUpdate = platformCan("publicIngredients", "update")
  const canDelete = platformCan("publicIngredients", "delete")
  const confirm = useConfirm()

  const banco = useBanco()
  const { ingredientes, problemasDeIngrediente, usos } = banco

  const [filtro, setFiltro] = useState<FiltroIngredientes>(FILTRO_VACIO)
  const [claveBusqueda, setClaveBusqueda] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [eliminando, setEliminando] = useState(false)
  const [formulario, setFormulario] = useState<FormularioIngrediente | null>(null)
  const [importando, setImportando] = useState(false)

  function cambiar(parcial: Partial<FiltroIngredientes>) {
    setFiltro((f) => ({ ...f, ...parcial }))
    setPagina(1)
  }
  function limpiarFiltros() {
    setFiltro(FILTRO_VACIO)
    setClaveBusqueda((k) => k + 1)
    setPagina(1)
  }

  // ── Datos derivados ──
  const filtrados = useMemo(
    () => (ingredientes ? filtrarIngredientes(ingredientes, filtro, problemasDeIngrediente) : []),
    [ingredientes, filtro, problemasDeIngrediente]
  )
  const vista = paginar(filtrados, pagina, PAGE_SIZE)

  const cuentas = useMemo(() => {
    const c: Record<ProblemaIngrediente, number> = { duplicado: 0, sin_precio: 0, precio_alto: 0, precio_bajo: 0, sin_uso: 0 }
    for (const i of ingredientes ?? []) for (const p of problemasDeIngrediente(i)) c[p]++
    return c
  }, [ingredientes, problemasDeIngrediente])

  const unidades = useMemo(() => [...new Set((ingredientes ?? []).map((i) => i.unit ?? "g"))], [ingredientes])
  const hayNegocio = (ingredientes ?? []).some((i) => origenIngrediente(i) === "negocio")
  const hayBanco = (ingredientes ?? []).some((i) => origenIngrediente(i) === "banco")

  const chequeos: ChequeoCalidad[] = (
    [
      ["duplicado", "Ingredientes repetidos", "Mismo nombre escrito igual (sin importar mayúsculas ni tildes).", "alta"],
      ["sin_precio", "Sin precio", "Costo o peso en cero: rompe el costo de las recetas.", "alta"],
      ["precio_alto", "Precio muy alto", "Más de $500.000 por kilo. Suele ser un cero de más.", "alta"],
      ["precio_bajo", "Precio muy bajo", "Menos de $100 por kilo. Revisa el costo o el peso.", "media"],
      ["sin_uso", "No se usan en ninguna receta", "Sobran o falta crear la receta que los usa.", "media"],
    ] as const
  ).map(([id, texto, ayuda, gravedad]) => ({
    id,
    texto,
    ayuda,
    gravedad,
    cuenta: id === "sin_uso" && !usos ? null : cuentas[id],
    activo: filtro.problema === id,
    onClick: () => cambiar({ problema: filtro.problema === id ? undefined : id }),
  }))

  const grupos: FilterGroup[] = [
    {
      id: "problema",
      label: "Revisión",
      options: (Object.keys(PROBLEMA_INGREDIENTE_TEXTO) as ProblemaIngrediente[])
        .filter((p) => p !== "sin_uso" || usos)
        .map((p) => ({ value: p, label: PROBLEMA_INGREDIENTE_TEXTO[p], count: cuentas[p] })),
      value: filtro.problema,
      onChange: (v) => cambiar({ problema: v as ProblemaIngrediente | undefined }),
    },
    {
      id: "actualizacion",
      label: "Última modificación",
      options: [
        { value: "reciente", label: "Últimos 30 días" },
        { value: "viejo", label: "Hace más de 30 días" },
      ],
      value: filtro.actualizacion,
      onChange: (v) => cambiar({ actualizacion: v as FiltroIngredientes["actualizacion"] }),
    },
  ]
  if (unidades.length > 1) {
    grupos.push({
      id: "unidad",
      label: "Unidad",
      options: unidades.map((u) => ({ value: u, label: UNIDADES[u] ?? "Otra unidad" })),
      value: filtro.unidad,
      onChange: (v) => cambiar({ unidad: v }),
    })
  }
  if (hayNegocio && hayBanco) {
    grupos.push({
      id: "origen",
      label: "Origen",
      options: [
        { value: "banco", label: "Creados por la plataforma" },
        { value: "negocio", label: "Compartidos por un negocio" },
      ],
      value: filtro.origen,
      onChange: (v) => cambiar({ origen: v as FiltroIngredientes["origen"] }),
    })
  }

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
      vista.items.forEach((i) => (marcar ? n.add(i.id) : n.delete(i.id)))
      return n
    })
  }

  // ── Exportar ──
  function exportar(lista: Ingrediente[]) {
    descargarCsv(
      `ingredientes-banco-${fechaParaArchivo()}.csv`,
      construirCsv(
        ["nombre", "costo", "peso_gramos"],
        lista.map((i) => [i.name, parseFloat(i.costPerUnit), parseFloat(i.weightGrams)])
      )
    )
    toast.success(`${lista.length} ${lista.length === 1 ? "ingrediente exportado" : "ingredientes exportados"}`)
  }

  // ── Eliminar (uno o varios) ──
  async function eliminar(objetivos: Ingrediente[]) {
    if (objetivos.length === 0) return
    const enRecetas = usos ? objetivos.filter((o) => (usos.ingredientes.get(o.id) ?? 0) > 0) : []
    const totalUsos = usos ? objetivos.reduce((s, o) => s + (usos.ingredientes.get(o.id) ?? 0), 0) : 0
    const aviso = !usos
      ? "Aún no se terminó de revisar qué recetas los usan; si alguna los usa, quedará sin ese ingrediente."
      : enRecetas.length > 0
      ? `${enRecetas.length === 1 ? "Se usa" : `${enRecetas.length} se usan`} en ${totalUsos} ${totalUsos === 1 ? "línea de receta" : "líneas de recetas"} del banco: esas recetas quedarán sin ese componente y su costo bajará.`
      : "Ninguna receta del banco los usa."
    const ok = await confirm({
      title: objetivos.length === 1 ? "Eliminar ingrediente del banco" : `Eliminar ${objetivos.length} ingredientes del banco`,
      itemName: objetivos.length === 1 ? displayName(objetivos[0].name) : `${objetivos.length} ingredientes seleccionados`,
      description: `${aviso} Esta acción no se puede deshacer y queda registrada en la auditoría. Los negocios que ya importaron recetas conservan sus propias copias.`,
      confirmLabel: objetivos.length === 1 ? "Eliminar" : `Eliminar ${objetivos.length}`,
      variant: "danger",
    })
    if (!ok) return
    setEliminando(true)
    const r = await ejecutarEnLote(objetivos, (o) => bancoDeleteIngredient(o.id), undefined, (e) => friendlyError(e, "Error al eliminar."))
    setEliminando(false)
    await banco.recargarTodo()
    setSeleccion((s) => {
      const n = new Set(s)
      r.hechos.forEach((o) => n.delete(o.id))
      return n
    })
    if (r.hechos.length > 0) {
      toast.success(r.hechos.length === 1 ? "Ingrediente eliminado del banco" : `${r.hechos.length} ingredientes eliminados del banco`)
    }
    if (r.fallidos.length > 0) {
      toast.error(`No se pudo eliminar ${r.fallidos.length} ${r.fallidos.length === 1 ? "ingrediente" : "ingredientes"}`, {
        description: r.fallidos[0].motivo,
      })
    }
  }

  const seleccionados = (ingredientes ?? []).filter((i) => seleccion.has(i.id))

  const columnas: BancoColumn<Ingrediente>[] = [
    {
      label: "Ingrediente",
      width: "minmax(0,1fr)",
      render: (i) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold" style={{ color: "var(--text-primary)" }} title={i.name}>{displayName(i.name)}</span>
          <Avisos problemas={problemasDeIngrediente(i)} />
        </span>
      ),
    },
    { label: "Costo por gramo", width: "9rem", align: "right", strong: true, render: (i) => formatPerGram(i.costPerGram) },
    { label: "Costo de compra", width: "8rem", align: "right", render: (i) => formatCOP(i.costPerUnit) },
    { label: "Peso de compra", width: "7rem", align: "right", render: (i) => formatGrams(i.weightGrams) },
    {
      label: "En recetas",
      width: "6rem",
      align: "right",
      render: (i) => (usos ? usos.ingredientes.get(i.id) ?? 0 : "…"),
    },
    { label: "Modificado", width: "8rem", render: (i) => haceFecha(i.updatedAt) ?? "—" },
  ]

  function acciones(i: Ingrediente) {
    return (
      <>
        {canCreate && (
          <AccionFila
            label={`Duplicar ${displayName(i.name)}`}
            onClick={() => setFormulario({ editando: null, plantilla: { name: `${i.name} (copia)`, costPerUnit: i.costPerUnit, weightGrams: i.weightGrams } })}
          >
            <Copy size={15} />
          </AccionFila>
        )}
        {canUpdate && (
          <AccionFila label={`Editar ${displayName(i.name)}`} onClick={() => setFormulario({ editando: i })}>
            <Pencil size={15} />
          </AccionFila>
        )}
        {canDelete && (
          <AccionFila label={`Eliminar ${displayName(i.name)}`} peligro onClick={() => void eliminar([i])}>
            <Trash2 size={15} />
          </AccionFila>
        )}
      </>
    )
  }

  const hayFiltros = !!filtro.busqueda || !!filtro.problema || !!filtro.unidad || !!filtro.origen || !!filtro.actualizacion

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Ingredientes del banco"
        subtitle={
          ingredientes
            ? `${ingredientes.length.toLocaleString("es-CO")} ingredientes que los negocios pueden usar en sus recetas.`
            : "Cargando el banco…"
        }
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => exportar(filtrados)} disabled={filtrados.length === 0}>
              <Download size={15} aria-hidden="true" /> <span className="hidden sm:inline">Exportar</span>
            </Button>
            {canCreate && (
              <Button variant="ghost" onClick={() => setImportando(true)} disabled={!ingredientes}>
                <Upload size={15} aria-hidden="true" /> <span className="hidden sm:inline">Importar</span>
              </Button>
            )}
            {canCreate && (
              <Button variant="primary" onClick={() => setFormulario({ editando: null })}>
                <Plus size={16} aria-hidden="true" /> <span className="hidden sm:inline">Nuevo ingrediente</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            )}
          </div>
        }
      />

      <SincronizarPrecios ingredientes={ingredientes} puedeActualizar={canUpdate} recargar={banco.recargarIngredientes} />

      {ingredientes && <PanelCalidad chequeos={chequeos} revisando={banco.revisando} />}

      {banco.error ? (
        <ErrorState
          title="No pudimos cargar el banco"
          description="Revisa tu conexión e inténtalo de nuevo."
          onRetry={() => void banco.recargarTodo()}
        />
      ) : (
        <>
          <BancoToolbar
            busquedaInicial={filtro.busqueda}
            claveBusqueda={claveBusqueda}
            placeholder="Buscar ingrediente"
            etiquetaBusqueda="Buscar ingrediente por nombre"
            onBusqueda={(v) => cambiar({ busqueda: v })}
            grupos={grupos}
            orden={filtro.orden}
            opcionesOrden={ORDENES}
            onOrden={(o) => cambiar({ orden: o })}
          />

          {banco.cargando ? (
            <div className="animate-pulse overflow-hidden" aria-busy="true" aria-label="Cargando ingredientes" style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)" }}>
              {Array.from({ length: 8 }).map((_, k) => (
                <div key={k} className="px-5 py-4"><div className="h-3.5 rounded-md" style={{ width: `${40 + ((k * 17) % 30)}%`, background: "var(--bg-secondary)" }} /></div>
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <EmptyState
              icon={<Carrot size={36} />}
              title={hayFiltros ? "Ningún ingrediente coincide" : "El banco todavía no tiene ingredientes"}
              description={hayFiltros ? "Prueba con otra búsqueda o quita algún filtro." : "Crea el primero o importa una lista desde un archivo CSV."}
              action={hayFiltros ? <Button variant="ghost" size="sm" onClick={limpiarFiltros}>Ver todos los ingredientes</Button> : undefined}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <BancoTable
                rows={vista.items}
                rowKey={(i) => i.id}
                columns={columnas}
                seleccion={canDelete ? seleccion : undefined}
                onToggle={canDelete ? alternar : undefined}
                onToggleTodas={canDelete ? alternarPagina : undefined}
                actions={acciones}
                actionsWidth="7.5rem"
                ariaLabel="Ingredientes del banco"
                rowLabel={(i) => displayName(i.name)}
                mobile={(i) => (
                  <div className="flex flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-1.5 text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      {displayName(i.name)}
                      <Avisos problemas={problemasDeIngrediente(i)} />
                    </span>
                    <span className="text-[13px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {formatCOP(i.costPerUnit)} por {formatGrams(i.weightGrams)} · {formatPerGram(i.costPerGram)}/g
                    </span>
                  </div>
                )}
              />
              <div className="flex items-center justify-between gap-4">
                <p className="text-[13px] tabular-nums" style={{ color: "var(--text-muted)" }} aria-live="polite">
                  {filtrados.length <= PAGE_SIZE
                    ? `${filtrados.length} ${filtrados.length === 1 ? "ingrediente" : "ingredientes"}`
                    : `${((vista.pagina - 1) * PAGE_SIZE + 1).toLocaleString("es-CO")}–${((vista.pagina - 1) * PAGE_SIZE + vista.items.length).toLocaleString("es-CO")} de ${filtrados.length.toLocaleString("es-CO")}`}
                </p>
                <Pagination currentPage={vista.pagina} totalPages={vista.paginas} onPageChange={(p) => { setPagina(p); document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" }) }} />
              </div>
            </div>
          )}
        </>
      )}

      <BarraSeleccion
        cantidad={seleccionados.length}
        singular="ingrediente"
        plural="ingredientes"
        onLimpiar={() => setSeleccion(new Set())}
        onExportar={() => exportar(seleccionados)}
        onEliminar={canDelete ? () => void eliminar(seleccionados) : undefined}
        eliminando={eliminando}
      />

      <IngredienteFormModal
        abierto={!!formulario}
        formulario={formulario ?? { editando: null }}
        existentes={ingredientes ?? []}
        onClose={() => setFormulario(null)}
        onGuardado={({ nombre, creado }) => {
          setFormulario(null)
          void banco.recargarTodo()
          toast.success(creado ? "Ingrediente creado en el banco" : "Ingrediente actualizado", { description: nombre })
        }}
      />

      <ImportarIngredientesModal
        abierto={importando}
        existentes={ingredientes ?? []}
        onClose={() => setImportando(false)}
        onTerminado={({ creados, actualizados, fallidos }) => {
          void banco.recargarTodo()
          if (creados + actualizados > 0) toast.success("Importación terminada", { description: `${creados} creados, ${actualizados} actualizados${fallidos ? `, ${fallidos} con error` : ""}.` })
        }}
      />
    </div>
  )
}

function Avisos({ problemas }: { problemas: ProblemaIngrediente[] }) {
  const visibles = problemas.filter((p) => p !== "sin_uso")
  if (visibles.length === 0) return null
  return (
    <>
      {visibles.map((p) => (
        <Aviso key={p} tono={p === "precio_bajo" ? "muted" : "warning"}>{PROBLEMA_INGREDIENTE_TEXTO[p]}</Aviso>
      ))}
    </>
  )
}
