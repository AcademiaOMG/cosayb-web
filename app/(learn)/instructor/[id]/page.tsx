"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import CourseEditor from "@/components/lms/admin/CourseEditor"
import { useAdminCourse } from "@/lib/lms/hooks"
import InstructorHeader from "../Header"

export default function CursoInstructorPage() {
  const { id } = useParams<{ id: string }>()
  const { data } = useAdminCourse(id)
  return (
    <div className="flex flex-col gap-6">
      <InstructorHeader
        title={data?.title ?? "Curso"}
        description="Contenido, evaluaciones, matrículas y certificados."
        back={<Link href="/instructor" className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: "var(--l-brand)" }}><ArrowLeft size={14} aria-hidden="true" /> Estudio del instructor</Link>}
      />
      <CourseEditor id={id} />
    </div>
  )
}
