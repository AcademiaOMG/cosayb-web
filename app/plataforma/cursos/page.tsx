import { redirect } from "next/navigation"

// Los cursos se gestionan dentro del LMS, no en la consola de plataforma.
export default function CursosMovido() {
  redirect("/instructor")
}
