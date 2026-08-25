"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  X,
  Menu,
  ChevronDown,
  Settings2,
  Monitor,
  GraduationCap,
  BookOpen,
  Users,
  Newspaper,
  HelpCircle,
  Building2,
} from "lucide-react"

type NavChild = { label: string; description: string; href: string; icon: React.ElementType }
type NavGroup = { label: string; href: string; children: NavChild[] }
type NavLink = { label: string; href: string }

function handleSpotlight(e: React.MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`)
  e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`)
}

function NavPanelItem({
  label,
  description,
  href,
  icon: Icon,
  onClick,
}: NavChild & { onClick: () => void }) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      onMouseMove={handleSpotlight}
      className="group relative flex items-start gap-3.5 overflow-hidden rounded-xl px-3 py-3"
    >
      <span
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(140px circle at var(--x, 50%) var(--y, 50%), rgba(27,79,216,0.14), transparent 70%)",
        }}
      />
      <span
        className="pointer-events-none absolute inset-0 z-0 rounded-xl opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
        style={{ boxShadow: "inset 0 0 0 1px rgba(27,79,216,0.18)" }}
      />
      <span className="relative z-10 flex items-center justify-center w-10 h-10 rounded-xl bg-[#DEEAFF] text-[#1B4FD8] shrink-0 transition-all duration-300 ease-out group-hover:bg-[#1B4FD8] group-hover:text-white group-hover:shadow-[0_4px_16px_rgba(27,79,216,0.45)]">
        <Icon size={18} className="transition-transform duration-300 ease-out group-hover:scale-110" />
      </span>
      <span className="relative z-10 flex flex-col gap-0.5 pt-0.5">
        <span className="font-body text-sm font-semibold text-[#12213A] transition-colors duration-200 group-hover:text-[#1B4FD8]">
          {label}
        </span>
        <span className="font-body text-xs text-[#7A6E60] leading-snug">
          {description}
        </span>
      </span>
    </Link>
  )
}

const navGroups: NavGroup[] = [
  {
    label: "Producto",
    href: "/",
    children: [
      { label: "Cómo funciona", description: "El proceso, paso a paso", href: "/#como-funciona", icon: Settings2 },
      { label: "Demo", description: "Mira la plataforma en acción", href: "/#demo", icon: Monitor },
    ],
  },
  {
    label: "Servicios",
    href: "/capacitacion",
    children: [
      { label: "Capacitación", description: "Cursos prácticos de costos gastronómicos", href: "/capacitacion", icon: GraduationCap },
      { label: "Libro de costos", description: "Guía completa de costeo A&B", href: "/libro", icon: BookOpen },
      { label: "Consultoría", description: "Acompañamiento personalizado", href: "/consultoria", icon: Users },
    ],
  },
  {
    label: "Empresa",
    href: "/nosotros",
    children: [
      { label: "Sobre nosotros", description: "Quiénes somos y por qué existe CO$AYB", href: "/nosotros", icon: Building2 },
      { label: "Blog", description: "Artículos y novedades del sector", href: "/blog", icon: Newspaper },
      { label: "Preguntas Frecuentes", description: "Resolvemos tus dudas más comunes", href: "/#faq", icon: HelpCircle },
    ],
  },
]

