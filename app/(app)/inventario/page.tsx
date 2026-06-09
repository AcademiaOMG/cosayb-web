// TODO: Conectar a GET /api/ingredientes cuando el backend esté listo
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import Button from "@/components/ui/Button"
import { Package } from "lucide-react"

export default function InventarioPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventario"
        subtitle="Ingredientes de tu organización"
        action={<Button variant="primary">Nuevo ingrediente</Button>}
      />
      <EmptyState
        icon={<Package size={40} style={{ color: "var(--text-muted)" }} />}
        title="No tienes ingredientes todavía"
        description="Agrega ingredientes manualmente o importa el banco base de ingredientes comunes."
        action={<Button variant="ghost">Importar banco base</Button>}
      />
    </div>
  )
}
