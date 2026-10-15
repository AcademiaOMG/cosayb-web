import type { Metadata } from "next"
import LegalPage, { type LegalSection } from "@/components/landing/LegalPage"

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad y tratamiento de datos personales de Academia OMG (Ley 1581 de 2012).",
  alternates: { canonical: "/privacy" },
}

const sections: LegalSection[] = [
  {
    title: "Responsable del tratamiento",
    body: "Academia OMG, con domicilio en Colombia, es la entidad responsable del tratamiento de los datos personales recopilados a través de la plataforma CO$AYB (cosayb.co). Para cualquier consulta relacionada con privacidad, puedes escribirnos a hola@cosayb.co.",
  },
  {
    title: "Datos que recopilamos",
    body: "Recopilamos los datos que proporcionas al registrarte (nombre, correo electrónico), los datos de facturación (documento, ciudad, país y los últimos 4 dígitos del medio de pago), los datos que ingresas al usar la plataforma (ingredientes, recetas, costos) y datos de uso técnico (dirección IP, navegador, tipo de dispositivo) para mejorar el servicio.",
  },
  {
    title: "Finalidad del tratamiento",
    body: "Usamos tus datos para: (a) prestarte el servicio de CO$AYB, (b) gestionar tu suscripción, facturas y soporte, (c) enviarte comunicaciones relacionadas con tu cuenta, (d) mejorar la plataforma, y (e) cumplir obligaciones legales. No usaremos tus datos para publicidad de terceros sin tu consentimiento explícito.",
  },
  {
    title: "Pagos",
    body: "Los pagos son procesados por una pasarela de pagos certificada. CO$AYB no almacena el número completo de tu tarjeta ni su código de seguridad; solo conservamos una referencia y los últimos 4 dígitos para que puedas identificar tu medio de pago.",
  },
  {
    title: "Compartición de datos",
    body: "No vendemos ni compartimos tus datos personales con terceros, salvo con proveedores estrictamente necesarios para operar el servicio (infraestructura en la nube, pasarela de pagos y envío de correos) y bajo acuerdos de confidencialidad. Algunos de ellos pueden estar fuera de Colombia, con niveles adecuados de protección.",
  },
  {
    title: "Seguridad",
    body: "Implementamos medidas técnicas y organizativas para proteger tus datos: cifrado en tránsito (TLS), cifrado en reposo, acceso limitado al personal autorizado y copias de seguridad regulares. Las contraseñas se almacenan con hash y nunca en texto plano.",
  },
  {
    title: "Tus derechos",
    body: [
      "De acuerdo con la Ley 1581 de 2012 (Colombia), tienes derecho a conocer, actualizar, rectificar y suprimir tus datos personales, y a revocar tu autorización.",
      "Puedes exportar tus datos y eliminar tu cuenta tú mismo desde Mi cuenta. También puedes escribirnos a hola@cosayb.co con el asunto «Derechos ARCO»; respondemos en máximo 15 días hábiles.",
    ],
  },
  {
    title: "Cookies",
    body: "Usamos cookies esenciales para la sesión y, solo si lo aceptas, cookies de medición. Puedes cambiar tu elección en cualquier momento desde el enlace «Preferencias de cookies» del pie de página. Más detalles en la Política de cookies.",
  },
  {
    title: "Retención de datos",
    body: "Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, tus datos serán eliminados en un plazo de 30 días, excepto aquellos que debamos retener por obligaciones legales o contables (por ejemplo, facturas).",
  },
  {
    title: "Menores de edad",
    body: "CO$AYB está dirigido a personas mayores de edad. No recopilamos intencionalmente datos de menores; si detectamos una cuenta de un menor, la eliminaremos.",
  },
  {
    title: "Cambios a esta política",
    body: "Podemos actualizar esta política. Te notificaremos por correo electrónico o mediante un aviso en la plataforma cuando haya cambios relevantes. La fecha de última actualización aparece al inicio de esta página.",
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de"
      highlight="Privacidad"
      updated="octubre de 2026"
      sections={sections}
      ctaText="¿Tienes preguntas sobre el tratamiento de tus datos?"
    />
  )
}
