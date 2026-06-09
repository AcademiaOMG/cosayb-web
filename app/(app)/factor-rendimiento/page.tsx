// TODO: Conectar a GET /api/factores-rendimiento cuando el backend esté listo
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import Button from "@/components/ui/Button"
import { Scale } from "lucide-react"

export default function FactorRendimientoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Factor de Rendimiento"
        subtitle="Merma y rendimiento real de ingredientes"
        action={<Button variant="primary">Nuevo factor</Button>}
      />
      <EmptyState
        icon={<Scale size={40} style={{ color: "var(--text-muted)" }} />}
        title="Sin factores de rendimiento registrados"
        description="Define el rendimiento real de cada ingrediente tras limpieza y cocción para que los costos de tus recetas sean precisos."
        action={<Button variant="ghost">¿Qué es el factor de rendimiento?</Button>}
      />
    </div>
  )
}
