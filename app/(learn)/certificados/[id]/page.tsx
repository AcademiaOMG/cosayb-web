"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { Printer } from "lucide-react"
import CertificateArt from "@/components/lms/CertificateArt"
import SignInRequired from "@/components/lms/SignInRequired"
import { lms } from "@/lib/lms/api"
import { errorStatus } from "@/lib/lms/hooks"
import { Button, ErrorPanel, LinkButton, Skeleton } from "@/components/lms/ui"

export default function CertificadoPage() {
  const { id } = useParams<{ id: string }>()
  const { data: cert, error, mutate } = useSWR(`lms/cert/${id}`, () => lms.certificate(id), { revalidateOnFocus: false })

  if (errorStatus(error) === 401) return <SignInRequired message="Inicia sesión para ver tu certificado." />
  if (errorStatus(error) === 404) return <ErrorPanel title="Certificado no encontrado" description="No existe o no te pertenece." />
  if (error) return <ErrorPanel title="No pudimos cargar el certificado" onRetry={() => mutate()} />
  if (!cert) return <Skeleton className="mx-auto w-full max-w-[1000px] !rounded-3xl" style={{ aspectRatio: "297 / 210" }} />

  const verifyUrl = typeof window === "undefined" ? `/verificar/${cert.code}` : `${window.location.origin}/verificar/${cert.code}`

  return (
    <div className="flex flex-col gap-5">
      <div className="l-no-print flex flex-wrap items-center justify-between gap-3">
        <LinkButton href="/certificados" variant="ghost" size="sm">Mis certificados</LinkButton>
        <Button onClick={() => window.print()}><Printer size={16} aria-hidden="true" /> Imprimir o guardar como PDF</Button>
      </div>
      <CertificateArt name={cert.recipientName} course={cert.courseTitle} issuedAt={cert.issuedAt} code={cert.code} verifyUrl={verifyUrl} />
    </div>
  )
}
