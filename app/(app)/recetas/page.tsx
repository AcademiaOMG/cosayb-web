// TODO: Conectar a GET /api/recetas cuando el backend esté listo
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import Button from "@/components/ui/Button"
import { ChefHat } from "lucide-react"

export default function RecetasPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Recetas"
        subtitle="Fichas técnicas de tus preparaciones"
        action={<Button variant="primary">Nueva receta</Button>}
      />
      <EmptyState
        icon={<ChefHat size={40} style={{ color: "var(--text-muted)" }} />}
        title="No tienes recetas registradas"
        description="Crea fichas técnicas con ingredientes y porciones para calcular el costo exacto de cada preparación."
        action={<Button variant="ghost">Ver tutorial</Button>}
      />
    </div>
  )
}
