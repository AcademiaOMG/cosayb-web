"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Award, MoreHorizontal, RefreshCw, ShieldCheck, ShieldOff } from "lucide-react"
import { Badge, Button, Card, Chip, EmptyState, ErrorPanel, Skeleton } from "@/components/lms/ui"
import { ActionMenu, AreaField, Dialog, errMsg } from "@/components/lms/studio/kit"
import { lms } from "@/lib/lms/api"
import { errorStatus } from "@/lib/lms/hooks"
import { toast } from "@/lib/toast"
import type { ManageCertificate } from "@/lib/lms/types"
import { Pager, SearchBox, dateLabel, useDebounced } from "./parts"

/** Certificados emitidos en la academia: buscar, verificar, revocar con motivo y reemitir. */
export default function CertificatesAdmin() {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<"all" | "valid" | "revoked">("all")
  const [offset, setOffset] = useState(0)
  const [revoking, setRevoking] = useState<ManageCertificate | null>(null)
  const dq = useDebounced(q)
  const { data, error, mutate } = useSWR(["lms/manage/certificates", dq, status, offset], () => lms.manage.certificates({ q: dq || undefined, status: status === "all" ? undefined : status, offset }), { revalidateOnFocus: false })

  if (errorStatus(error) === 403) return <ErrorPanel title="Solo para administradores" />
  if (error) return <ErrorPanel title="No pudimos cargar los certificados" onRetry={() => mutate()} />

  async function reissue(c: ManageCertificate) {
    try {
      const r = await lms.admin.issueCertificate(c.courseId, c.userId)
      await mutate()
      toast.success(r.reissued ? "Certificado reemitido con un código nuevo." : "El certificado ya estaba vigente.")
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Certificados emitidos</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Cada certificado se puede verificar públicamente con su código. Al revocar uno, la verificación deja de validarlo.</p>
      </header>
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={(v) => { setQ(v); setOffset(0) }} placeholder="Buscar nombre, curso o código…" label="Buscar certificado" width={280} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
          {([["all", "Todos"], ["valid", "Vigentes"], ["revoked", "Revocados"]] as const).map(([id, label]) => <Chip key={id} pressed={status === id} onClick={() => { setStatus(id); setOffset(0) }}>{label}</Chip>)}
        </div>
      </div>
      {!data ? (
        <Skeleton className="h-72 !rounded-[22px]" />
      ) : data.rows.length === 0 ? (
        <EmptyState title="Sin certificados" description="Aún no hay certificados que coincidan." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="t-table">
            <caption className="sr-only">Certificados emitidos</caption>
            <thead><tr><th scope="col">Persona</th><th scope="col">Curso</th><th scope="col">Código</th><th scope="col">Emitido</th><th scope="col">Estado</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {data.rows.map((c) => (
                <tr key={c.id}>
                  <td><span className="block break-words font-extrabold">{c.recipientName}</span><span className="block break-all text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{c.email}</span></td>
                  <td className="font-bold">{c.courseTitle}</td>
                  <td><code className="text-xs font-bold">{c.code}</code></td>
                  <td className="text-sm font-semibold" style={{ color: "var(--l-muted)" }}>{dateLabel(c.issuedAt)}</td>
                  <td>{c.revokedAt ? <Badge tone="rose">Revocado</Badge> : <Badge tone="mint"><Award size={12} aria-hidden="true" /> Vigente</Badge>}{c.revokedReason && <span className="mt-1 block max-w-[220px] break-words text-xs" style={{ color: "var(--l-muted)" }}>{c.revokedReason}</span>}</td>
                  <td>
                    <ActionMenu label={`Acciones del certificado de ${c.recipientName}`} trigger={<MoreHorizontal size={18} aria-hidden="true" />}>
                      {() => (
                        <>
                          <Link role="menuitem" href={`/verificar/${encodeURIComponent(c.code)}`}><ShieldCheck size={15} aria-hidden="true" /> Verificar</Link>
                          {c.revokedAt ? (
                            <button type="button" role="menuitem" onClick={() => void reissue(c)}><RefreshCw size={15} aria-hidden="true" /> Reemitir</button>
                          ) : (
                            <button type="button" role="menuitem" className="l-danger" onClick={() => setRevoking(c)}><ShieldOff size={15} aria-hidden="true" /> Revocar</button>
                          )}
                        </>
                      )}
                    </ActionMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {data && <Pager total={data.total} offset={offset} onChange={setOffset} noun="certificados" />}
      {revoking && <RevokeDialog cert={revoking} onClose={() => setRevoking(null)} onDone={() => { setRevoking(null); void mutate() }} />}
    </div>
  )
}

function RevokeDialog({ cert, onClose, onDone }: { cert: ManageCertificate; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  async function save() {
    setBusy(true)
    try {
      await lms.admin.revokeCertificate(cert.courseId, cert.id, reason.trim())
      toast.success("Certificado revocado.")
      onDone()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open onClose={onClose} title="Revocar certificado" footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save} loading={busy} disabled={reason.trim().length < 3}>Revocar</Button></>}>
      <p className="mb-3 text-sm font-bold">{cert.recipientName} · {cert.courseTitle}</p>
      <AreaField label="Motivo (queda en la auditoría)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} />
    </Dialog>
  )
}
