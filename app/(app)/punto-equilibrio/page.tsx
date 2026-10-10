"use client"

import useSWR from "swr"
import { useState, useEffect } from "react"
import {
  BarChart2, Plus, Download, Eye, Pencil, Printer, CalendarDays,
  Calculator, History, CheckCircle2, AlertCircle, X,
} from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import IndicatorPill from "@/components/ui/IndicatorPill"
import { scrollMainToTop } from "@/components/calculator/scrollMainToTop"
import EmptyState from "@/components/ui/EmptyState"
import Table from "@/components/ui/Table"
import { indicatorFromMC } from "@/lib/indicator"
import type { BreakEvenRecord } from "@/types/domain"
import { createBreakEven, getBreakEvenHistory, exportBreakEvenExcel } from "@/lib/api"
import { useHelpAvailable } from "@/hooks/useHelpAvailable"
import { usePermissions } from "@/hooks/usePermissions"
import ModuleLocked from "@/components/app/ModuleLocked"
import { perDay } from "@/lib/calculator/breakEven"
import { formatCOP, formatNumber } from "@/lib/calculator/format"
import BreakEvenCalculator, { type BreakEvenSubmitData } from "./BreakEvenCalculator"
import BreakEvenFicha from "./BreakEvenFicha"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/** Cifras por día (30 días, como el Excel): se calculan en el cliente, la API no las guarda. */
function dailyOf(record: BreakEvenRecord) {
  return {
    unitsPerDay: perDay(record.breakEvenUnits),
    revenuePerDay: perDay(record.breakEvenRevenue),
  }
}

/** Margen de contribución % (0–100) — base del semáforo (espejo PO 68/63). */
function mcPctOf(record: Pick<BreakEvenRecord, "contributionMargin" | "salePrice">) {
  return (record.contributionMargin / record.salePrice) * 100
}

function printRecord(record: BreakEvenRecord) {
  const { unitsPerDay, revenuePerDay } = dailyOf(record)
  const rows = record.fixedCosts
    .map((c) => `<tr><td>${escapeHtml(c.name)}</td><td style="text-align:right">${formatCOP(c.amount)}</td></tr>`)
    .join("")
  const w = window.open("", "_blank")
  if (!w) {
    alert("Tu navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para este sitio e inténtalo de nuevo.")
    return
  }
  w.document.write(`
    <html><head><meta charset="utf-8"><title>Punto de equilibrio — ${formatDate(record.createdAt)}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:24px;max-width:640px;margin:0 auto}
      h1{font-size:18px} p{color:#666;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px}
      th,td{padding:8px 10px;border-bottom:1px solid #ddd;text-align:left}
      tfoot td{font-weight:bold;border-top:2px solid #333}
      .result{margin-top:20px;padding:16px;background:#F0F9FF;border-radius:8px}
      .result strong{font-size:20px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
      .grid div{padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px}
      .grid b{display:block;font-size:15px;margin-top:2px}
    </style></head><body>
    <h1>Punto de equilibrio</h1>
    <p>Calculado el ${formatDate(record.createdAt)}</p>
    <table>
      <thead><tr><th>Costo fijo</th><th style="text-align:right">Monto</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td>Total costos fijos</td><td style="text-align:right">${formatCOP(record.totalFixedCosts)}</td></tr></tfoot>
    </table>
    <p>Precio de venta: <strong>${formatCOP(record.salePrice)}</strong> · Costo variable: <strong>${formatCOP(record.variableCost)}</strong></p>
    <div class="result">
      <p style="margin:0 0 4px">Necesitas vender</p>
      <strong>${formatNumber(record.breakEvenUnits)} unidades al mes</strong>
      <p style="margin:8px 0 0">Equivalen a ${formatCOP(record.breakEvenRevenue)} en ventas al mes.</p>
      <div class="grid">
        <div>Unidades al mes<b>${formatNumber(record.breakEvenUnits)}</b></div>
        <div>Unidades al día<b>${formatNumber(unitsPerDay)}</b></div>
        <div>Venta al mes<b>${formatCOP(record.breakEvenRevenue)}</b></div>
        <div>Venta al día<b>${formatCOP(revenuePerDay)}</b></div>
      </div>
    </div>
    </body></html>`)
  w.document.close()
  w.print()
}