const navLinks: NavLink[] = [
  { label: "Inversión", href: "/#precios" },
  { label: "Contacto", href: "/contacto" },
]

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    if (href.startsWith("/#")) return false
    return pathname.startsWith(href)
  }

  function isGroupActive(group: NavGroup) {
    return isActive(group.href) || group.children.some(({ href }) => isActive(href))
  }

  const linkColorClasses = (active: boolean) =>
    active
      ? scrolled
        ? "text-[#1B4FD8] font-bold border-b-2 border-[#1B4FD8]"
        : "text-white font-bold border-b-2 border-white"
      : scrolled
        ? "text-[#4A4438] hover:text-[#12213A] hover:bg-[#EDE7DB]"
        : "text-[#C8D5E8] hover:text-[#F5F0E8] hover:bg-white/10"

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
          <nav ref={navRef} className="hidden lg:flex justify-center items-center gap-1 self-stretch">
            {navGroups.map((group) => {
              const active = isGroupActive(group)
              const open = openGroup === group.label
              const dimmed = openGroup !== null && !open
              return (
                <div
                  key={group.label}
                  className="relative h-full transition-opacity duration-200"
                  style={{ opacity: dimmed ? 0.45 : 1 }}
                  onMouseEnter={() => setOpenGroup(group.label)}
                  onMouseLeave={() => setOpenGroup((current) => (current === group.label ? null : current))}
                >
                  <Link
                    href={group.href}
                    aria-haspopup="true"
                    aria-expanded={open}
                    onFocus={() => setOpenGroup(group.label)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setOpenGroup(null)
                    }}
                    className={`whitespace-nowrap font-body text-sm px-3 h-full inline-flex items-center transition-all duration-300 ease-in-out ${linkColorClasses(active)}`}
                  >
                    {group.label}
                  </Link>

                  {open && (
                    <div
                      role="menu"
                      className="animate-nav-panel absolute top-full left-1/2 -translate-x-1/2 w-[320px] rounded-2xl border border-[#DDD6C8]/70 bg-[#FDFAF6]/95 shadow-2xl backdrop-blur-md p-2 pt-3 z-50 origin-top"
                    >
                      {group.children.map((child) => (
                        <NavPanelItem key={child.label} {...child} onClick={() => setOpenGroup(null)} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {navLinks.map(({ label, href }) => {
              const active = isActive(href)
              const dimmed = openGroup !== null
              return (
                <Link
                  key={label}
                  href={href}
                  className={`whitespace-nowrap font-body text-sm px-3 h-full inline-flex items-center transition-all duration-300 ease-in-out ${linkColorClasses(active)}`}
                  style={{ opacity: dimmed ? 0.45 : 1 }}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Col 3: BOTONES + HAMBURGUESA */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/login"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden md:inline-flex items-center justify-center rounded-full font-body text-sm font-semibold tracking-wide px-7 py-2.5 border-2 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md ${
                scrolled
                  ? "border-[#12213A] text-[#12213A] hover:bg-[#12213A] hover:text-[#F5F0E8]"
                  : "border-white/80 text-white hover:bg-white hover:text-[#1B4FD8]"
              }`}
            >
              Iniciar sesión COSAYB
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
              {navGroups.map((group) => {
                const open = openGroup === group.label
                return (
                  <div key={group.label} className="border-b border-[#DDD6C8]">
                    <div className="flex items-center justify-between w-full">
                      <Link
                        href={group.href}
                        onClick={() => {
                          setMenuOpen(false)
                          setOpenGroup(null)
                        }}
                        className="flex-1 py-3 px-2 font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#12213A]"
                      >
                        {group.label}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setOpenGroup((current) => (current === group.label ? null : group.label))}
                        aria-expanded={open}
                        aria-label={`Mostrar opciones de ${group.label}`}
                        className="p-3 -ml-2 text-[#12213A]"
                      >
                        <ChevronDown
                          size={22}
                          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                    {open && (
                      <div className="flex flex-col gap-1 pb-3">
                        {group.children.map(({ label, description, href, icon: Icon }) => (
                          <Link
                            key={label}
                            href={href}
                            onClick={() => {
                              setMenuOpen(false)
                              setOpenGroup(null)
                            }}
                            className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ease-out active:bg-[#EDE7DB] active:translate-x-1"
                          >
                            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#DEEAFF] text-[#1B4FD8] shrink-0 transition-all duration-200 ease-out group-active:bg-[#1B4FD8] group-active:text-white group-active:scale-110">
                              <Icon size={16} />
                            </span>
                            <span className="flex flex-col gap-0.5 pt-0.5">
                              <span className="font-body text-base font-semibold text-[#12213A]">{label}</span>
                              <span className="font-body text-xs text-[#7A6E60] leading-snug">{description}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

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
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-full font-body text-base font-semibold tracking-wide py-4 border-2 border-[#12213A] text-[#12213A] hover:bg-[#12213A] hover:text-[#F5F0E8] transition-all duration-300 ease-in-out text-center w-full"
              >
                Iniciar sesión COSAYB
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
