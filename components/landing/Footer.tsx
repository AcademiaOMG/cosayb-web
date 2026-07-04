import Link from "next/link"
import { ArrowRight } from "lucide-react"

const footerSections = [
  {
    title: "Producto",
    links: [
      { label: "Características", href: "/#modulos" },
      { label: "Precios", href: "/#precios" },
      { label: "Cómo funciona", href: "/#como-funciona" },
      { label: "Demo", href: "/#demo" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre Nosotros", href: "/nosotros" },
      { label: "Contacto", href: "/contacto" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Blog", href: "#" },
      { label: "Libro de costos", href: "#" },
      { label: "Plantillas gratuitas", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Política de privacidad", href: "/privacy" },
      { label: "Términos y condiciones", href: "/terms" },
      { label: "Política de cookies", href: "/cookies" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#0A1520] px-6 sm:px-10 lg:px-16">
      {/* Top section */}
      <div className="max-w-7xl mx-auto pt-16 sm:pt-20 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_repeat(4,1fr)] gap-10">
          {/* Brand column */}
          <div>
            <Link
              href="/"
              className="font-display font-bold text-2xl text-[#F5F0E8] hover:text-[#7AAEFF] transition-colors duration-200 inline-block mb-4"
            >
              CO$AYB
            </Link>
            <p className="font-body text-sm text-[#4A6080] leading-relaxed mb-6 max-w-[200px]">
              Software de costos de alimentos y bebidas para cocinas profesionales colombianas.
            </p>

            {/* CTA */}
            <Link href="/login" className="btn-spx btn-spx-light">
              Probar gratis
              <ArrowRight size={14} className="btn-arrow" />
            </Link>

            {/* Contact info */}
            <div className="flex flex-col gap-1.5 mt-6">
              <a
                href="mailto:hola@cosayb.co"
                className="font-body text-xs text-[#4A6080] hover:text-[#8FA0BC] transition-colors"
              >
                hola@cosayb.co
              </a>
              <a
                href="https://wa.me/573001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs text-[#4A6080] hover:text-[#8FA0BC] transition-colors"
              >
                WhatsApp: +57 300 123 4567
              </a>
              <span className="font-body text-xs text-[#2A3A50] mt-1">Colombia · 2026</span>
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map(({ title, links }) => (
            <div key={title}>
              <div className="font-body text-xs font-bold text-[#F5F0E8] uppercase tracking-widest mb-5">
                {title}
              </div>
              <ul className="flex flex-col gap-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="font-body text-sm text-[#4A6080] hover:text-[#8FA0BC] transition-colors duration-150"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 py-6"
        style={{ borderTop: "1px solid #1A2A3A" }}
      >
        <p className="font-body text-xs text-[#2A3A50]">
          © 2026 Academia OMG. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-5">
          <Link href="/privacy" className="font-body text-xs text-[#2A3A50] hover:text-[#4A6080] transition-colors">
            Privacidad
          </Link>
          <Link href="/terms" className="font-body text-xs text-[#2A3A50] hover:text-[#4A6080] transition-colors">
            Términos
          </Link>
          <Link href="/cookies" className="font-body text-xs text-[#2A3A50] hover:text-[#4A6080] transition-colors">
            Cookies
          </Link>
        </div>
      </div>
    </footer>
  )
}
