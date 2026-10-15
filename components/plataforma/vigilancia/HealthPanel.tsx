"use client"

import useSWR from "swr"
import { Database, Mail, Server } from "lucide-react"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import StatCard from "@/components/plataforma/StatCard"
import StatusPill from "@/components/plataforma/StatusPill"
import { emailProviderLabel, paymentModeLabel, systemAreaLabel } from "@/lib/plataforma/labels"
import { failureTone, latencyTone, uptimeLabel, vigilanciaApi, type SaludResponse } from "@/lib/plataforma/vigilancia"
import { timeAgoEs } from "@/lib/saas/format"

const th = "px-3 py-2 text-left text-xs font-semibold console-muted"
const td = "px-3 py-2 text-sm console-title align-top"

function Block({ title, children, pill }: { title: string; children: React.ReactNode; pill?: React.ReactNode }) {
  return (
    <section className="console-card flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold console-title">{title}</h3>
        {pill}
      </div>
      {children}
    </section>
  )
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 text-sm">
      <span className="console-muted">{label}</span>
      <span className="console-title text-right">{value}</span>
    </div>
  )
}

/** Salud del sistema: base de datos, servidor, correo, pagos, trabajos programados y errores. */
export default function HealthPanel() {
  const { data, error, mutate } = useSWR<SaludResponse>(["vigilancia", "salud"], () => vigilanciaApi.salud(), { revalidateOnFocus: false })
  if (error && !data) return <ErrorState title="No pudimos cargar la salud del sistema" onRetry={() => void mutate()} />
  if (!data) return <LoadingBlock label="Comprobando el sistema…" />

  const { database, server, email, payments, jobs, errors } = data
  const emailTone = failureTone(email.failuresLastHour, 3, 10)
  const payTone = failureTone(payments.failuresLastHour, 1, 3)
  const errTone = failureTone(errors.last15min, 5, 20)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Base de datos" value={database.ok ? "Responde" : "Sin respuesta"} icon={Database} hint={database.ok ? `${database.latencyMs} ms de respuesta` : "No se pudo consultar"} />
        <StatCard label="Tiempo en línea" value={uptimeLabel(server.uptimeSeconds)} icon={Server} hint={server.version ? `Versión ${server.version}` : "Versión no informada"} />
        <StatCard label="Correos fallidos (24 h)" value={email.failuresLast24h} icon={Mail} hint={email.lastFailureAt ? `Último ${timeAgoEs(email.lastFailureAt)}` : "Ninguno"} />
        <StatCard label="Errores del sistema (24 h)" value={errors.last24h} icon={Server} hint={`${errors.lastHour} en la última hora`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Block title="Base de datos" pill={<StatusPill tone={database.ok ? latencyTone(database.latencyMs) : "danger"}>{database.ok ? (latencyTone(database.latencyMs) === "success" ? "Rápida" : "Lenta") : "Caída"}</StatusPill>}>
          <Fact label="Estado" value={database.ok ? "Responde con normalidad" : "No responde"} />
          <Fact label="Tiempo de respuesta" value={`${database.latencyMs} ms`} />
          <Fact label="Tiempo en línea del servidor" value={uptimeLabel(server.uptimeSeconds)} />
          <Fact label="Versión" value={server.version ?? "No informada"} />
        </Block>

        <Block title="Correo" pill={<StatusPill tone={emailTone}>{emailTone === "success" ? "Sin problemas" : emailTone === "warning" ? "Con fallos" : "Muchos fallos"}</StatusPill>}>
          <Fact label="Proveedor" value={emailProviderLabel(email.provider)} />
          <Fact label="Fallos en la última hora" value={email.failuresLastHour} />
          <Fact label="Fallos en 24 horas" value={email.failuresLast24h} />
          <Fact label="Último fallo" value={email.lastFailureAt ? timeAgoEs(email.lastFailureAt) : "Ninguno"} />
          {email.provider === "console" && <p className="text-xs console-muted">En modo prueba los correos no salen de verdad: solo se muestran en los registros del servidor.</p>}
        </Block>

        <Block title="Pagos" pill={<StatusPill tone={payments.simulated ? "info" : payTone}>{payments.simulated ? "Simulado" : payTone === "success" ? "Sin problemas" : "Con fallos"}</StatusPill>}>
          <Fact label="Pasarela" value={paymentModeLabel(payments.provider)} />
          <Fact label="Avisos de la pasarela recibidos (24 h)" value={payments.webhooksLast24h.received} />
          <Fact label="Procesados / ignorados / fallidos" value={`${payments.webhooksLast24h.processed} / ${payments.webhooksLast24h.ignored} / ${payments.webhooksLast24h.failed}`} />
          <Fact label="Último aviso recibido" value={payments.lastWebhookAt ? timeAgoEs(payments.lastWebhookAt) : "Ninguno"} />
          <Fact label="Fallos procesando avisos (24 h)" value={payments.failuresLast24h} />
        </Block>

        <Block title="Trabajos programados">
          {jobs.length === 0 ? (
            <p className="text-sm console-muted">Aún no hay ejecuciones registradas. Aparecerán cuando corra el programador de tareas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className={th}>Trabajo</th><th className={th}>Última vez</th><th className={th}>Resultado</th><th className={th}>Duración</th></tr></thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.job} style={{ borderTop: "1px solid var(--border-light)" }}>
                      <td className={td}>{j.name}</td>
                      <td className={td}>{timeAgoEs(j.lastRunAt)}</td>
                      <td className={td}><StatusPill tone={j.ok ? "success" : "danger"}>{j.ok ? "Bien" : "Con error"}</StatusPill></td>
                      <td className={td}>{j.durationMs == null ? "—" : j.durationMs < 1000 ? `${j.durationMs} ms` : `${(j.durationMs / 1000).toFixed(1)} s`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Block>
      </div>

      <Block title="Errores del sistema" pill={<StatusPill tone={errTone}>{errTone === "success" ? "Sin errores recientes" : errTone === "warning" ? "Algunos errores" : "Muchos errores"}</StatusPill>}>
        <div className="grid gap-2 sm:grid-cols-3">
          <Fact label="Últimos 15 minutos" value={errors.last15min} />
          <Fact label="Última hora" value={errors.lastHour} />
          <Fact label="Últimas 24 horas" value={errors.last24h} />
        </div>
        {errors.recent.length === 0 ? (
          <p className="text-sm console-muted">No hay errores registrados en las últimas 24 horas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className={th}>Cuándo</th><th className={th}>Dónde falló</th></tr></thead>
              <tbody>
                {errors.recent.map((e, i) => (
                  <tr key={`${e.at}-${i}`} style={{ borderTop: "1px solid var(--border-light)" }}>
                    <td className={`${td} whitespace-nowrap`}>{timeAgoEs(e.at)}</td>
                    <td className={td}>{systemAreaLabel(e.path)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs console-muted">Por privacidad aquí solo se ve en qué parte falló, nunca el detalle ni datos de clientes. El equipo técnico puede ver el detalle en los registros del servidor.</p>
      </Block>
    </div>
  )
}
