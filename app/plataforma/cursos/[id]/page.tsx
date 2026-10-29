"use client"

import { useParams } from "next/navigation"
import PlatformPage from "@/components/plataforma/PlatformPage"
import CourseEditor from "@/components/lms/admin/CourseEditor"
import { useAdminCourse } from "@/lib/lms/hooks"

export default function CursoAdminPage() {
  const { id } = useParams<{ id: string }>()
  const { data } = useAdminCourse(id)
  return (
    <PlatformPage title={data?.title ?? "Curso"} description="Contenido, evaluaciones, matrículas y certificados.">
      <CourseEditor id={id} />
    </PlatformPage>
  )
}
