import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Política de cookies de CO$AYB: qué cookies usamos y cómo gestionarlas.",
  robots: { index: false, follow: false },
}

const cookieTypes = [
  {
    name: "Cookies esenciales",
    purpose: "Necesarias para el funcionamiento básico de la plataforma: autenticación, sesión de usuario y seguridad.",
    examples: "Token de sesión, CSRF token.",
    canDisable: "No. Sin estas cookies el servicio no puede funcionar.",
  },
  {
    name: "Cookies funcionales",
    purpose: "Recuerdan tus preferencias de uso: modo de vista, idioma y configuraciones de tu cuenta.",
    examples: "Preferencias de visualización.",
    canDisable: "Sí, pero algunas funciones recordarán menos tus preferencias.",
  },
  {
    name: "Cookies analíticas",
    purpose: "Nos ayudan a entender cómo se usa la plataforma para mejorarla. No contienen información personal identificable.",
    examples: "Páginas visitadas, tiempo de sesión (datos agregados).",
    canDisable: "Sí, desde la configuración de tu navegador.",
  },
]

export default function CookiesPage() {
  return (
    <section className="bg-[#F5F0E8] py-20 sm:py-28 px-6 sm:px-10 lg:px-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="font-body text-xs text-[#7A6E60] hover:text-[#12213A] transition-colors mb-6 inline-block"
          >
            ← Volver al inicio
          </Link>
          <h1
            className="font-display font-extrabold text-[#12213A] leading-tight mb-3"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Política de Cookies
          </h1>
          <p className="font-body text-sm text-[#7A6E60]">Última actualización: julio de 2026</p>
        </div>

        <p className="font-body text-base text-[#4A4438] leading-relaxed mb-10">
          Una cookie es un pequeño archivo de texto que se almacena en tu dispositivo cuando visitas
          un sitio web. En CO$AYB usamos cookies para que la plataforma funcione correctamente y para
          mejorar tu experiencia.
        </p>

        {/* What we use */}
        <h2 className="font-body font-bold text-[#12213A] text-xl mb-6">
          Tipos de cookies que usamos
        </h2>
        <div className="flex flex-col gap-5 mb-12">
          {cookieTypes.map(({ name, purpose, examples, canDisable }) => (
            <div
              key={name}
              className="bg-white border border-[#DDD6C8] rounded-xl p-6"
            >
              <h3 className="font-body font-bold text-[#12213A] mb-3">{name}</h3>
              <dl className="flex flex-col gap-2">
                <div>
                  <dt className="font-body text-xs font-semibold text-[#7A6E60] uppercase tracking-wide mb-0.5">
                    Para qué se usan
                  </dt>
                  <dd className="font-body text-sm text-[#4A4438]">{purpose}</dd>
                </div>
                <div>
                  <dt className="font-body text-xs font-semibold text-[#7A6E60] uppercase tracking-wide mb-0.5">
                    Ejemplos
                  </dt>
                  <dd className="font-body text-sm text-[#4A4438]">{examples}</dd>
                </div>
                <div>
                  <dt className="font-body text-xs font-semibold text-[#7A6E60] uppercase tracking-wide mb-0.5">
                    ¿Puedes desactivarlas?
                  </dt>
                  <dd className="font-body text-sm text-[#4A4438]">{canDisable}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        {/* How to manage */}
        <h2 className="font-body font-bold text-[#12213A] text-xl mb-4">
          Cómo gestionar las cookies
        </h2>
        <p className="font-body text-base text-[#4A4438] leading-relaxed mb-4">
          Puedes controlar las cookies desde la configuración de tu navegador. A continuación algunos
          enlaces de ayuda para los navegadores más comunes:
        </p>
        <ul className="flex flex-col gap-2 mb-12 pl-4">
          {[
            { label: "Google Chrome", href: "https://support.google.com/chrome/answer/95647" },
            { label: "Mozilla Firefox", href: "https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies" },
            { label: "Safari", href: "https://support.apple.com/es-co/guide/safari/sfri11471" },
            { label: "Microsoft Edge", href: "https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406" },
          ].map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-sm text-[#1B4FD8] hover:underline"
              >
                {label} →
              </a>
            </li>
          ))}
        </ul>

        {/* Third parties */}
        <h2 className="font-body font-bold text-[#12213A] text-xl mb-4">
          Cookies de terceros
        </h2>
        <p className="font-body text-base text-[#4A4438] leading-relaxed mb-12">
          Actualmente CO$AYB no usa cookies de publicidad ni redes sociales. Si en el futuro
          integramos servicios de terceros que utilicen cookies, actualizaremos esta política y
          te notificaremos con anticipación.
        </p>

        <div className="pt-8 border-t border-[#DDD6C8]">
          <p className="font-body text-sm text-[#7A6E60]">
            ¿Tienes preguntas sobre el uso de cookies?{" "}
            <Link href="/contacto" className="text-[#1B4FD8] hover:underline font-semibold">
              Contáctanos →
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
