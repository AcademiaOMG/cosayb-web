"use client"
import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"

const navLinks = [
  { label: "Producto", href: "#modulos" },
  { label: "Cursos", href: "#academia" },
  { label: "Libro", href: "#libro" },
  { label: "Blog", href: "#blog" },
]

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#F5F0E8] border-b border-[#DDD6C8] px-6 sm:px-10 lg:px-16 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link
              href="/"
              className="font-display text-2xl sm:text-3xl font-bold text-[#12213A] tracking-tight"
            >
              CO$AYB
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="font-body text-sm text-[#4A4438] tracking-wide hover:text-[#12213A] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="border border-[#DDD6C8] text-[#12213A] px-4 py-2 text-sm rounded-lg hover:bg-[#EDE7DB] transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/login"
              className="bg-[#1B4FD8] text-white px-4 py-2 text-sm font-semibold rounded-lg hover:bg-[#1540B0] transition-colors"
            >
              Empezar gratis
            </Link>
          </div>

          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <div className="w-6 h-0.5 bg-[#12213A] rounded" />
            <div className="w-6 h-0.5 bg-[#12213A] rounded" />
            <div className="w-6 h-0.5 bg-[#12213A] rounded" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 bg-[#F5F0E8] z-50 flex flex-col px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-2xl font-bold text-[#12213A]">CO$AYB</span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
              className="p-2"
            >
              <X size={24} className="text-[#12213A]" />
            </button>
          </div>
          <nav className="flex flex-col items-center justify-center flex-1 gap-8">
            {navLinks.map(({ label, href }, i) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="font-display text-4xl text-[#12213A] uppercase tracking-tight"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="pb-8">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="w-full bg-[#1B4FD8] text-white py-3 rounded-lg font-body font-semibold text-sm flex items-center justify-center"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
