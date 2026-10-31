import { redirect } from "next/navigation"

// Los cursos se gestionan en el área de administración del LMS, no en la consola de plataforma.
export default function CursosMovido() {
  redirect("/administracion/cursos")
}
