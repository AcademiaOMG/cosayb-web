import { Package, Scale, ChefHat, UtensilsCrossed, TrendingUp, BarChart2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const modules: { icon: LucideIcon; name: string; description: string }[] = [
  {
    icon: Package,
    name: "Inventario",
    description: "Más de 1.000 ingredientes con costo por gramo calculado automáticamente.",
  },
  {
    icon: Scale,
    name: "Factor de Rendimiento",
    description: "Costo real después de mermas en proteínas y vegetales.",
  },
  {
    icon: ChefHat,
    name: "Recetas",
    description: "Subrecetas anidadas con costo en cascada calculado en tiempo real.",
  },
  {
    icon: UtensilsCrossed,
    name: "Menú",
    description: "Agrupa recetas y ve el costo por persona antes de fijar precios.",
  },
  {
    icon: TrendingUp,
    name: "Valoración A&B",
    description: "Motor de pricing: costo de producción al precio sugerido de venta.",
  },
  {
    icon: BarChart2,
    name: "Punto de Equilibrio",
    description: "Cuántos platos tienes que vender para no perder dinero.",
  },
]

export default function Modulos() {
  return (
    <section id="modulos" className="bg-[#EDE7DB] py-20 sm:py-28 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2
            className="font-display font-bold text-[#12213A] mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Todo lo que necesita tu cocina para ser rentable
          </h2>
          <p className="font-body text-[#7A6E60]">Seis módulos integrados. Un solo sistema.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map(({ icon: Icon, name, description }) => (
            <div
              key={name}
              className="bg-[#FDFAF6] border border-[#DDD6C8] rounded-2xl p-6 hover:border-[#1B4FD8] transition-colors duration-200"
            >
              <div className="w-10 h-10 bg-[#DEEAFF] rounded-xl flex items-center justify-center mb-4">
                <Icon size={20} className="text-[#1B4FD8]" />
              </div>
              <h3 className="font-body font-bold text-sm text-[#12213A] mb-1">{name}</h3>
              <p className="font-body text-xs text-[#4A4438] leading-relaxed">{description}</p>
              <span className="inline-block bg-[#DEEAFF] text-[#1434A4] text-[10px] font-semibold px-2 py-0.5 rounded mt-3">
                Incluido en Pro
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
