import type { ReactNode } from "react"

/** Cabecera de las páginas del instructor dentro del LMS. */
export default function InstructorHeader({ title, description, back }: { title: string; description?: string; back?: ReactNode }) {
  return (
    <header className="flex flex-col gap-1">
      {back}
      <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h1>
      {description && <p className="max-w-2xl text-sm font-semibold" style={{ color: "var(--l-muted)" }}>{description}</p>}
    </header>
  )
}
