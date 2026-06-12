import Link from "next/link"

const footerCols = [
  {
    title: "Producto",
    links: [
      { label: "Inventario", href: "#" },
      { label: "Recetas", href: "#" },
      { label: "Valoración", href: "#" },
      { label: "Punto de equilibrio", href: "#" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "Blog", href: "#" },
      { label: "Libro de costos", href: "#" },
      { label: "Plantillas", href: "#" },
      { label: "Comunidad", href: "#" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Nosotros", href: "#" },
      { label: "Consultoría", href: "#" },
      { label: "Términos", href: "/terminos" },
      { label: "Privacidad", href: "/privacidad" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#0D1A2E] py-12 sm:py-16 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand col */}
          <div>
            <div className="font-display font-bold text-xl text-[#F5F0E8]">CO$AYB</div>
            <p className="font-body text-sm text-[#8FA0BC] mt-2 leading-relaxed">
              Software de costos de alimentos y bebidas para cocinas profesionales colombianas.
            </p>
          </div>

          {/* Link cols */}
          {footerCols.map(({ title, links }) => (
            <div key={title}>
              <div className="font-body text-xs font-bold text-[#F5F0E8] uppercase tracking-widest mb-4">
                {title}
              </div>
              {links.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="font-body text-sm text-[#8FA0BC] hover:text-[#F5F0E8] block mb-2 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="border-t border-[#1E2F4A] pt-6">
          <p className="font-body text-xs text-[#4A5A70] text-center">
            © 2026 Academia OMG. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
