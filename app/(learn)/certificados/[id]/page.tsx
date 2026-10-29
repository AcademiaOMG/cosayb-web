"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { Award, Printer } from "lucide-react"
import Button from "@/components/ui/Button"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import SignInRequired from "@/components/lms/SignInRequired"
import { lms } from "@/lib/lms/api"
import { errorStatus } from "@/lib/lms/hooks"
import { fmtDate } from "@/lib/saas/format"

export default function CertificadoPage() {
  const { id } = useParams<{ id: string }>()
  const { data: cert, error, mutate } = useSWR(`lms/cert/${id}`, () => lms.certificate(id), { revalidateOnFocus: false })

  if (errorStatus(error) === 401) return <SignInRequired message="Inicia sesión para ver tu certificado." />
  if (errorStatus(error) === 404) return <ErrorState title="Certificado no encontrado" description="No existe o no te pertenece." />
  if (error) return <ErrorState title="No pudimos cargar el certificado" onRetry={() => mutate()} />
  if (!cert) return <LoadingBlock className="py-12" />

  const verifyUrl = typeof window === "undefined" ? `/verificar/${cert.code}` : `${window.location.origin}/verificar/${cert.code}`

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex justify-end print:hidden">
        <Button variant="ghost" onClick={() => window.print()}><Printer size={16} aria-hidden="true" /> Imprimir o guardar como PDF</Button>
      </div>
      <article
        className="flex flex-col items-center gap-5 rounded-2xl p-8 text-center sm:p-12 print:rounded-none print:shadow-none"
        style={{ background: "#fff", border: "3px double var(--accent)", color: "#1f2937" }}
        aria-label="Certificado"
      >
        <Award size={40} aria-hidden="true" style={{ color: "var(--accent)" }} />
        <p className="text-xs font-semibold tracking-[0.3em]">ACADEMIA OMG</p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Certificado de aprobación</h1>
        <p className="text-sm">Se certifica que</p>
        <p className="font-display text-2xl font-bold break-words sm:text-4xl">{cert.recipientName}</p>
        <p className="text-sm">aprobó el curso</p>
        <p className="font-display text-xl font-semibold break-words sm:text-2xl">{cert.courseTitle}</p>
        <p className="text-sm">Emitido el {fmtDate(cert.issuedAt)}</p>
        <div className="mt-4 flex flex-col gap-1 text-xs" style={{ color: "#4b5563" }}>
          <p>Código de verificación: <strong className="font-mono text-sm">{cert.code}</strong></p>
          <p className="break-all">Verifica su autenticidad en {verifyUrl}</p>
        </div>
      </article>
    </div>
  )
}
