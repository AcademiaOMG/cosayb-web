"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, GraduationCap, BookOpen, Phone, Newspaper, Laptop, LayoutDashboard, ArrowLeft } from "lucide-react"
import { authClient } from "@/lib/auth"

const links = [
  { label: "Capacitación", href: "/capacitacion", icon: GraduationCap, desc: "Programas prácticos de costos" },
  { label: "Consultoría", href: "/consultoria", icon: BookOpen, desc: "Acompañamiento personalizado" },
  { label: "Blog", href: "/blog", icon: Newspaper, desc: "Artículos y recursos" },
  { label: "CO$AYB", href: "/login", icon: Laptop, desc: "Software de costos" },
  { label: "Contacto", href: "/contacto", icon: Phone, desc: "Escríbenos" },
]

export default function NotFound() {
  const { data: session } = authClient.useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLoggedIn = mounted && !!session?.user

  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#12213A] min-h-screen flex flex-col items-center justify-center px-6 sm:px-10 lg:px-16">
        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(27,79,216,0.15) 0%, transparent 70%)",
            transform: "translate(50%, -60%)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(122,174,255,0.08) 0%, transparent 70%)",
            transform: "translate(-50%, 50%)",
          }}
        />
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Big 404 number */}
          <div className="mb-8">
            <span
              className="font-display font-extrabold leading-none tracking-tighter"
              style={{
                fontSize: "clamp(6rem, 18vw, 12rem)",
                background: "linear-gradient(135deg, rgba(27,79,216,0.3) 0%, rgba(122,174,255,0.15) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "blur(0.5px)",
              }}
            >
              404
            </span>
          </div>

          <h1
            className="font-display font-extrabold text-[#F5F0E8] leading-[1.05] mb-5 -mt-16 sm:-mt-20"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Esta página se{" "}
            <span className="text-[#7AAEFF]">perdió en la cocina</span>
          </h1>

          <p className="font-body text-lg text-[#8FA0BC] max-w-lg mx-auto mb-12 leading-relaxed">
            Parece que esta ruta no existe o fue movida a otro lugar.
            No te preocupes, hay mucho por descubrir.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn-spx btn-spx-accent">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            ) : (
              <Link href="/" className="btn-spx btn-spx-accent">
                Ir al inicio
                <ArrowRight size={16} className="btn-arrow" />
              </Link>
            )}
            <button
              onClick={() => window.history.back()}
              className="btn-spx btn-spx-light"
            >
              <ArrowLeft size={16} />
              Volver atrás
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
