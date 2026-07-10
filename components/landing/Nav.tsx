"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, Menu, ArrowRight } from "lucide-react"

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Capacitación", href: "/capacitacion" },
  { label: "Consultoría", href: "/consultoria" },
  { label: "Libro", href: "/libro" },
  { label: "Blog", href: "/blog" },
  { label: "Sobre nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
]

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 px-6 sm:px-10 lg:px-16 transition-all duration-300 ease-in-out"
        style={
          scrolled
            ? {
                background: "rgba(245, 240, 232, 0.95)",
                backdropFilter: "blur(14px)",
                borderBottom: "1px solid rgba(221, 214, 200, 0.7)",
              }
            : {
                background: "transparent",
                backdropFilter: "none",
                borderBottom: "1px solid transparent",
              }
        }
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">

          {/* Col 1: LOGO */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Academia OMG"
                className={`h-9 w-auto transition-all duration-300 ${
                  scrolled ? "" : "brightness-0 invert"
                }`}
              />
              <span className={`font-display text-lg sm:text-xl font-bold tracking-tight transition-colors duration-300 ease-in-out ${
                scrolled
                  ? "text-[#12213A] hover:text-[#1B4FD8]"
                  : "text-[#F5F0E8] hover:text-[#7AAEFF]"
              }`}>
                ACADEMIA OMG
              </span>
            </Link>
          </div>

          {/* Col 2: MENÚ CENTRADO (desktop) */}
          <nav className="hidden lg:flex justify-center items-center gap-1 self-stretch">
            {navLinks.map(({ label, href }) => {
              const active = isActive(href)
              return (
                <Link
                  key={label}
                  href={href}
                  className={`whitespace-nowrap font-body text-sm px-3 h-full inline-flex items-center transition-all duration-300 ease-in-out ${
                    active
                      ? scrolled
                        ? "text-[#1B4FD8] font-bold border-b-2 border-[#1B4FD8]"
                        : "text-white font-bold border-b-2 border-white"
                      : scrolled
                        ? "text-[#4A4438] hover:text-[#12213A] hover:bg-[#EDE7DB]"
                        : "text-[#C8D5E8] hover:text-[#F5F0E8] hover:bg-white/10"
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Col 3: BOTÓN + HAMBURUESA */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/login"
              className={`hidden md:inline-flex items-center justify-center rounded-full font-body text-sm font-semibold tracking-wide px-7 py-2.5 border-2 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md ${
                scrolled
                  ? "border-[#12213A] text-[#12213A] hover:bg-[#12213A] hover:text-[#F5F0E8]"
                  : "border-white/80 text-white hover:bg-white hover:text-[#1B4FD8]"
              }`}
            >
              Iniciar sesión
            </Link>

            {/* Hamburguesa responsive */}
            <button
              className={`lg:hidden p-2 rounded transition-colors duration-300 ${
                scrolled
                  ? "text-[#12213A] hover:bg-[#EDE7DB]"
                  : "text-[#F5F0E8] hover:bg-white/10"
              }`}
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
          </div>

        </div>
      </header>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-[#F5F0E8] z-50 flex flex-col overflow-y-auto">
          {/* Header — matches desktop nav padding/height */}
          <div className="px-6 sm:px-10 lg:px-16">
            <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Academia OMG"
                  className="h-9 w-auto"
                />
                <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#12213A]">
                  ACADEMIA OMG
                </span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar menú"
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#EDE7DB] transition-colors"
              >
                <X size={22} className="text-[#12213A]" />
              </button>
            </div>
          </div>

          {/* Links */}
          <div className="px-6 sm:px-10 lg:px-16 flex-1 flex flex-col">
            <nav className="max-w-7xl mx-auto flex flex-col flex-1 gap-0 pt-4">
              {navLinks.map(({ label, href }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight px-2 py-3 border-b border-[#DDD6C8] w-full transition-colors ${
                      active
                        ? "text-[#1B4FD8]"
                        : "text-[#12213A] hover:text-[#1B4FD8]"
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* CTAs */}
          <div className="px-6 sm:px-10 lg:px-16 pb-8 pt-6 shrink-0">
            <div className="max-w-7xl mx-auto flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-full font-body text-base font-semibold tracking-wide py-4 border-2 border-[#12213A] text-[#12213A] hover:bg-[#12213A] hover:text-[#F5F0E8] transition-all duration-300 ease-in-out text-center w-full"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="btn-spx btn-spx-accent btn-spx-noborder w-full"
              >
                Empezar 14 días gratis
                <ArrowRight size={14} className="btn-arrow" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
