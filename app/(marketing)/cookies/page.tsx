import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Política de cookies de Academia OMG: qué cookies usamos y cómo gestionarlas.",
  robots: { index: false, follow: false },
}

const sections = [
  {
    title: "Qué son las cookies",
    body: "Una cookie es un pequeño archivo de texto que se almacena en tu dispositivo cuando visitas un sitio web. En CO$AYB usamos cookies para que la plataforma funcione correctamente y para mejorar tu experiencia.",
  },
  {
    title: "Cookies esenciales",
    body: "Necesarias para el funcionamiento básico de la plataforma: autenticación, sesión de usuario y seguridad. Ejemplos: token de sesión, CSRF token. No puedes desactivarlas, sin estas cookies el servicio no puede funcionar.",
  },
  {
    title: "Cookies funcionales",
    body: "Recuerdan tus preferencias de uso: modo de vista, idioma y configuraciones de tu cuenta. Puedes desactivarlas, pero algunas funciones recordarán menos tus preferencias.",
  },
  {
    title: "Cookies analíticas",
    body: "Nos ayudan a entender cómo se usa la plataforma para mejorarla. No contienen información personal identificable. Recopilan páginas visitadas y tiempo de sesión en datos agregados. Puedes desactivarlas desde la configuración de tu navegador.",
  },
  {
    title: "Cómo gestionar las cookies",
    body: "Puedes controlar las cookies desde la configuración de tu navegador: Google Chrome, Mozilla Firefox, Safari o Microsoft Edge. Cada navegador tiene sus propias instrucciones para administrar cookies.",
  },
  {
    title: "Cookies de terceros",
    body: "Actualmente CO$AYB no usa cookies de publicidad ni redes sociales. Si en el futuro integramos servicios de terceros que utilicen cookies, actualizaremos esta política y te notificaremos con anticipación.",
  },
]

export default function CookiesPage() {
  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-[#12213A] py-16 sm:py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <h1
            className="font-display font-extrabold text-[#F5F0E8] leading-[1.05] mb-4"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
          >
            Política de{" "}
            <span className="text-[#7AAEFF]">Cookies</span>
          </h1>
          <p className="font-body text-lg text-[#8FA0BC]">
            Última actualización: julio de 2026
          </p>
        </div>
      </section>

      {/* ─── CONTENT ──────────────────────────────────────────────── */}
      <section className="bg-[#F5F0E8] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-6">
            {sections.map(({ title, body }, i) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-[#DDD6C8]"
              >
                <div className="flex items-start gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-[#DEEAFF] flex items-center justify-center font-body font-bold text-sm text-[#1B4FD8]">
                    {i + 1}
                  </span>
                  <div>
                    <h2 className="font-body font-bold text-[#12213A] text-lg mb-2">{title}</h2>
                    <p className="font-body text-sm text-[#4A4438] leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-12 pt-8 border-t border-[#DDD6C8]">
            <p className="font-body text-sm text-[#7A6E60] mb-4">
              ¿Tienes preguntas sobre el uso de cookies?
            </p>
            <Link href="/contacto" className="btn-spx btn-spx-dark">
              Contáctanos
              <ArrowRight size={16} className="btn-arrow" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
