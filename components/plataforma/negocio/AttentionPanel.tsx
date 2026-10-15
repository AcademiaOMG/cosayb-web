"use client"

import Link from "next/link"
import useSWR from "swr"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import ErrorState from "@/components/ui/ErrorState"
import { ageLabel, negocioApi, type AttentionItem, type AttentionKind } from "@/lib/plataforma/negocio"
import { fmtDate } from "@/lib/saas/format"
import { SaasError } from "@/lib/saas/types"

type Sample = AttentionItem["sample"][number]

interface Spec {
  title: (i: AttentionItem) => string
  why: string
  href: string
  linkLabel: string
  urgent: boolean
  detail: (s: Sample) => string
  sampleHref: (s: Sample) => string
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const SPECS: Record<AttentionKind, Spec> = {
  past_due_subscriptions: {
    title: (i) => plural(i.count, "suscripción con cobro pendiente", "suscripciones con cobro pendiente"),
    why: "El último cobro falló; si no se resuelve, el negocio pierde el plan de pago.",
    href: "/plataforma/suscripciones?status=past_due",
    linkLabel: "Ver suscripciones",
    urgent: true,
    detail: (s) => `${plural(Number(s.detail ?? 1), "intento fallido", "intentos fallidos")}${s.at ? ` · próximo reintento el ${fmtDate(s.at, "short")}` : ""}`,
    sampleHref: (s) => `/plataforma/suscripciones?abrir=${s.id}`,
  },
  failed_payments: {
    title: (i) => `${plural(i.count, "pago rechazado", "pagos rechazados")} en los últimos 7 días`,
    why: "Un cobro no pasó. Revisa el motivo para ayudar al cliente a corregirlo.",
    href: "/plataforma/pagos?status=failed",
    linkLabel: "Ver pagos rechazados",
    urgent: true,
    detail: (s) => (s.at ? fmtDate(s.at, "short") : ""),
    sampleHref: (s) => `/plataforma/pagos?abrir=${s.id}`,
  },
  tickets_open: {
    title: (i) => `${plural(i.count, "ticket sin atender", "tickets sin atender")}${i.overdue ? ` · ${i.overdue} fuera de plazo` : ""}`,
    why: "Clientes esperando una primera respuesta.",
    href: "/plataforma/soporte?status=open",
    linkLabel: "Abrir la bandeja",
    urgent: false,
    detail: (s) => (s.at ? `esperando hace ${ageLabel((Date.now() - new Date(s.at).getTime()) / 3_600_000)}` : ""),
    sampleHref: (s) => `/plataforma/soporte?abrir=${s.id}`,
  },
  trials_ending: {
    title: (i) => `${plural(i.count, "prueba gratis termina", "pruebas gratis terminan")} esta semana`,
    why: "Buen momento para escribirles antes de que pasen al plan gratuito.",
    href: "/plataforma/organizaciones",
    linkLabel: "Ver negocios",
    urgent: false,
    detail: (s) => (s.at ? `termina el ${fmtDate(s.at, "short")}` : ""),
    sampleHref: (s) => `/plataforma/organizaciones/${s.organizationId ?? s.id}`,
  },
  scheduled_cancellations: {
    title: (i) => plural(i.count, "cancelación programada", "cancelaciones programadas"),
    why: "Estos clientes ya pidieron irse al terminar su periodo. Aún hay tiempo de retenerlos.",
    href: "/plataforma/suscripciones?status=active",
    linkLabel: "Ver suscripciones",
    urgent: false,
    detail: (s) => (s.at ? `termina el ${fmtDate(s.at, "short")}` : ""),
    sampleHref: (s) => `/plataforma/suscripciones?abrir=${s.id}`,
  },
}

const ORDER: AttentionKind[] = ["past_due_subscriptions", "failed_payments", "tickets_open", "trials_ending", "scheduled_cancellations"]

export default function AttentionPanel() {
  const { data, error, mutate } = useSWR("negocio-atencion", () => negocioApi.atencion(), { revalidateOnFocus: false })
  const forbidden = error instanceof SaasError && error.code === "HTTP_403"
  const items = (data?.items ?? []).filter((i) => i.count > 0).sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))

  return (
    <section aria-labelledby="atencion-titulo" className="flex flex-col gap-3">
      <h2 id="atencion-titulo" className="text-lg font-bold console-title">Requiere tu atención</h2>
      {error ? (
        forbidden ? (
          <p className="text-sm console-muted">Tu rol no incluye estos avisos.</p>
        ) : (
          <ErrorState title="No pudimos cargar los pendientes" onRetry={() => mutate()} />
        )
      ) : !data ? (
        <div className="console-card animate-pulse" style={{ height: 90 }} />
      ) : items.length === 0 ? (
        <div className="console-card flex items-center gap-3">
          <CheckCircle2 size={22} aria-hidden="true" style={{ color: "#047857" }} />
          <p className="text-sm console-title">Todo al día: no hay cobros fallidos, tickets sin atender ni cancelaciones por revisar.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {items.map((it) => {
            const s = SPECS[it.kind]
            return (
              <li key={it.kind} className="console-card flex flex-col gap-2" style={s.urgent ? { borderColor: "#B45309" } : undefined}>
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} aria-hidden="true" className="shrink-0 mt-0.5" style={{ color: s.urgent ? "#B45309" : "var(--text-muted)" }} />
                  <div>
                    <p className="text-sm font-semibold console-title">{s.title(it)}</p>
                    <p className="text-xs console-muted">{s.why}</p>
                  </div>
                </div>
                <ul className="flex flex-col gap-1 pl-6">
                  {it.sample.map((x) => (
                    <li key={x.id} className="text-xs">
                      <Link href={s.sampleHref(x)} className="console-accent underline">{x.title}</Link>
                      <span className="console-muted"> · {s.detail(x)}</span>
                    </li>
                  ))}
                  {it.count > it.sample.length && <li className="text-xs console-muted">y {it.count - it.sample.length} más…</li>}
                </ul>
                <Link href={s.href} className="text-sm font-medium console-accent underline pl-6">{s.linkLabel}</Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
