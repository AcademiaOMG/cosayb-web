// TODO: Conectar a GET /api/punto-equilibrio cuando el backend esté listo
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import Button from "@/components/ui/Button"
import { BarChart2 } from "lucide-react"

export default function PuntoEquilibrioPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Punto de Equilibrio"
        subtitle="Cuánto necesitas vender para cubrir costos"
        action={<Button variant="primary">Calcular</Button>}
      />
      <EmptyState
        icon={<BarChart2 size={40} style={{ color: "var(--text-muted)" }} />}
        title="Aún no has calculado tu punto de equilibrio"
        description="Ingresa tus costos fijos, costos variables y precio de venta promedio para saber cuántas unidades necesitas vender cada mes."
        action={<Button variant="ghost">Comenzar cálculo</Button>}
      />
    </div>
  )
}
