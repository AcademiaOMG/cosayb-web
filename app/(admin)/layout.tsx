import type { Metadata } from "next"
import LearnShell from "@/components/lms/LearnShell"
import "@/app/(learn)/lms.css"

export const metadata: Metadata = {
  title: { default: "Administración", template: "%s — Administración · Academia OMG" },
  robots: { index: false },
}

// Área de ADMINISTRADOR: su propio menú y portada; sin menús de estudiante ni de instructor.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <LearnShell area="admin">{children}</LearnShell>
}
