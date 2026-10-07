"use client"

import useSWR from "swr"
import { useState, useEffect } from "react"
import {
  BarChart2, Plus, Download, Eye, Pencil, Printer, Receipt, Wallet, CalendarDays, Layers,
} from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { CalcViewShell } from "@/components/calculator"
import EmptyState from "@/components/ui/EmptyState"
import { RatioRow, COLOR_FIXED, COLOR_PROFIT } from "@/components/ui/RatioDonut"
import InfoStat from "@/components/ui/InfoStat"
import type { BreakEvenRecord } from "@/types/domain"
import { createBreakEven, getBreakEvenHistory, exportBreakEvenExcel } from "@/lib/api"
import { useHelpAvailable } from "@/hooks/useHelpAvailable"
import { usePermissions } from "@/hooks/usePermissions"
import ModuleLocked from "@/components/app/ModuleLocked"
import { perDay } from "@/lib/calculator/breakEven"
import { formatCOP, formatNumber } from "@/lib/calculator/format"
import BreakEvenCalculator, { type BreakEvenSubmitData } from "./BreakEvenCalculator"

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

// ─── Tarjeta del historial ────────────────────────────────────────────────────
function HistoryCard({
  record,
  onView,
  onReuse,
}: {
  record: BreakEvenRecord
  onView: () => void
  onReuse: () => void
}) {
  const { unitsPerDay } = dailyOf(record)
  return (
    <article
      className="rounded-2xl p-5 flex flex-col gap-4 transition-shadow hover:shadow-md"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}
    >
      <button
        type="button"
        onClick={onView}
        className="flex flex-col gap-1 text-left min-w-0"
        aria-label={`Ver cálculo del ${formatDate(record.createdAt)}`}
      >
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <CalendarDays size={12} />
          {formatDate(record.createdAt)}
        </span>
        <span className="text-3xl font-bold tabular-nums leading-tight" style={{ color: "var(--accent-text)" }}>
          {formatNumber(record.breakEvenUnits)}
          <span className="text-sm font-medium ml-1.5" style={{ color: "var(--text-muted)" }}>unidades al mes</span>
        </span>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {formatNumber(unitsPerDay)} al día · {formatCOP(record.breakEvenRevenue)} en ventas al mes
        </span>
      </button>

      <dl
        className="grid grid-cols-3 gap-2 rounded-xl p-3 text-xs"
        style={{ background: "var(--bg-primary)" }}
      >
        {[
          ["Costos fijos", record.totalFixedCosts],
          ["Precio", record.salePrice],
          ["Costo variable", record.variableCost],
        ].map(([label, v]) => (
          <div key={label as string} className="min-w-0">
            <dt style={{ color: "var(--text-muted)" }}>{label}</dt>
            <dd className="font-semibold tabular-nums truncate" style={{ color: "var(--text-primary)" }}>
              {formatCOP(v as number)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onView} className="flex-1">
          <Eye size={14} />
          Ver
        </Button>
        <Button variant="ghost" size="sm" onClick={onReuse} className="flex-1" title="Usar como base para un nuevo cálculo">
          <Pencil size={14} />
          Reutilizar
        </Button>
      </div>
    </article>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISTA NUEVO CÁLCULO (la calculadora; opcionalmente parte de uno anterior)
// ═══════════════════════════════════════════════════════════════════════════════
function CalculatorView({
  initialRecord,
  fixedOnly,
  onBack,
  onSaved,
}: {
  initialRecord: BreakEvenRecord | null
  /** Solo se parte de los costos fijos de ese registro (nuevo cálculo con costos recordados) */
  fixedOnly: boolean
  onBack: () => void
  onSaved: () => Promise<void>
}) {
  const [dirty, setDirty] = useState(false)

  async function handleSubmit(data: BreakEvenSubmitData) {
    await createBreakEven(data)
    // Ya se guardó: si refrescar el historial falla, no se muestra como error de guardado.
    try {
      await onSaved()
    } catch {
      /* el historial se vuelve a pedir al entrar a la lista */
    }
  }

  const when = initialRecord ? formatDate(initialRecord.createdAt) : ""
  const subtitle = !initialRecord
    ? "¿Cuánto debes vender para cubrir tus costos?"
    : fixedOnly
      ? "Tus costos fijos casi no cambian: partimos de los de tu último cálculo"
      : `Partiendo del cálculo del ${when}: se guardará como uno nuevo`

  return (
    <CalcViewShell title="Nuevo cálculo" subtitle={subtitle} backLabel="Mis cálculos" onBack={onBack} dirty={dirty}>
      <BreakEvenCalculator
        initialRecord={initialRecord}
        fixedOnly={fixedOnly}
        prefillNote={
          initialRecord && fixedOnly
            ? `Arrancamos con tus costos fijos del ${when}. Si algo cambió, toca el rubro y escribe el valor nuevo; luego completa tu producto en el paso 2.`
            : null
        }
        onSubmit={handleSubmit}
        onDone={onBack}
        onDirtyChange={setDirty}
      />
    </CalcViewShell>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
type PageView = "list" | "calculator"

export default function PuntoEquilibrioPage() {
  useHelpAvailable()
  const { hasFeature, featureLockedMessage } = usePermissions()

  const { data: history = [], isLoading, error, mutate } = useSWR(
    "break-even-history",
    () => getBreakEvenHistory().then((r) => r.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  const [view, setView] = useState<PageView>("list")
  const [reuseRecord, setReuseRecord] = useState<BreakEvenRecord | null>(null)
  // true: se parte solo de los costos fijos de reuseRecord (botón Nuevo cálculo); false: de todo (Reutilizar)
  const [fixedOnly, setFixedOnly] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [viewingRecord, setViewingRecord] = useState<BreakEvenRecord | null>(null)
  const [exporting, setExporting] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    function handleHelp() { setHelpOpen(true) }
    window.addEventListener("open-help", handleHelp)
    return () => window.removeEventListener("open-help", handleHelp)
  }, [])

  function openCreate() {
    // Los costos fijos casi no cambian de un mes a otro: arrancamos con los del último cálculo (si hay).
    const latest = history.reduce<BreakEvenRecord | null>(
      (best, r) => (!best || new Date(r.createdAt) > new Date(best.createdAt) ? r : best),
      null,
    )
    setReuseRecord(latest)
    setFixedOnly(latest !== null)
    setNotice(null)
    setView("calculator")
  }

  function openReuse(record: BreakEvenRecord) {
    setReuseRecord(record)
    setFixedOnly(false)
    setNotice(null)
    setViewingRecord(null)
    setView("calculator")
  }

  const handleExport = async () => {
    setExporting(true)
    setNotice(null)
    try {
      const blob = await exportBreakEvenExcel()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `punto-equilibrio-${Date.now()}.xlsx`
      a.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setNotice("No se pudo exportar el historial. Revisa tu conexión e inténtalo de nuevo.")
    } finally {
      setExporting(false)
    }
  }

  if (!hasFeature("module_breakEven")) {
    return <ModuleLocked message={featureLockedMessage("module_breakEven")} />
  }

  // La ayuda debe abrir también dentro de la calculadora (el botón de la app sigue visible).
  const helpModal = (
    <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Punto de Equilibrio">
      <div className="flex flex-col gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
        <p>Esta sección es una calculadora que te dice cuántas unidades necesitas vender para cubrir todos tus costos.</p>

        <div>
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Cómo usarla:</p>
          <ul className="flex flex-col gap-2 ml-1">
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Nuevo cálculo:</strong> abre la calculadora. Si ya hiciste uno, arranca con tus costos fijos de la última vez (casi no cambian): corrige solo lo que cambió, o toca &quot;Empezar en blanco&quot;. Toca un dato y escribe con el teclado de la pantalla o el de tu computador; lo que escribas reemplaza el valor anterior. &quot;Limpiar&quot; borra todo (hay que tocarlo dos veces).</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Paso 1, costos fijos:</strong> arriendo, sueldos, agua, energía, gas, teléfonos, marketing digital, impuestos y otros. Déjalos en blanco si no los pagas; el total se suma solo.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Paso 2, tu producto:</strong> el precio de venta y el costo variable (lo que cuestan sus insumos) de una unidad.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Calcular:</strong> te muestra las unidades y la venta necesarias por mes y por día. Solo entonces puedes guardar el cálculo.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Historial:</strong> consulta tus cálculos anteriores, reutilízalos como base, imprímelos o expórtalos a Excel.</span>
            </li>
          </ul>
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          <strong>Nota:</strong> el punto de equilibrio es la cantidad desde la cual dejas de perder y empiezas a ganar. Los cálculos por día usan 30 días al mes.
        </p>
      </div>
    </Modal>
  )

  // ── Vista calculadora ──
  if (view === "calculator") {
    return (
      <>
        <CalculatorView
        // Reiniciar la calculadora al cambiar de base (nuevo / reutilizar)
        key={`${reuseRecord?.id ?? "new"}-${fixedOnly}`}
        initialRecord={reuseRecord}
        fixedOnly={fixedOnly}
        onBack={() => setView("list")}
        onSaved={async () => {
          setNotice("Guardamos tu cálculo. Aparece primero en la lista.")
          await mutate()
        }}
        />
        {helpModal}
      </>
    )
  }

  const viewing = viewingRecord
  const viewingDaily = viewing ? dailyOf(viewing) : null

  // ── Vista lista (historial) ──
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Punto de Equilibrio"
        subtitle="Calcula cuántas unidades necesitas vender para cubrir todos tus costos"
        action={
          <div className="flex flex-wrap gap-2">
            {history.length > 0 && (
              <Button variant="ghost" onClick={handleExport} loading={exporting} disabled={exporting}>
                <Download size={15} />
                Exportar Excel
              </Button>
            )}
            <Button variant="primary" onClick={openCreate}>
              <Plus size={15} />
              Nuevo cálculo
            </Button>
          </div>
        }
      />

      {notice && (
        <p
          className="text-sm rounded-xl px-4 py-3"
          role="status"
          style={{ background: "var(--accent-light)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
        >
          {notice}
        </p>
      )}

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {history.map((record) => (
            <HistoryCard
              key={record.id}
              record={record}
              onView={() => setViewingRecord(record)}
              onReuse={() => openReuse(record)}
            />
          ))}
        </div>
      )}

      {helpModal}

      {/* ── Modal: ver cálculo (solo lectura) ────────────────────────────── */}
      <Modal
        open={!!viewing}
        onClose={() => setViewingRecord(null)}
        title="Cálculo de punto de equilibrio"
        footer={
          <div className="flex flex-wrap items-center justify-between w-full gap-3">
            <Button variant="ghost" onClick={() => viewing && printRecord(viewing)}>
              <Printer size={14} />
              Imprimir
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setViewingRecord(null)}>Cerrar</Button>
              <Button variant="primary" onClick={() => viewing && openReuse(viewing)}>
                <Pencil size={14} />
                Reutilizar
              </Button>
            </div>
          </div>
        }
      >
        {viewing && viewingDaily && (
          <div className="flex flex-col gap-5">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Calculado el {formatDate(viewing.createdAt)}
            </p>

            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--accent-light)", border: "1px solid var(--border-light)" }}
            >
              <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: "var(--accent-text)" }}>
                UNIDADES PARA CUBRIR TUS COSTOS
              </p>
              <p className="font-display text-4xl font-bold tabular-nums mb-1" style={{ color: "var(--text-primary)", lineHeight: 1.1 }}>
                {formatNumber(viewing.breakEvenUnits)}
                <span className="text-base font-medium ml-2" style={{ color: "var(--text-muted)" }}>al mes</span>
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {formatNumber(viewingDaily.unitsPerDay)} unidades al día
              </p>

              <div className="mt-4 pt-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border-light)" }}>
                <RatioRow
                  label="Costo variable"
                  color={COLOR_FIXED}
                  pct={(viewing.variableCost / viewing.salePrice) * 100}
                />
                <RatioRow
                  label="Margen de contribución"
                  color={COLOR_PROFIT}
                  pct={(viewing.contributionMargin / viewing.salePrice) * 100}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                VENTAS NECESARIAS
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoStat icon={<Receipt size={12} style={{ color: "var(--text-muted)" }} />} label="Venta al mes" value={formatCOP(viewing.breakEvenRevenue)} mono accent />
                <InfoStat icon={<Receipt size={12} style={{ color: "var(--text-muted)" }} />} label="Venta al día" value={formatCOP(viewingDaily.revenuePerDay)} mono />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                DATOS DEL CÁLCULO
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoStat label="Precio de venta" value={formatCOP(viewing.salePrice)} mono />
                <InfoStat label="Costo variable" value={formatCOP(viewing.variableCost)} mono />
                <InfoStat label="Margen de contribución" value={formatCOP(viewing.contributionMargin)} mono />
                <InfoStat icon={<Wallet size={12} style={{ color: "var(--text-muted)" }} />} label="Total costos fijos" value={formatCOP(viewing.totalFixedCosts)} mono accent />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers size={14} style={{ color: "var(--text-muted)" }} />
                <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                  COSTOS FIJOS ({viewing.fixedCosts.length})
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                {viewing.fixedCosts.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
                  >
                    <span className="min-w-0 break-words" style={{ color: "var(--text-primary)" }}>{c.name}</span>
                    <span className="tabular-nums font-mono font-medium shrink-0" style={{ color: "var(--text-secondary)" }}>
                      {formatCOP(c.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
