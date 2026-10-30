import { redirect } from "next/navigation"

export default async function CursoMovido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/administracion/cursos/${encodeURIComponent(id)}`)
}