// ─── Skeleton de historial ────────────────────────────────────────────────────
function HistorySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-5 animate-pulse flex flex-col gap-3"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
        >
          <div className="h-3 w-1/3 rounded" style={{ background: "var(--bg-secondary)" }} />
          <div className="h-8 w-2/3 rounded" style={{ background: "var(--bg-secondary)" }} />
          <div className="h-3 w-1/2 rounded" style={{ background: "var(--bg-secondary)" }} />
          <div className="h-12 rounded-xl" style={{ background: "var(--bg-secondary)" }} />
        </div>
      ))}
    </div>
  )
}

// ─── Tabla del historial (mismo patrón que el historial de Menús) ─────────────
function HistoryTable({
  records,
  onView,
  onReuse,
}: {
  records: BreakEvenRecord[]
  onView: (r: BreakEvenRecord) => void
  onReuse: (r: BreakEvenRecord) => void
}) {
  const money = (v: unknown) => (
    <span className="tabular-nums text-sm" style={{ color: "var(--text-secondary)" }}>{formatCOP(v as number)}</span>
  )
  return (
    <Table
      rowKey="id"
      data={records as unknown as Record<string, unknown>[]}
      onRowClick={(row) => onView(row as unknown as BreakEvenRecord)}
      columns={[
        {
          key: "createdAt",
          label: "Fecha",
          render: (v) => (
            <div className="flex items-center gap-1.5 font-medium" style={{ color: "var(--text-primary)" }}>
              <CalendarDays size={13} style={{ color: "var(--text-muted)" }} />
              {formatDate(v as string)}
            </div>
          ),
        },
        {
          key: "breakEvenUnits",
          label: "Unidades al mes",
          render: (v) => (
            <span className="tabular-nums text-sm font-semibold" style={{ color: "var(--accent-text)" }}>
              {formatNumber(v as number)}
            </span>
          ),
        },
        { key: "totalFixedCosts", label: "Costos fijos", render: money },
        { key: "salePrice", label: "Precio de venta", render: money },
        { key: "variableCost", label: "Costo variable", render: money },
        {
          key: "contributionMargin",
          label: "Indicador",
          render: (_v, row) => <IndicatorPill indicator={indicatorFromMC(mcPctOf(row as unknown as BreakEvenRecord))} />,
        },
        {
          key: "id",
          label: "",
          render: (_v, row) => {
            const record = row as unknown as BreakEvenRecord
            return (
              <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onView(record)}
                  title="Ver cálculo"
                  aria-label={`Ver cálculo del ${formatDate(record.createdAt)}`}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Eye size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onReuse(record)}
                  title="Usar como base para un nuevo cálculo"
                  aria-label={`Reutilizar el cálculo del ${formatDate(record.createdAt)}`}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Pencil size={14} />
                </button>
              </div>
            )
          },
        },
      ]}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISTA NUEVO CÁLCULO (la calculadora; opcionalmente parte de uno anterior)
