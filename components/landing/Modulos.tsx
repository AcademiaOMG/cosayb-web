import { Package, Scale, ChefHat, UtensilsCrossed, TrendingUp, BarChart2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const modules: {
  icon: LucideIcon
  name: string
  description: string
  badge?: string
  featured?: boolean
}[] = [
  {
    icon: Package,
    name: "Inventario",
    description: "Más de 1.000 ingredientes con costo por gramo calculado automáticamente. Actualiza precios en segundos.",
    featured: true,
  },
  {
    icon: Scale,
    name: "Factor de Rendimiento",
    description: "Calcula el costo real después de mermas en proteínas, vegetales y cualquier insumo.",
  },
  {
    icon: ChefHat,
    name: "Recetas",
    description: "Subrecetas anidadas con costo en cascada. Cada cambio se refleja en tiempo real en todo el sistema.",
    featured: true,
  },
  {
    icon: UtensilsCrossed,
    name: "Menú",
    description: "Agrupa recetas y analiza el costo por persona antes de fijar tus precios de carta.",
  },
  {
    icon: TrendingUp,
    name: "Valoración A&B",
    description: "Motor de pricing: convierte el costo de producción al precio sugerido de venta con margen óptimo.",
    featured: true,
  },
  {
    icon: BarChart2,
    name: "Punto de Equilibrio",
    description: "Descubre cuántos platos tienes que vender para cubrir costos fijos y no perder dinero.",
  },
]

export default function Modulos() {
  return (
    <section id="modulos" className="bg-[#EDE7DB] py-14 sm:py-20 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div>
            <span className="inline-block bg-[#DEEAFF] text-[#1434A4] text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-5">
              Plataforma completa
            </span>
            <h2
              className="font-display font-extrabold text-[#12213A] mb-3"
              style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)" }}
            >
              Todo lo que necesita tu cocina
              <br />
              para ser rentable
            </h2>
            <p className="font-body text-lg text-[#7A6E60]">Seis módulos integrados. Un solo sistema.</p>
          </div>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map(({ icon: Icon, name, description, featured }) => (
            <div
              key={name}
              className={`card-hover relative rounded-2xl p-7 flex flex-col gap-5 ${
                featured
                  ? "bg-[#12213A] border border-[#1B4FD8]/30"
                  : "bg-[#FDFAF6] border border-[#DDD6C8] hover:border-[#1B4FD8]/40"
              }`}
              style={
                featured
                  ? { boxShadow: "0 4px 20px rgba(27,79,216,0.15)" }
                  : {}
              }
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  featured ? "bg-[#1B4FD8]/20" : "bg-[#DEEAFF]"
                }`}
              >
                <Icon size={22} className={featured ? "text-[#7AAEFF]" : "text-[#1B4FD8]"} />
              </div>

              {/* Text */}
              <div className="flex-1">
                <h3
                  className={`font-body font-bold text-base mb-2 ${
                    featured ? "text-[#F5F0E8]" : "text-[#12213A]"
                  }`}
                >
                  {name}
                </h3>
                <p
                  className={`font-body text-sm leading-relaxed ${
                    featured ? "text-[#8FA0BC]" : "text-[#4A4438]"
                  }`}
                >
                  {description}
                </p>
              </div>

              {/* Badge */}
              <span
                className={`inline-block self-start text-[11px] font-semibold px-3 py-1 rounded-full ${
                  featured
                    ? "bg-[#1B4FD8]/30 text-[#7AAEFF]"
                    : "bg-[#DEEAFF] text-[#1434A4]"
                }`}
              >
                Incluido en Pro
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
