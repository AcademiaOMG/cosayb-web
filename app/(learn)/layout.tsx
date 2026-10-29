import type { Metadata } from "next"
import LearnShell from "@/components/lms/LearnShell"
import "./lms.css"

export const metadata: Metadata = {
  title: { default: "Academia OMG", template: "%s — Academia OMG" },
  description: "Cursos de Academia OMG: aprende costos de alimentos y bebidas a tu ritmo y certifica lo aprendido.",
}

// Las rutas de aprendizaje no exigen tener un negocio: basta con una cuenta y una matrícula.
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <LearnShell>{children}</LearnShell>
}