// ═══════════════════════════════════════════════════════════════════════════════
function CalculatorView({
  initialRecord,
  onBack,
  onSaved,
  onDirtyChange,
}: {
  /** Solo viene de "Reutilizar": un cálculo nuevo siempre arranca en blanco */
  initialRecord: BreakEvenRecord | null
  /** Cambio de pestaña: sin guardar → la página pide confirmación */
  onBack: () => void
  onSaved: () => Promise<void>
  onDirtyChange: (dirty: boolean) => void
}) {
  async function handleSubmit(data: BreakEvenSubmitData) {
    await createBreakEven(data)
    // Ya se guardó: si refrescar el historial falla, no se muestra como error de guardado.
    try {
      await onSaved()
    } catch {
      /* el historial se vuelve a pedir al entrar a la lista */
    }
  }

  return (
    <BreakEvenCalculator
      initialRecord={initialRecord}
      onSubmit={handleSubmit}
      onDone={onBack}
      onDirtyChange={onDirtyChange}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
type PageView = "list" | "calculator"

export default function PuntoEquilibrioPage() {
  useHelpAvailable()
  const { hasFeature, featureLockedMessage, isLoading: permsLoading } = usePermissions()

  const { data: history = [], isLoading, error, mutate } = useSWR(
    "break-even-history",
    () => getBreakEvenHistory().then((r) => r.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  // Al abrir, la pestaña inicial es la Calculadora (en blanco); el Historial solo al elegirlo.
  const [view, setView] = useState<PageView>("calculator")
  // Base de "Reutilizar"; null = cálculo nuevo en blanco
  const [reuseRecord, setReuseRecord] = useState<BreakEvenRecord | null>(null)
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null)
  const [viewingRecord, setViewingRecord] = useState<BreakEvenRecord | null>(null)
  const [exporting, setExporting] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  // Datos escritos sin guardar en la calculadora + confirmación de salida
  const [calcDirty, setCalcDirty] = useState(false)
  const [exitConfirm, setExitConfirm] = useState(false)

  useEffect(() => {
    function handleHelp() { setHelpOpen(true) }
    window.addEventListener("open-help", handleHelp)
    return () => window.removeEventListener("open-help", handleHelp)
  }, [])

  /** Cambio de pestaña: salir de la calculadora con datos sin guardar pide confirmación. */
  function switchView(next: PageView) {
    if (next === view) return
    if (next === "list" && calcDirty) {
      setExitConfirm(true)
      return
    }
    if (next === "calculator") setCalcDirty(false)
    setExitConfirm(false)
    setView(next)
    scrollMainToTop()
  }

  /** Salida aceptada de la calculadora (tras guardar o con la confirmación visible). */
  function backToHistory() {
    setCalcDirty(false)
    setExitConfirm(false)
    setView("list")
    scrollMainToTop()
  }

  function openCreate() {
    // Un cálculo nuevo siempre empieza en blanco: nada se precarga del historial.
    setReuseRecord(null)
    setNotice(null)
    switchView("calculator")
  }

  function openReuse(record: BreakEvenRecord) {
    setReuseRecord(record)
    setNotice(null)
    setViewingRecord(null)
    switchView("calculator")
  }

  const handleSaved = async () => {
    setNotice({ text: "Guardamos tu cálculo. Aparece primero en la lista.", tone: "ok" })
    await mutate()
  }

  const handleExport = async () => {
    setNotice(null)
    // La feature "exports" está deshabilitada en el plan free: avisar sin pedir la descarga.
    if (!hasFeature("exports")) {
      setNotice({
        text: "Exportar a Excel no está incluido en tu membresía actual. Revisa tu plan en Ajustes.",
        tone: "error",
      })
      return
    }
    setExporting(true)
    try {
      const blob = await exportBreakEvenExcel()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `punto-equilibrio-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice({ text: "Excel descargado: revisa la carpeta de descargas de tu equipo.", tone: "ok" })
    } catch (err) {
      setNotice({
        text:
          err instanceof Error && err.message
            ? err.message
            : "No se pudo exportar el historial. Inténtalo de nuevo.",
        tone: "error",
      })
    } finally {
      setExporting(false)
    }
  }

  // Mientras cargan los permisos no se sabe si el módulo está habilitado —
  // no mostrar "módulo bloqueado" por un instante a quien sí lo tiene.
  if (permsLoading) return null

  if (!hasFeature("module_breakEven")) {
    return <ModuleLocked message={featureLockedMessage("module_breakEven")} />
  }

  // La ayuda debe abrir también dentro de la calculadora (el botón de la app sigue visible).
  const helpModal = (
    <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Punto de Equilibrio" blur>
      <div className="flex flex-col gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
        <p>Esta sección es una calculadora que te dice cuántas unidades necesitas vender para cubrir todos tus costos.</p>

        <div>
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Cómo usarla:</p>
          <ul className="flex flex-col gap-2 ml-1">
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Calculadora:</strong> en las pestañas del encabezado toca &quot;Calculadora&quot; para abrir la calculadora. Cada cálculo nuevo empieza en blanco; para partir de uno anterior, usa &quot;Reutilizar&quot; en el historial. Toca un dato y escribe con el teclado de la pantalla o el de tu computador; lo que escribas reemplaza el valor anterior. &quot;Limpiar&quot; borra todo (hay que tocarlo dos veces).</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Paso 1, costos fijos:</strong> escribe el nombre del gasto (arriendo, sueldos, agua, energía, gas, teléfonos, marketing digital, impuestos u otros), teclea cuánto pagas al mes y pulsa &quot;Agregar a la lista&quot;. El costo aparece en la lista de la derecha y el total se suma solo.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Paso 2, tu producto:</strong> el precio de venta y el costo variable (lo que cuestan sus insumos) de una unidad.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Calcular:</strong> abre el resultado en una ventana: unidades y venta necesarias por mes y por día, y cómo se calculan. Desde ahí guardas el cálculo.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Historial:</strong> en la pestaña &quot;Historial&quot; consulta tus cálculos anteriores, reutilízalos como base, imprímelos o expórtalos a Excel.</span>
            </li>
          </ul>
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          <strong>Nota:</strong> el punto de equilibrio es la cantidad desde la cual dejas de perder y empiezas a ganar. Los cálculos por día usan 30 días al mes.
        </p>
      </div>
    </Modal>
  )

  const viewing = viewingRecord
  const viewingDaily = viewing ? dailyOf(viewing) : null

  const tabStyle = (active: boolean): React.CSSProperties => ({
    borderRadius: "var(--radius-sm)",
    ...(active
      ? { background: "var(--bg-surface)", color: "var(--text-primary)", boxShadow: "var(--shadow-sm)" }
      : { color: "var(--text-muted)" }),
  })

  // ── Vista única: el encabezado con pestañas permanece en ambas vistas ──
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Punto de Equilibrio"
        subtitle="Calcula cuántas unidades necesitas vender para cubrir todos tus costos"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {view === "list" && history.length > 0 && (
              <Button variant="ghost" onClick={handleExport} loading={exporting} disabled={exporting}>
                <Download size={15} />
                Exportar Excel
              </Button>
            )}
            {/* Pestañas de vista — mismo patrón que el módulo de Valoración */}
            <div
              className="hidden sm:flex items-center gap-1 p-1 shrink-0"
              style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}
            >
              <button
                type="button"
                onClick={() => { if (view === "list") openCreate() }}
                className="px-3 py-1.5 text-sm font-medium transition-colors"
                style={tabStyle(view === "calculator")}
              >
                Calculadora
              </button>
              <button
                type="button"
                onClick={() => switchView("list")}
                className="px-3 py-1.5 text-sm font-medium transition-colors"
                style={tabStyle(view === "list")}
              >
                Historial
              </button>
            </div>
            <button
              type="button"
              onClick={() => (view === "calculator" ? switchView("list") : openCreate())}
              className="sm:hidden flex items-center gap-1.5 h-10 px-3.5 text-sm font-semibold shrink-0"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {view === "calculator" ? (
                <>
                  <History size={16} style={{ color: "var(--text-muted)" }} />
                  Historial
                </>
              ) : (
                <>
                  <Calculator size={16} style={{ color: "var(--text-muted)" }} />
                  Calculadora
                </>
              )}
            </button>
          </div>
        }
      />

      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={
            notice.tone === "ok"
              ? { background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534" }
              : { background: "#FEF2F2", border: "1px solid #FECACA", color: "#B42020" }
          }
        >
          {notice.tone === "ok" ? (
            <CheckCircle2 size={16} className="shrink-0" />
          ) : (
            <AlertCircle size={16} className="shrink-0" />
          )}
          <span className="flex-1">{notice.text}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setNotice(null)}
            className="shrink-0 rounded p-0.5 hover:opacity-70"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {view === "calculator" && exitConfirm && (
        <div
          role="alertdialog"
          aria-label="Salir sin guardar"
          className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}
        >
          <p className="text-sm flex-1">Lo que escribiste no se ha guardado y se perderá si sales.</p>
          <div className="flex gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => setExitConfirm(false)}
              className="h-9 px-3 rounded-lg text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Seguir editando
            </button>
            <button
              type="button"
              onClick={backToHistory}
              className="h-9 px-3 rounded-lg text-sm font-semibold"
              style={{ background: "transparent", color: "#92400E", border: "1px solid #FDE68A" }}
            >
              Salir sin guardar
            </button>
          </div>
        </div>
      )}

      {view === "calculator" ? (
        <CalculatorView
          // Reiniciar la calculadora al cambiar de base (nuevo / reutilizar)
          key={reuseRecord?.id ?? "new"}
          initialRecord={reuseRecord}
          onBack={backToHistory}
          onSaved={handleSaved}
          onDirtyChange={setCalcDirty}
        />
      ) : (
        <>
          {isLoading && <HistorySkeleton />}

      {!isLoading && error && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)", marginBottom: "12px" }}>
            No se pudieron cargar los cálculos.
          </p>
          <Button variant="ghost" onClick={() => void mutate()}>Reintentar</Button>
        </div>
      )}

      {!isLoading && !error && history.length === 0 && (
        <EmptyState
          icon={<BarChart2 size={40} style={{ color: "var(--accent)" }} />}
          title="Aún no tienes cálculos"
          description="Anota tus costos fijos del mes y lo que cuesta y vale tu producto: la calculadora te dice cuántas unidades vender, por mes y por día, para empezar a ganar."
          action={
            <Button variant="primary" onClick={openCreate}>
              <Plus size={14} />
              Calcular tu primer punto de equilibrio
            </Button>
          }
        />
      )}

      {!isLoading && !error && history.length > 0 && (
        <HistoryTable
          records={history}
          onView={(r) => setViewingRecord(r)}
          onReuse={(r) => openReuse(r)}
        />
      )}
        </>
      )}

      {helpModal}

      {/* ── Modal: ver cálculo (solo lectura, mismo patrón que Ver menú) ───── */}
      <Modal
        open={!!viewing}
        onClose={() => setViewingRecord(null)}
        title="Cálculo de punto de equilibrio"
        wide
        blur
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <Button variant="ghost" className="w-full sm:w-auto" onClick={() => viewing && printRecord(viewing)}>
              <Printer size={14} />
              Imprimir
            </Button>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
              <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setViewingRecord(null)}>Cerrar</Button>
              <Button variant="primary" className="w-full sm:w-auto" onClick={() => viewing && openReuse(viewing)}>
                <Pencil size={14} />
                Reutilizar
              </Button>
            </div>
          </div>
        }
      >
        {viewing && viewingDaily && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <CalendarDays size={14} />
              <span>Calculado el <strong style={{ color: "var(--text-secondary)" }}>{formatDate(viewing.createdAt)}</strong></span>
            </div>
            <BreakEvenFicha
              data={{
                unitsPerMonth: viewing.breakEvenUnits,
                unitsPerDay: viewingDaily.unitsPerDay,
                revenuePerMonth: viewing.breakEvenRevenue,
                revenuePerDay: viewingDaily.revenuePerDay,
                fixedTotal: viewing.totalFixedCosts,
                salePrice: viewing.salePrice,
                variableCost: viewing.variableCost,
                contributionMargin: viewing.contributionMargin,
                fixedCosts: viewing.fixedCosts,
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
