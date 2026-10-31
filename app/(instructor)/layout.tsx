import type { Metadata } from "next"
import LearnShell from "@/components/lms/LearnShell"
import "@/app/(learn)/lms.css"

export const metadata: Metadata = {
  title: { default: "Instructor", template: "%s — Instructor · Academia OMG" },
  robots: { index: false },
}

// Área de INSTRUCTOR: su propio menú y portada; sin menús de estudiante ni de administración.
export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return <LearnShell area="instructor">{children}</LearnShell>
}
