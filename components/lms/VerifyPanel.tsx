"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { BadgeCheck, ShieldCheck, ShieldX } from "lucide-react"
import { lms } from "@/lib/lms/api"
import { isValidCertificateCode, normalizeCertificateCode } from "@/lib/lms/validation"
import { fmtDate } from "@/lib/saas/format"
import { Button, Card, ErrorPanel, Skeleton } from "./ui"

/** Verificación pública: solo se muestran nombre, curso y fecha (es todo lo que el servidor entrega). */
export default function VerifyPanel({ initialCode }: { initialCode?: string }) {
  const router = useRouter()
  const [input, setInput] = useState(initialCode ?? "")
  const [formError, setFormError] = useState<string | null>(null)
  const code = initialCode ? normalizeCertificateCode(initialCode) : null
  const validShape = code !== null && isValidCertificateCode(code)

  const { data, error, isLoading, mutate } = useSWR(validShape ? `lms/verify/${code}` : null, () => lms.verifyCertificate(code!), { revalidateOnFocus: false, shouldRetryOnError: false })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const c = normalizeCertificateCode(input)
    if (!isValidCertificateCode(c)) return setFormError("El código tiene el formato XXXX-XXXX-XXXX-XXXX.")
    setFormError(null)
    router.push(`/verificar/${c}`)
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl text-white" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }} aria-hidden="true"><ShieldCheck size={30} /></span>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Verificar certificado</h1>
        <p className="text-sm" style={{ color: "var(--l-muted)" }}>Escribe el código que aparece en el certificado para comprobar que es auténtico.</p>
      </header>
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <label htmlFor="code" className="sr-only">Código de verificación</label>
          <input id="code" className="l-input font-mono uppercase" placeholder="XXXX-XXXX-XXXX-XXXX" value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off" spellCheck={false} maxLength={40} aria-invalid={Boolean(formError)} aria-describedby={formError ? "code-err" : undefined} />
          {formError && <p id="code-err" className="mt-1 text-sm font-bold" style={{ color: "var(--l-rose-ink)" }}>{formError}</p>}
        </div>
        <Button type="submit">Verificar</Button>
      </form>

      {code && !validShape ? (
        <NotValid />
      ) : validShape && isLoading ? (
        <Skeleton className="h-32 w-full !rounded-[22px]" />
      ) : error ? (
        <ErrorPanel title="No pudimos verificar el código" description="Inténtalo de nuevo en un momento." onRetry={() => mutate()} />
      ) : validShape && data === null ? (
        <NotValid />
      ) : data ? (
        <Card className="l-pop flex flex-col gap-3 p-6" >
          <p role="status" className="flex items-center gap-2 text-lg font-extrabold" style={{ color: "var(--l-mint-ink)" }}><BadgeCheck size={24} aria-hidden="true" /> Certificado auténtico</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt style={{ color: "var(--l-muted)" }}>Nombre</dt>
            <dd className="break-words font-extrabold">{data.recipientName}</dd>
            <dt style={{ color: "var(--l-muted)" }}>Curso</dt>
            <dd className="break-words font-extrabold">{data.courseTitle}</dd>
            <dt style={{ color: "var(--l-muted)" }}>Emitido</dt>
            <dd className="font-bold">{fmtDate(data.issuedAt)}</dd>
          </dl>
        </Card>
      ) : null}
    </div>
  )
}

function NotValid() {
  return (
    <Card className="flex items-center gap-3 p-5">
      <ShieldX size={24} aria-hidden="true" style={{ color: "var(--l-rose)" }} />
      <p role="status" className="text-sm font-bold">No encontramos un certificado vigente con ese código.</p>
    </Card>
  )
}
