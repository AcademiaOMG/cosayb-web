"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"
import Badge from "@/components/ui/Badge"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import { useCatalog } from "@/lib/lms/hooks"

export default function CursosPage() {
  const { data, error, mutate } = useCatalog()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>Cursos</h1>
        <p className="max-w-2xl text-sm" style={{ color: "var(--text-muted)" }}>
          Aprende a tu ritmo, completa las lecciones y evaluaciones, y obtén un certificado verificable.
        </p>
      </header>

      {error ? (
        <ErrorState title="No pudimos cargar los cursos" onRetry={() => mutate()} />
      ) : !data ? (
        <LoadingBlock className="py-12" />
      ) : data.length === 0 ? (
        <EmptyState icon={<BookOpen size={28} />} title="Aún no hay cursos publicados" description="Vuelve pronto: estamos preparando contenido nuevo." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <li key={c.id}>
              <Link
                href={`/cursos/${c.slug}`}
                className="flex h-full flex-col gap-3 rounded-2xl p-5 transition-shadow hover:shadow-md"
                style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{c.title}</h2>
                  {c.includedInAcademia && <Badge variant="accent">Plan Academia</Badge>}
                </div>
                <p className="line-clamp-3 text-sm" style={{ color: "var(--text-secondary)" }}>{c.description}</p>
                <p className="mt-auto text-xs" style={{ color: "var(--text-muted)" }}>
                  {c.lessonCount} {c.lessonCount === 1 ? "lección" : "lecciones"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
