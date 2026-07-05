"use client"

import { Mail, MessageCircle, Clock, CheckCircle } from "lucide-react"



const channels = [
  {
    Icon: Mail,
    title: "Correo electrónico",
    value: "hola@cosayb.co",
    href: "mailto:hola@cosayb.co",
    detail: "Respuesta en menos de 24 horas hábiles",
  },
  {
    Icon: MessageCircle,
    title: "WhatsApp",
    value: "+57 300 123 4567",
    href: "https://wa.me/573001234567",
    detail: "Lunes a viernes · 8 am – 6 pm (Colombia)",
  },
  {
    Icon: Clock,
    title: "Soporte técnico",
    value: "soporte@cosayb.co",
    href: "mailto:soporte@cosayb.co",
    detail: "Para problemas con tu cuenta o datos",
  },
]

export default function ContactoPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#12213A] min-h-dvh flex flex-col justify-center px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h1
              className="font-display font-extrabold text-[#F5F0E8] leading-[0.95] tracking-tight mb-6"
              style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)" }}
            >
              Estamos
              <br />
              <span className="text-[#7AAEFF]">para ayudarte.</span>
            </h1>
            <p className="font-body text-lg text-[#8FA0BC] leading-relaxed">
              Resolvemos tus dudas sobre planes, funcionalidades o cualquier problema técnico.
              Sin chatbots. Sin formularios complicados.
            </p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="bg-[#F5F0E8] py-24 sm:py-32 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-16">
            {/* Channels */}
            <div>
              <h2
                className="font-display font-extrabold text-[#12213A] mb-8"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}
              >
                Canales de atención
              </h2>
              <div className="flex flex-col gap-5">
                {channels.map(({ Icon, title, value, href, detail }) => (
                  <a
                    key={title}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="card-hover group bg-white border border-[#DDD6C8] rounded-xl p-6 flex gap-5 items-start no-underline"
                  >
                    <div className="w-11 h-11 bg-[#DEEAFF] rounded-lg flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-[#1B4FD8]" />
                    </div>
                    <div>
                      <div className="font-body font-semibold text-sm text-[#7A6E60] uppercase tracking-wide mb-1">
                        {title}
                      </div>
                      <div className="font-body font-bold text-[#12213A] text-base mb-1 group-hover:text-[#1B4FD8] transition-colors">
                        {value}
                      </div>
                      <div className="font-body text-xs text-[#7A6E60]">{detail}</div>
                    </div>
                  </a>
                ))}
              </div>

              {/* Support note */}
              <div className="mt-8 p-5 rounded-xl bg-[#EDE7DB] border border-[#DDD6C8]">
                <div className="flex gap-3">
                  <CheckCircle size={18} className="text-[#1B4FD8] shrink-0 mt-0.5" />
                  <p className="font-body text-sm text-[#4A4438] leading-relaxed">
                    Si eres usuario Pro o Academia, tienes acceso a soporte prioritario.
                    Menciona tu plan al escribirnos y te atendemos primero.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div>
              <h2
                className="font-display font-extrabold text-[#12213A] mb-8"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}
              >
                Envíanos un mensaje
              </h2>
              <form
                className="flex flex-col gap-5"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="font-body text-xs font-semibold text-[#4A4438] uppercase tracking-wide">
                      Nombre
                    </label>
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      className="font-body text-sm px-4 py-3 rounded bg-white border border-[#DDD6C8] text-[#12213A] placeholder-[#B0A898] outline-none focus:border-[#1B4FD8] transition-colors"
                      style={{ appearance: "none" }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-body text-xs font-semibold text-[#4A4438] uppercase tracking-wide">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="tu@correo.com"
                      className="font-body text-sm px-4 py-3 rounded bg-white border border-[#DDD6C8] text-[#12213A] placeholder-[#B0A898] outline-none focus:border-[#1B4FD8] transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-body text-xs font-semibold text-[#4A4438] uppercase tracking-wide">
                    Asunto
                  </label>
                  <select
                    className="font-body text-sm px-4 py-3 rounded bg-white border border-[#DDD6C8] text-[#12213A] outline-none focus:border-[#1B4FD8] transition-colors"
                    defaultValue=""
                  >
                    <option value="" disabled>Selecciona una opción</option>
                    <option>Tengo una pregunta sobre planes</option>
                    <option>Problema técnico con mi cuenta</option>
                    <option>Quiero una demo personalizada</option>
                    <option>Propuesta de alianza o colaboración</option>
                    <option>Otro</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-body text-xs font-semibold text-[#4A4438] uppercase tracking-wide">
                    Mensaje
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Cuéntanos en qué podemos ayudarte..."
                    className="font-body text-sm px-4 py-3 rounded bg-white border border-[#DDD6C8] text-[#12213A] placeholder-[#B0A898] outline-none focus:border-[#1B4FD8] transition-colors resize-none"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="privacy"
                    className="mt-1 accent-[#1B4FD8]"
                  />
                  <label htmlFor="privacy" className="font-body text-xs text-[#7A6E60] leading-relaxed">
                    He leído y acepto la{" "}
                    <a href="/privacy" className="text-[#1B4FD8] hover:underline">
                      Política de Privacidad
                    </a>
                    . Entiendo que mis datos serán usados únicamente para atender mi consulta.
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn-spx btn-spx-accent w-full sm:w-auto self-start"
                >
                  Enviar mensaje
                </button>

                <p className="font-body text-xs text-[#7A6E60]">
                  * Este formulario es solo visual. Para contacto real usa los canales de atención de la izquierda.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
