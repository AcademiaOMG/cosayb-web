import type { Metadata } from "next"
import LegalPage, { type LegalSection } from "@/components/landing/LegalPage"
import CookiePreferencesLink from "@/components/legal/CookiePreferencesLink"

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Política de cookies de Academia OMG: qué cookies usamos y cómo gestionarlas.",
  alternates: { canonical: "/cookies" },
}

const sections: LegalSection[] = [
  {
    title: "Qué son las cookies",
    body: "Una cookie es un pequeño archivo de texto que se almacena en tu dispositivo cuando visitas un sitio web. En CO$AYB usamos cookies para que la plataforma funcione correctamente y, solo si lo aceptas, para entender cómo se usa.",
  },
  {
    title: "Cookies necesarias",
    body: "Necesarias para el funcionamiento básico de la plataforma: autenticación, sesión de usuario, organización activa, seguridad y tu elección de cookies. No pueden desactivarse; sin ellas el servicio no funciona.",
  },
  {
    title: "Cookies de medición (opcionales)",
    body: "Nos ayudan a entender cómo se usa la plataforma para mejorarla: páginas visitadas y tiempo de sesión en datos agregados. Solo se activan si las aceptas en el banner de cookies. Hoy no hay herramientas de medición activas; si las incorporamos, respetaremos tu elección.",
  },
  {
    title: "Cómo gestionar tus preferencias",
    body: "Puedes aceptar o rechazar las cookies opcionales en el banner que aparece en tu primera visita y cambiar tu decisión en cualquier momento. También puedes controlar las cookies desde la configuración de tu navegador (Chrome, Firefox, Safari o Edge).",
  },
  {
    title: "Cookies de terceros",
    body: "CO$AYB no usa cookies de publicidad ni de redes sociales. Si iniciamos sesión con Google, Google puede establecer sus propias cookies durante ese flujo. Si en el futuro integramos otros servicios que utilicen cookies, actualizaremos esta política.",
  },
]

export default function CookiesPage() {
  return (
    <>
      <LegalPage
        title="Política de"
        highlight="Cookies"
        updated="octubre de 2026"
        sections={sections}
        ctaText="¿Tienes preguntas sobre el uso de cookies?"
      />
      <div className="bg-[#F5F0E8] px-6 sm:px-10 lg:px-16 pb-12 -mt-4">
        <div className="max-w-4xl mx-auto">
          <CookiePreferencesLink className="font-body text-sm underline text-[#1B4FD8]" />
        </div>
      </div>
    </>
  )
}
