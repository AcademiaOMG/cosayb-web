"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Ban, KeyRound, LogIn, ShieldX } from "lucide-react"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import StatCard from "@/components/plataforma/StatCard"
import { authFailureLabel, blockedActionLabel } from "@/lib/plataforma/labels"
import { deviceLabel } from "@/lib/plataforma/clientes"
import { vigilanciaApi, type SecurityRange } from "@/lib/plataforma/vigilancia"
import { timeAgoEs } from "@/lib/saas/format"

const RANGES: { id: SecurityRange; label: string }[] = [
  { id: "24h", label: "Últimas 24 horas" },
  { id: "7d", label: "Últimos 7 días" },
]

const th = "px-3 py-2 text-left text-xs font-semibold console-muted"
const td = "px-3 py-2 text-sm console-title align-top"
const rowStyle = { borderTop: "1px solid var(--border-light)" }

function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="console-card flex flex-col gap-3">
      <div>
        <h3 className="text-base font-semibold console-title">{title}</h3>
        {hint && <p className="text-xs console-muted">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

const Empty = ({ children }: { children: string }) => <p className="text-sm console-muted">{children}</p>

/** Seguridad: resumen del periodo, IPs y cuentas más atacadas, bloqueos, intentos fallidos recientes y accesos desde IP nueva. */
export default function SecurityPanel() {
  const [range, setRange] = useState<SecurityRange>("24h")
  const { data, error, mutate } = useSWR(["vigilancia", "seguridad", range], () => vigilanciaApi.seguridad(range), {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  if (error && !data) return <ErrorState title="No pudimos cargar la seguridad" onRetry={() => void mutate()} />
  if (!data) return <LoadingBlock label="Cargando seguridad…" />

  const s = range === "24h" ? data.summary.last24h : data.summary.last7d
  const total = s.loginSuccess + s.loginFailed
  const failedPct = total > 0 ? Math.round((s.loginFailed / total) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Periodo" className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={range === r.id}
            onClick={() => setRange(r.id)}
            className="plat-btn"
            style={range === r.id ? { background: "var(--accent-light)", borderColor: "var(--accent)", color: "var(--accent-text)" } : undefined}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Inicios de sesión exitosos" value={s.loginSuccess} icon={LogIn} />
        <StatCard label="Intentos fallidos" value={s.loginFailed} icon={ShieldX} hint={total > 0 ? `${failedPct}% de los intentos` : "Sin intentos en el periodo"} />
        <StatCard label="Bloqueos por demasiados intentos" value={s.rateLimited} icon={Ban} />
        <StatCard label="Restablecimientos de contraseña pedidos" value={s.passwordResets} icon={KeyRound} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Block title="Direcciones con más intentos fallidos" hint="Una misma dirección que falla muchas veces suele ser un ataque automático.">
          {data.topIps.length === 0 ? <Empty>Sin intentos fallidos en este periodo.</Empty> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className={th}>Dirección</th><th className={th}>Fallos</th><th className={th}>Cuentas probadas</th><th className={th}>Último</th></tr></thead>
                <tbody>
                  {data.topIps.map((r) => (
                    <tr key={r.ip} style={rowStyle}><td className={td}>{r.ip}</td><td className={td}>{r.failures}</td><td className={td}>{r.accounts}</td><td className={td}>{timeAgoEs(r.lastAt)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Block>

        <Block title="Cuentas más atacadas" hint="Correos con más intentos fallidos (parcialmente ocultos).">
          {data.topAccounts.length === 0 ? <Empty>Sin intentos fallidos en este periodo.</Empty> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className={th}>Cuenta</th><th className={th}>Fallos</th><th className={th}>Desde</th><th className={th}>Último</th></tr></thead>
                <tbody>
                  {data.topAccounts.map((r, i) => (
                    <tr key={`${r.email}-${i}`} style={rowStyle}>
                      <td className={td}>
                        {r.userId ? <Link href={`/plataforma/usuarios/${r.userId}`} className="console-accent underline">{r.email}</Link> : <>{r.email} <span className="text-xs console-muted">(no existe)</span></>}
                      </td>
                      <td className={td}>{r.failures}</td>
                      <td className={td}>{r.ips} {r.ips === 1 ? "dirección" : "direcciones"}</td>
                      <td className={td}>{timeAgoEs(r.lastAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Block>
      </div>

      <Block title="Bloqueos por límite de intentos" hint="El sistema frena solo a quien intenta demasiado seguido.">
        {data.blocks.length === 0 ? <Empty>Nadie fue bloqueado en este periodo.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className={th}>Dirección</th><th className={th}>Bloqueos</th><th className={th}>Qué intentaba</th><th className={th}>Último</th></tr></thead>
              <tbody>
                {data.blocks.map((r) => (
                  <tr key={r.ip} style={rowStyle}><td className={td}>{r.ip}</td><td className={td}>{r.blocks}</td><td className={td}>{blockedActionLabel(r.lastRoute)}</td><td className={td}>{timeAgoEs(r.lastAt)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Block>

      <Block title="Intentos fallidos recientes">
        {data.recentFailures.length === 0 ? <Empty>No hay intentos fallidos en este periodo.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className={th}>Cuándo</th><th className={th}>Cuenta</th><th className={th}>Dirección</th><th className={th}>Motivo</th><th className={th}>Dispositivo</th></tr></thead>
              <tbody>
                {data.recentFailures.map((r) => (
                  <tr key={r.id} style={rowStyle}>
                    <td className={`${td} whitespace-nowrap`}>{timeAgoEs(r.at)}</td>
                    <td className={td}>{r.email}</td>
                    <td className={td}>{r.ip ?? "—"}</td>
                    <td className={td}>{authFailureLabel(r.reason)}</td>
                    <td className={td}>{deviceLabel(r.userAgent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Block>

      <Block title="Accesos desde una dirección nueva" hint="Personas que entraron desde una dirección que su cuenta no había usado antes. Es normal si cambiaron de red o de equipo.">
        {data.newIpAccesses.length === 0 ? <Empty>Ninguno en este periodo.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className={th}>Cuándo</th><th className={th}>Persona</th><th className={th}>Dirección</th><th className={th}>Dispositivo</th></tr></thead>
              <tbody>
                {data.newIpAccesses.map((r) => (
                  <tr key={`${r.userId}-${r.ip}-${r.at}`} style={rowStyle}>
                    <td className={`${td} whitespace-nowrap`}>{timeAgoEs(r.at)}</td>
                    <td className={td}>
                      <Link href={`/plataforma/usuarios/${r.userId}`} className="console-accent underline">{r.name ?? r.email}</Link>
                      {r.name && <span className="block text-xs console-muted">{r.email}</span>}
                    </td>
                    <td className={td}>{r.ip}</td>
                    <td className={td}>{deviceLabel(r.userAgent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Block>
    </div>
  )
}
