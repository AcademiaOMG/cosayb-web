"use client"

import Link from "next/link"
import useSWR from "swr"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import StatusPill from "@/components/plataforma/StatusPill"
import { BusinessesCell } from "@/components/plataforma/accesos/AccessUsersTab"
import { deviceText, getAccessDetail, resultInfo } from "@/lib/plataforma/accesos"
import { exactTime, relativeTime } from "@/lib/plataforma/auditView"
import { authEventLabel, authFailureLabel, authMethodLabel, authRevokeReasonLabel, moduleLabel, usageActionLabel } from "@/lib/plataforma/labels"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold console-title">{title}</h3>
      {children}
    </section>
  )
}

const Empty = ({ text }: { text: string }) => <p className="text-sm console-muted">{text}</p>

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="console-card flex flex-col gap-0.5 p-3">
      <span className="text-xs console-muted">{label}</span>
      <span className="text-base font-semibold console-title">{value}</span>
    </div>
  )
}

interface Props {
  userId: string | null
  onClose: () => void
  /** Abre el feed de actividad filtrado por esta persona. */
  onSeeActivity: (userId: string) => void
  canOpenProfile: boolean
}

export default function UserAccessDetail({ userId, onClose, onSeeActivity, canOpenProfile }: Props) {
  const { data, error, isLoading, mutate } = useSWR(userId ? ["accesos-detalle", userId] : null, () => getAccessDetail(userId as string), {
    revalidateOnFocus: false,
  })
  const maxModule = Math.max(1, ...(data?.topModules.map((m) => m.total) ?? [1]))

  return (
    <Modal open={!!userId} onClose={onClose} title={data ? data.user.name : "Accesos de la persona"} wide>
      {error && !data ? (
        <ErrorState title="No pudimos cargar el detalle" onRetry={() => void mutate()} />
      ) : isLoading || !data ? (
        <LoadingBlock label="Cargando detalle…" />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm console-muted">{data.user.email}</p>
              <div className="mt-1.5"><BusinessesCell user={data.user} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => onSeeActivity(data.user.id)}>Ver su actividad</Button>
              {canOpenProfile && (
                <Link href={`/plataforma/usuarios/${data.user.id}`} className="inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium plat-focus" style={{ color: "var(--accent)" }}>
                  Ver su ficha
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Último acceso" value={data.summary.lastAccessAt ? relativeTime(data.summary.lastAccessAt) : "Nunca"} />
            <Metric label="Entradas en 7 días" value={data.summary.logins7} />
            <Metric label="Entradas en 30 días" value={data.summary.logins30} />
            <Metric label="Intentos fallidos (30 días)" value={data.summary.failed30} />
          </div>

          <Section title="Línea de tiempo de accesos">
            {data.timeline.length === 0 ? (
              <Empty text="Todavía no hay accesos registrados para esta persona." />
            ) : (
              <ul className="flex flex-col">
                {data.timeline.map((t, i) => (
                  <li key={`${t.at}-${i}`} className="flex flex-col gap-0.5 py-2" style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm console-title">
                        {authEventLabel(t.type)}
                        {t.type === "login_failed" && <span className="console-muted"> · {authFailureLabel(t.reason)}</span>}
                        {t.type === "session_revoked" && t.reason && <span className="console-muted"> · {authRevokeReasonLabel(t.reason)}</span>}
                      </span>
                      {t.at && <span className="text-xs console-muted" title={exactTime(t.at)}>{relativeTime(t.at)}</span>}
                    </div>
                    <p className="text-xs console-muted">
                      {deviceText(t.device)}
                      {t.ip ? ` · Dirección IP ${t.ip}` : ""}
                      {t.method ? ` · ${authMethodLabel(t.method)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <div className="grid gap-6 md:grid-cols-2">
            <Section title="Módulos que más usa (30 días)">
              {data.topModules.length === 0 ? (
                <Empty text="Sin uso de módulos en los últimos 30 días." />
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.topModules.map((m) => (
                    <li key={m.module} className="flex flex-col gap-1">
                      <div className="flex justify-between text-sm">
                        <span className="console-title">{moduleLabel(m.module)}</span>
                        <span className="console-muted">{m.total} {m.total === 1 ? "vez" : "veces"}</span>
                      </div>
                      <div aria-hidden="true" className="h-1.5 rounded-full" style={{ background: "var(--bg-secondary)" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.round((m.total / maxModule) * 100)}%`, background: "var(--accent)" }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Acciones recientes">
              {data.recentActions.length === 0 ? (
                <Empty text="Todavía no hay acciones registradas." />
              ) : (
                <ul className="flex flex-col">
                  {data.recentActions.slice(0, 12).map((a, i) => {
                    const r = resultInfo(a.status)
                    return (
                      <li key={`${a.at}-${i}`} className="flex flex-col gap-0.5 py-1.5" style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm console-title">{usageActionLabel(a.action)} <span className="console-muted">en</span> {moduleLabel(a.module)}</span>
                          {r.tone !== "success" && <StatusPill tone={r.tone}>{r.label}</StatusPill>}
                        </div>
                        <p className="text-xs console-muted">
                          {a.at ? relativeTime(a.at) : ""}{a.organizationName ? ` · ${a.organizationName}` : ""}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Section>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Section title="Dispositivos distintos">
              {data.devices.length === 0 ? (
                <Empty text="Sin dispositivos registrados." />
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {data.devices.map((d) => (
                    <li key={d.label} className="flex justify-between gap-3 text-sm">
                      <span className="console-title">{d.label}</span>
                      <span className="console-muted">{d.count} {d.count === 1 ? "entrada" : "entradas"}{d.lastAt ? ` · ${relativeTime(d.lastAt)}` : ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section title="Direcciones IP distintas">
              {data.ips.length === 0 ? (
                <Empty text="Sin direcciones registradas." />
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {data.ips.map((p) => (
                    <li key={p.ip} className="flex justify-between gap-3 text-sm">
                      <span className="console-title">{p.ip}</span>
                      <span className="console-muted">{p.count} {p.count === 1 ? "vez" : "veces"}{p.lastAt ? ` · ${relativeTime(p.lastAt)}` : ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>
      )}
    </Modal>
  )
}
