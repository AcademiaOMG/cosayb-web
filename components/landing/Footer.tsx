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
      { label: "Consultoría", href: "/consultoria" },
      { label: "Contacto", href: "/contacto" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Blog", href: "/blog" },
      { label: "Libro de costos", href: "/libro" },
      { label: "Capacitación", href: "/capacitacion" },
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

const socialLinks = [
  { label: "Facebook", href: "https://facebook.com/academiaomg", icon: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
  { label: "Instagram", href: "https://instagram.com/academiaomg", icon: "M16 4H8a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4zm-4 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm3.5-6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" },
  { label: "YouTube", href: "https://youtube.com/@academiaomg", icon: "M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM9.75 15.02V8.48l5.75 3.27-5.75 3.27z" },
  { label: "LinkedIn", href: "https://linkedin.com/company/academiaomg", icon: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" },
]

export default function Footer() {
  return (
    <footer className="bg-[#0A1520] px-6 sm:px-10 lg:px-16">
      {/* Top section */}
      <div className="max-w-7xl mx-auto pt-12 sm:pt-16 pb-10">
        {/* Brand + Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)] gap-8 lg:gap-10">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 inline-flex mb-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Academia OMG"
                className="h-8 w-auto brightness-0 invert"
              />
              <span className="font-display font-bold text-xl text-[#F5F0E8] hover:text-[#7AAEFF] transition-colors duration-200">
                ACADEMIA OMG
              </span>
            </Link>
            <p className="font-body text-sm text-[#8FA0BC] leading-relaxed mb-6 max-w-[280px]">
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
                className="font-body text-xs text-[#8FA0BC] hover:text-[#7AAEFF] transition-colors"
              >
                hola@cosayb.co
              </a>
              <a
                href="https://wa.me/573001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs text-[#8FA0BC] hover:text-[#7AAEFF] transition-colors"
              >
                WhatsApp: +57 300 123 4567
              </a>
              <span className="font-body text-xs text-[#6B85A8] mt-1">Colombia · 2026</span>
            </div>
          </div>

          {/* Link columns — 2x2 on mobile, full grid on desktop */}
          {footerSections.map(({ title, links }) => (
            <div key={title}>
              <div className="font-body text-xs font-bold text-[#F5F0E8] uppercase tracking-widest mb-4">
                {title}
              </div>
              <ul className="flex flex-col gap-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="font-body text-sm text-[#8FA0BC] hover:text-[#7AAEFF] transition-colors duration-150"
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
        className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-5"
        style={{ borderTop: "1px solid #1A2A3A" }}
      >
        <p className="font-body text-xs text-[#6B85A8] text-center sm:text-left">
          © 2026 Academia OMG. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-4">
          {socialLinks.map(({ label, href, icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-[#6B85A8] hover:text-[#7AAEFF] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={icon} />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
