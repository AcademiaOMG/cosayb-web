"use client"

import Link from "next/link"
import { use } from "react"
import { ArrowLeft, Download, Printer } from "lucide-react"
import Button from "@/components/ui/Button"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import EmptyState from "@/components/ui/EmptyState"
import { InvoiceStatusBadge } from "@/components/saas/StatusBadge"
import { downloadJson } from "@/lib/saas/accountExport"
import { fmtDate, formatCOP } from "@/lib/saas/format"
import { useInvoices } from "@/lib/saas/hooks"
import { usePermissions } from "@/hooks/usePermissions"

/** Recibo imprimible (Imprimir → Guardar como PDF). */
export default function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: invoices, error, mutate } = useInvoices()
  const { organization } = usePermissions()

  if (error) return <ErrorState title="No pudimos cargar el recibo" onRetry={() => mutate()} />
  if (!invoices) return <LoadingBlock label="Cargando recibo…" />
  const invoice = invoices.find((i) => i.id === id)
  if (!invoice) {
    return (
      <EmptyState
        title="No encontramos esa factura"
        description="Puede que el enlace sea antiguo o que no pertenezca a esta organización."
        action={<Link href="/configuracion/facturacion"><Button size="sm">Volver a facturación</Button></Link>}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href="/configuracion/facturacion" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={14} aria-hidden="true" /> Volver a facturación
        </Link>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => downloadJson(`${invoice.number}.json`, invoice)}>
            <Download size={14} aria-hidden="true" /> JSON
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer size={14} aria-hidden="true" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      <article
        className="p-6 sm:p-8 flex flex-col gap-6 print:shadow-none"
        style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}
        aria-label={`Recibo ${invoice.number}`}
      >
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-2xl font-bold" style={{ color: "var(--text-primary)" }}>CO$AYB</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Academia OMG · Colombia</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>RECIBO</p>
            <p className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>{invoice.number}</p>
            <div className="mt-1 print:hidden"><InvoiceStatusBadge status={invoice.status} /></div>
          </div>
        </header>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Field k="Fecha de emisión" v={fmtDate(invoice.issuedAt)} />
          <Field k="Facturado a" v={organization?.name ?? "—"} />
          <Field k="Periodo" v={invoice.periodStart ? `${fmtDate(invoice.periodStart, "short")} – ${fmtDate(invoice.periodEnd, "short")}` : "—"} />
          <Field k="Método de pago" v={invoice.paymentMethodLabel} />
          <Field k="Estado" v={{ paid: "Pagada", open: "Pendiente", failed: "Fallida", refunded: "Reembolsada" }[invoice.status]} />
        </dl>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)" }}>
              <th className="py-2 font-medium">Concepto</th>
              <th className="py-2 font-medium text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ color: "var(--text-primary)" }}>
              <td className="py-3">{invoice.description}</td>
              <td className="py-3 text-right">{formatCOP(invoice.amount)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ color: "var(--text-secondary)" }}>
              <td className="pt-2 text-right">Impuestos</td>
              <td className="pt-2 text-right">{formatCOP(invoice.tax)}</td>
            </tr>
            <tr style={{ color: "var(--text-primary)" }}>
              <td className="pt-2 text-right font-bold">Total ({invoice.currency})</td>
              <td className="pt-2 text-right font-bold">{formatCOP(invoice.total)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Comprobante de pago simulado. No constituye factura electrónica DIAN.
        </p>
      </article>
    </div>
  )
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs" style={{ color: "var(--text-muted)" }}>{k}</dt>
      <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{v}</dd>
    </div>
  )
}
