// TODO: Conectar a GET /api/valoraciones cuando el backend esté listo
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import Button from "@/components/ui/Button"
import { TrendingUp } from "lucide-react"

export default function ValoracionPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Valoración A&B"
        subtitle="Análisis de rentabilidad por período"
        action={<Button variant="primary">Nueva valoración</Button>}
      />
      <EmptyState
        icon={<TrendingUp size={40} style={{ color: "var(--text-muted)" }} />}
        title="No hay valoraciones registradas"
        description="Registra ventas por período y obtén un análisis automático de rentabilidad, costos y utilidades de tu operación."
        action={<Button variant="ghost">Iniciar valoración</Button>}
      />
    </div>
  )
}
