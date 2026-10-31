"use client"

import { useState } from "react"
import { Award, Ban, RotateCcw } from "lucide-react"
import { Badge, Button, Card, EmptyState, ErrorPanel, Skeleton } from "@/components/lms/ui"
import CertificateArt from "@/components/lms/CertificateArt"
import { lms } from "@/lib/lms/api"
import { useAdminCertificates } from "@/lib/lms/hooks"
import { CERT_COLOR_LIST } from "@/lib/lms/studio"
import { fmtDate } from "@/lib/saas/format"
import { toast } from "@/lib/toast"
import type { AdminCertificateRow, AdminCourse, CertColor } from "@/lib/lms/types"
import { Dialog, SaveBadge, TextField, AreaField, errMsg, useAutosave } from "./kit"

export default function CertificateTab({ course, onChanged }: { course: AdminCourse; onChanged: () => void }) {
  const [t, setT] = useState({ certTitle: course.certTitle, certBody: course.certBody, certSigner: course.certSigner, certSignerRole: course.certSignerRole, certColor: course.certColor as CertColor })
  const ok = t.certTitle.trim() && t.certBody.trim() && t.certSigner.trim() && t.certSignerRole.trim()
  const { status } = useAutosave(t, async (v) => { await lms.admin.updateCourse(course.id, { certTitle: v.certTitle.trim(), certBody: v.certBody.trim(), certSigner: v.certSigner.trim(), certSignerRole: v.certSignerRole.trim(), certColor: v.certColor }); onChanged() }, { valid: Boolean(ok) })

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-2"><h2 className="font-extrabold">Plantilla del certificado</h2><SaveBadge status={status} invalid={!ok} /></div>
          <TextField label="Título" value={t.certTitle} onChange={(e) => setT({ ...t, certTitle: e.target.value })} maxLength={120} />
          <AreaField label="Texto antes del nombre del curso" value={t.certBody} onChange={(e) => setT({ ...t, certBody: e.target.value })} maxLength={300} rows={2} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="Firmante" value={t.certSigner} onChange={(e) => setT({ ...t, certSigner: e.target.value })} maxLength={80} />
            <TextField label="Cargo del firmante" value={t.certSignerRole} onChange={(e) => setT({ ...t, certSignerRole: e.target.value })} maxLength={80} />
          </div>
          <fieldset>
            <legend className="l-label mb-2">Color</legend>
            <div className="flex flex-wrap gap-2">
              {CERT_COLOR_LIST.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-bold focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[var(--l-brand)]" style={{ borderColor: t.certColor === c.id ? c.hex : "var(--l-line)", background: t.certColor === c.id ? c.soft : "#fff" }}>
                  <input type="radio" name="cert-color" className="sr-only" checked={t.certColor === c.id} onChange={() => setT({ ...t, certColor: c.id })} />
                  <span aria-hidden="true" className="h-4 w-4 rounded-full" style={{ background: c.id === "blue" ? "var(--accent)" : c.hex }} />{c.id === "blue" ? "Azul del proyecto" : c.name}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="l-hint">El certificado se emite al terminar todas las lecciones y aprobar las evaluaciones obligatorias; puedes emitirlo a mano desde «Estudiantes». El código de verificación es público y solo muestra nombre, curso y fecha.</p>
        </Card>
        <div className="min-w-0">
          <h2 className="mb-2 font-extrabold">Vista previa</h2>
          <CertificateArt
            name="Nombre del estudiante"
            course={course.title}
            issuedAt={new Date(course.updatedAt).toISOString()}
            code="ABCD-2345-EFGH-6789"
            verifyUrl="academia.omg/verificar"
            template={{ title: t.certTitle || "Título", body: t.certBody || "Texto", signer: t.certSigner || "Firmante", signerRole: t.certSignerRole || "Cargo", color: t.certColor }}
          />
        </div>
      </div>
      <Issued course={course} />
    </div>
  )
}

function Issued({ course }: { course: AdminCourse }) {
  const { data, error, mutate } = useAdminCertificates(course.id)
  const [target, setTarget] = useState<AdminCertificateRow | null>(null)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)

  async function revoke() {
    if (!target) return
    setBusy(true)
    try {
      await lms.admin.revokeCertificate(course.id, target.id, reason.trim())
      toast.success("Certificado revocado.")
      setTarget(null)
      setReason("")
      await mutate()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }
  async function reissue(c: AdminCertificateRow) {
    try {
      await lms.admin.issueCertificate(course.id, c.userId)
      toast.success("Certificado reemitido con un código nuevo.")
      await mutate()
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  if (error) return <ErrorPanel title="No pudimos cargar los certificados" onRetry={() => mutate()} />
  return (
    <section aria-labelledby="emitidos" className="flex flex-col gap-3">
      <h2 id="emitidos" className="text-lg font-extrabold">Certificados emitidos</h2>
      {!data ? <Skeleton className="h-24 !rounded-[22px]" /> : data.length === 0 ? <EmptyState title="Aún no se han emitido certificados" description="Se emiten solos cuando alguien termina el curso, o a mano desde «Estudiantes»." /> : (
        <Card className="overflow-x-auto">
          <table className="t-table">
            <caption className="sr-only">Certificados del curso</caption>
            <thead><tr><th scope="col">Estudiante</th><th scope="col">Código</th><th scope="col">Emitido</th><th scope="col">Estado</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td><p className="font-extrabold">{c.recipientName}</p><p className="break-all text-xs" style={{ color: "var(--l-muted)" }}>{c.email}</p></td>
                  <td className="font-mono text-xs">{c.code}</td>
                  <td className="whitespace-nowrap text-xs font-semibold">{fmtDate(c.issuedAt, "short")}{c.manual && <Badge tone="neutral" className="ml-1">Manual</Badge>}</td>
                  <td>{c.revokedAt ? <div><Badge tone="rose">Revocado</Badge>{c.revokedReason && <p className="l-hint mt-1">{c.revokedReason}</p>}</div> : <Badge tone="mint"><Award size={12} aria-hidden="true" /> Vigente</Badge>}</td>
                  <td className="text-right">
                    {c.revokedAt ? <Button variant="ghost" size="sm" onClick={() => void reissue(c)}><RotateCcw size={14} aria-hidden="true" /> Reemitir</Button> : <Button variant="ghost" size="sm" onClick={() => setTarget(c)}><Ban size={14} aria-hidden="true" /> Revocar</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {target && (
        <Dialog open title="Revocar certificado" onClose={() => setTarget(null)} footer={<><Button variant="ghost" onClick={() => setTarget(null)}>Cancelar</Button><Button onClick={revoke} loading={busy} disabled={reason.trim().length < 3}>Revocar</Button></>}>
          <p className="mb-3 text-sm">El código <strong className="font-mono">{target.code}</strong> de {target.recipientName} dejará de verificarse. Queda registrado el motivo y quién lo hizo.</p>
          <AreaField label="Motivo (obligatorio)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} autoFocus />
        </Dialog>
      )}
    </section>
  )
}
