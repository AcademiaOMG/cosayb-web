"use client"
import { useState } from "react"
import { Plus, Minus } from "lucide-react"

const faqs = [
  {
    q: "¿Necesito instalar algo?",
    a: "No. CO$AYB es 100% web. Funciona desde cualquier navegador moderno sin descargas, sin instalaciones y sin configuraciones técnicas. Solo crea tu cuenta y empieza.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí, completamente. No hay contratos de permanencia ni penalizaciones. Puedes cancelar tu suscripción en cualquier momento desde tu perfil y dejarás de ser cobrado el siguiente ciclo.",
  },
  {
    q: "¿Cómo funciona la prueba gratuita?",
    a: "Tienes 14 días de acceso completo sin tarjeta de crédito. Al terminar el período, puedes elegir un plan de pago para continuar o simplemente no hacer nada y tu cuenta pasará al modo gratuito limitado.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Sí. Todos los datos se almacenan en servidores con cifrado en tránsito y en reposo. Nunca compartimos tu información con terceros. Puedes exportar o eliminar tu información en cualquier momento.",
  },
  {
    q: "¿Puedo usar CO$AYB desde el celular?",
    a: "Sí. La plataforma está diseñada para ser completamente responsiva. Funciona desde smartphones y tablets sin necesidad de una app adicional. Todos los módulos están disponibles en móvil.",
  },
  {
    q: "¿Incluye ingredientes con precios colombianos?",
    a: "Sí. CO$AYB incluye un banco de más de 1.000 ingredientes con precios de referencia del mercado colombiano. Puedes usarlos directamente o ajustar los precios según tu región y proveedor.",
  },
  {
    q: "¿Qué pasa si cambio el precio de un ingrediente?",
    a: "El cambio se propaga automáticamente a todas las recetas y menús que usan ese ingrediente. Los costos se actualizan en tiempo real sin que tengas que recalcular nada manualmente.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="border-b transition-colors duration-200"
      style={{ borderColor: open ? "rgba(27,79,216,0.25)" : "#DDD6C8" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-6 py-5 text-left"
        aria-expanded={open}
      >
        <span
          className="font-body font-semibold text-base transition-colors duration-200"
          style={{ color: open ? "#1B4FD8" : "#12213A" }}
        >
          {q}
        </span>
        <span
          className="shrink-0 w-7 h-7 rounded flex items-center justify-center transition-all duration-200"
          style={{
            background: open ? "rgba(27,79,216,0.08)" : "rgba(18,33,58,0.04)",
            border: `1px solid ${open ? "rgba(27,79,216,0.25)" : "rgba(18,33,58,0.12)"}`,
          }}
        >
          {open ? (
            <Minus size={14} className="text-[#1B4FD8]" />
          ) : (
            <Plus size={14} className="text-[#4A4438]" />
          )}
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "200px" : "0px", opacity: open ? 1 : 0 }}
      >
        <p className="font-body text-sm text-[#4A4438] leading-relaxed pb-5 pr-12">
          {a}
        </p>
      </div>
    </div>
  )
}

export default function FAQ() {
  return (
    <section id="faq" className="bg-[#F5F0E8] py-14 sm:py-20 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.6fr] gap-16 items-start">
          {/* Left — header */}
          <div className="lg:sticky lg:top-28">
            <span className="inline-block bg-[#DEEAFF] text-[#1434A4] text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-5">
              Preguntas frecuentes
            </span>
            <h2
              className="font-display font-extrabold text-[#12213A] leading-[1.05] mb-4"
              style={{ fontSize: "clamp(2.2rem, 5.5vw, 3.5rem)" }}
            >
              Resolvemos
              <br />
              tus dudas
            </h2>
            <p className="font-body text-[#7A6E60] text-base leading-relaxed mb-8 max-w-sm">
              Si tienes una pregunta que no aparece aquí, escríbenos y te respondemos en menos de 24 horas.
            </p>
            <a
              href="/contacto"
              className="btn-spx btn-spx-dark px-6 py-3"
            >
              Ir a Contacto
            </a>
          </div>

          {/* Right — accordion */}
          <div>
            {faqs.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
