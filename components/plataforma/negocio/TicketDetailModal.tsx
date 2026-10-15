"use client"

import Link from "next/link"
import { useState } from "react"
import useSWR from "swr"
import { Mail } from "lucide-react"
import Button from "@/components/ui/Button"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import Modal from "@/components/ui/Modal"
import { TicketStatusBadge } from "@/components/saas/StatusBadge"
import { Field } from "./ListControls"
import { negocioApi, slaState, type TicketDetail, type TicketStatusApi } from "@/lib/plataforma/negocio"
import { planLabel } from "@/lib/saas/billing"
import { fmtDate } from "@/lib/saas/format"
import { saasErrorMessage } from "@/lib/saas/services"
import { TICKET_CATEGORIES } from "@/lib/saas/support"
import type { PlanId } from "@/lib/saas/types"
import { toast } from "@/lib/toast"

const SLA_COLOR = { ok: "var(--text-muted)", warning: "#B45309", late: "#B91C1C", done: "var(--text-muted)" } as const

const NEXT_ACTIONS: Record<TicketStatusApi, { to: TicketStatusApi; label: string }[]> = {
  open: [{ to: "in_progress", label: "Marcar en curso" }, { to: "resolved", label: "Marcar resuelto" }],
  in_progress: [{ to: "resolved", label: "Marcar resuelto" }, { to: "open", label: "Volver a abierto" }],
  resolved: [{ to: "closed", label: "Cerrar ticket" }, { to: "open", label: "Reabrir" }],
  closed: [{ to: "open", label: "Reabrir" }],
}

export default function TicketDetailModal({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const { data, error, isLoading, mutate } = useSWR(id ? ["negocio-ticket", id] : null, () => negocioApi.ticket(id!), { revalidateOnFocus: false })
  return (
    <Modal open={!!id} onClose={onClose} title={data ? `Ticket ${data.ticket.ticketNo}` : "Ticket de soporte"} wide>
      {error ? (
        <ErrorState title="No pudimos abrir el ticket" onRetry={() => mutate()} />
      ) : isLoading || !data ? (
        <LoadingBlock label="Cargando el ticket…" />
      ) : (
        <TicketBody key={data.ticket.id} data={data} refresh={() => mutate()} onChanged={onChanged} />
      )}
    </Modal>
  )
}

function TicketBody({ data, refresh, onChanged }: { data: TicketDetail; refresh: () => Promise<unknown>; onChanged: () => void }) {
  const t = data.ticket
  const savedNote = t.internalNote ?? ""
  const [note, setNote] = useState(savedNote)
  const [reply, setReply] = useState("")
  const [busy, setBusy] = useState<"status" | "note" | "reply" | null>(null)
  const sla = slaState(t, data.slaHours)
  const category = TICKET_CATEGORIES.find((c) => c.id === t.category)?.label ?? "Otro"

  async function run<T>(kind: "status" | "note" | "reply", fn: () => Promise<T>, ok: string) {
    setBusy(kind)
    try {
      await fn()
      await refresh()
      onChanged()
      toast.success(ok)
      return true
    } catch (err) {
      toast.error("No se pudo completar", { description: saasErrorMessage(err) })
      return false
    } finally {
      setBusy(null)
    }
  }

  return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <TicketStatusBadge status={t.status} />
          <span className="text-xs font-medium" style={{ color: SLA_COLOR[sla.tone] }}>{sla.label}</span>
          <span className="text-xs console-muted">{category} · recibido el {fmtDate(t.createdAt)}</span>
        </div>

        <div>
          <h3 className="text-base font-bold console-title">{t.subject}</h3>
          <p className="text-sm console-title whitespace-pre-wrap mt-2 rounded-xl p-3" style={{ background: "var(--bg-secondary)" }}>{t.message}</p>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Quién escribe">{t.name} · {t.email}</Field>
          <Field label="Cuenta">
            {data.user ? (
              <>
                {data.user.name}{" "}
                <Link href={`/plataforma/usuarios/${data.user.id}`} className="console-accent underline">ver usuario</Link>
                {!data.user.emailVerified && <span className="console-muted"> · correo sin verificar</span>}
              </>
            ) : (
              "Escribió sin iniciar sesión"
            )}
          </Field>
          <Field label="Negocio">
            {data.organization ? (
              <>
                <Link href={`/plataforma/organizaciones/${data.organization.id}`} className="console-accent underline">{data.organization.name}</Link>
                <span className="console-muted"> · plan {planLabel(data.organization.membership as PlanId)}</span>
              </>
            ) : (
              "Sin negocio asociado"
            )}
          </Field>
        </dl>

        <section aria-labelledby="t-estado" className="flex flex-col gap-2">
          <h3 id="t-estado" className="text-sm font-bold console-title">Estado del ticket</h3>
          <div className="flex flex-wrap gap-2">
            {NEXT_ACTIONS[t.status].map((a) => (
              <Button key={a.to} variant="ghost" size="sm" loading={busy === "status"} disabled={busy !== null} onClick={() => run("status", () => negocioApi.actualizarTicket(t.id, { status: a.to }), "Estado actualizado")}>
                {a.label}
              </Button>
            ))}
          </div>
        </section>

        <section aria-labelledby="t-hist" className="flex flex-col gap-2">
          <h3 id="t-hist" className="text-sm font-bold console-title">Respuestas enviadas</h3>
          {data.replies.length === 0 ? (
            <p className="text-sm console-muted">Todavía no le has respondido a este cliente.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.replies.map((r) => (
                <li key={r.id} className="console-row px-3 py-2.5">
                  <p className="text-xs console-muted">{r.authorName} → {r.sentTo} · {fmtDate(r.createdAt, "short")}</p>
                  <p className="text-sm console-title whitespace-pre-wrap mt-1">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="t-resp" className="flex flex-col gap-2">
          <h3 id="t-resp" className="text-sm font-bold console-title">Responder al cliente por correo</h3>
          <label htmlFor="t-reply" className="text-xs console-muted">Se enviará a {t.email}. El ticket pasará a «En curso».</label>
          <textarea
            id="t-reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="Escribe tu respuesta en lenguaje claro…"
            className="console-input w-full text-sm p-3"
          />
          <div>
            <Button
              size="sm"
              loading={busy === "reply"}
              disabled={busy !== null || reply.trim().length < 5}
              onClick={async () => {
                if (await run("reply", () => negocioApi.responder(t.id, reply.trim()), "Respuesta enviada por correo")) setReply("")
              }}
            >
              <Mail size={14} aria-hidden="true" /> Enviar respuesta
            </Button>
          </div>
        </section>

        <section aria-labelledby="t-nota" className="flex flex-col gap-2">
          <h3 id="t-nota" className="text-sm font-bold console-title">Nota interna</h3>
          <label htmlFor="t-note" className="text-xs console-muted">Solo la ve el equipo; el cliente nunca la recibe.</label>
          <textarea id="t-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={5000} className="console-input w-full text-sm p-3" />
          <div>
            <Button
              variant="ghost"
              size="sm"
              loading={busy === "note"}
              disabled={busy !== null || note.trim() === savedNote.trim()}
              onClick={() => run("note", () => negocioApi.actualizarTicket(t.id, { internalNote: note.trim() || null }), "Nota guardada")}
            >
              Guardar nota
            </Button>
          </div>
        </section>
      </div>
  )
}
