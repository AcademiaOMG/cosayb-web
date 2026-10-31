import AcademiaTabs from "@/components/plataforma/academia/AcademiaTabs"
import PlatformPage from "@/components/plataforma/PlatformPage"

// La academia en la consola: datos en solo lectura y alta de usuarios. La gestión vive en el LMS.
export default function AcademiaLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformPage title="Academia" description="Datos del LMS y usuarios de la academia. Los cursos, instructores y matrículas se gestionan dentro del LMS.">
      <AcademiaTabs />
      {children}
    </PlatformPage>
  )
}
