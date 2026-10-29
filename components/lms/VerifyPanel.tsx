"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { BadgeCheck, ShieldX } from "lucide-react"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import ErrorState from "@/components/ui/ErrorState"
import Input from "@/components/ui/Input"
import LoadingBlock from "@/components/ui/LoadingBlock"
import { lms } from "@/lib/lms/api"
import { isValidCertificateCode, normalizeCertificateCode } from "@/lib/lms/validation"
import { fmtDate } from "@/lib/saas/format"

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
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>Verificar certificado</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Escribe el código que aparece en el certificado para comprobar que es auténtico.</p>
      </header>
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input label="Código de verificación" placeholder="XXXX-XXXX-XXXX-XXXX" value={input} onChange={(e) => setInput(e.target.value)} error={formError ?? undefined} autoComplete="off" spellCheck={false} maxLength={40} />
        </div>
        <Button type="submit">Verificar</Button>
      </form>

      {code && !validShape ? (
        <NotValid />
      ) : validShape && isLoading ? (
        <LoadingBlock className="py-6" />
      ) : error ? (
        <ErrorState title="No pudimos verificar el código" description="Inténtalo de nuevo en un momento." onRetry={() => mutate()} />
      ) : validShape && data === null ? (
        <NotValid />
      ) : data ? (
        <Card className="flex flex-col gap-2" role="status">
          <p className="flex items-center gap-2 text-base font-semibold" style={{ color: "#065F46" }}>
            <BadgeCheck size={22} aria-hidden="true" /> Certificado auténtico
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt style={{ color: "var(--text-muted)" }}>Nombre</dt>
            <dd className="break-words font-medium" style={{ color: "var(--text-primary)" }}>{data.recipientName}</dd>
            <dt style={{ color: "var(--text-muted)" }}>Curso</dt>
            <dd className="break-words font-medium" style={{ color: "var(--text-primary)" }}>{data.courseTitle}</dd>
            <dt style={{ color: "var(--text-muted)" }}>Emitido</dt>
            <dd style={{ color: "var(--text-primary)" }}>{fmtDate(data.issuedAt)}</dd>
          </dl>
        </Card>
      ) : null}
    </div>
  )
}

function NotValid() {
  return (
    <Card className="flex items-center gap-3" role="status">
      <ShieldX size={22} aria-hidden="true" style={{ color: "#B91C1C" }} />
      <p className="text-sm" style={{ color: "var(--text-primary)" }}>No encontramos un certificado vigente con ese código.</p>
    </Card>
  )
}
