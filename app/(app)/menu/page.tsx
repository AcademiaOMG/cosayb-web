// TODO: Conectar a GET /api/menus cuando el backend esté listo
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import Button from "@/components/ui/Button"
import { UtensilsCrossed } from "lucide-react"

export default function MenuPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Menú"
        subtitle="Carta y estructura de precios"
        action={<Button variant="primary">Nuevo menú</Button>}
      />
      <EmptyState
        icon={<UtensilsCrossed size={40} style={{ color: "var(--text-muted)" }} />}
        title="No tienes menús creados"
        description="Organiza tus recetas en menús y establece precios de venta para analizar la rentabilidad de tu carta."
        action={<Button variant="ghost">Crear primer menú</Button>}
      />
    </div>
  )
}
