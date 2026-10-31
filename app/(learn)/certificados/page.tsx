"use client"

import Link from "next/link"
import { Award } from "lucide-react"
import { authClient } from "@/lib/auth"
import { errorStatus, useMyCertificates } from "@/lib/lms/hooks"
import { fmtDate } from "@/lib/saas/format"
import SignInRequired from "@/components/lms/SignInRequired"
import Cover from "@/components/lms/art/Cover"
import { EmptyState, ErrorPanel, LinkButton, PageHeader, Skeleton, rise } from "@/components/lms/ui"

export default function CertificadosPage() {
  const { data: session, isPending } = authClient.useSession()
  const { data, error, mutate } = useMyCertificates()

  if ((!isPending && !session) || errorStatus(error) === 401) return <SignInRequired message="Inicia sesión para ver tus certificados." />
  if (error) return <ErrorPanel onRetry={() => mutate()} />

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Mis certificados" subtitle="Cada certificado se puede imprimir y verificar públicamente con su código." />
      {!data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 !rounded-[22px]" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState art={<span className="block w-56 overflow-hidden rounded-3xl"><Cover coverKey="autor" className="block h-auto w-full" /></span>} title="Aún no tienes certificados" description="Completa todas las lecciones de un curso y aprueba sus evaluaciones para obtener el tuyo." action={<LinkButton href="/mis-cursos">Ir a mis cursos</LinkButton>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((c, i) => (
            <Link key={c.id} href={`/certificados/${c.id}`} className="l-card l-card-hover l-rise relative flex flex-col gap-3 overflow-hidden p-5" style={rise(i % 8)}>
              <span aria-hidden="true" className="absolute -right-8 -top-8 h-28 w-28 rounded-full" style={{ background: "var(--l-amber-bg)" }} />
              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ background: "linear-gradient(135deg,#f5a524,#d4860a)" }} aria-hidden="true"><Award size={24} /></span>
              <span className="relative min-w-0"><span className="block text-xs font-bold" style={{ color: "var(--l-muted)" }}>Certificado de aprobación</span><span className="block break-words text-lg font-extrabold leading-snug">{c.courseTitle}</span></span>
              <span className="relative mt-auto flex items-center justify-between text-xs font-bold" style={{ color: "var(--l-muted)" }}><span>{fmtDate(c.issuedAt)}</span><span className="font-mono">{c.code}</span></span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
