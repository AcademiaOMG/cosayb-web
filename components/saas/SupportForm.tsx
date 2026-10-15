"use client"

import Link from "next/link"
import { useId, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { authClient } from "@/lib/auth"
import { normalizeEmail } from "@/lib/auth/validation"
import { refreshTickets } from "@/lib/saas/hooks"
import { saas, saasErrorMessage } from "@/lib/saas/services"
import { MESSAGE_MAX, TICKET_CATEGORIES, hasErrors, validateTicket, type TicketErrors } from "@/lib/saas/support"
import type { SupportTicket, TicketCategory } from "@/lib/saas/types"
import { toast } from "@/lib/toast"

type Variant = "marketing" | "app"

const STYLES: Record<Variant, { label: string; field: string; consent: string; button: string }> = {
  marketing: {
    label: "font-body text-xs font-semibold text-[#4A4438] uppercase tracking-wide",
    field:
      "font-body text-sm px-4 py-3 rounded bg-white border border-[#DDD6C8] text-[#12213A] placeholder-[#B0A898] outline-none focus:border-[#1B4FD8] transition-colors w-full",
    consent: "font-body text-xs text-[#7A6E60] leading-relaxed",
    button: "btn-spx btn-spx-accent w-full sm:w-auto self-start disabled:opacity-60",
  },
  app: {
    label: "text-sm font-medium text-[var(--text-primary)]",
    field:
      "h-10 w-full px-3 text-sm outline-none rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-light)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2",
    consent: "text-xs text-[var(--text-muted)] leading-relaxed",
    button:
      "inline-flex h-10 items-center justify-center px-4 text-sm font-medium text-white rounded-[var(--radius-md)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 self-start",
  },
}

/** Formulario de contacto/soporte compartido por /contacto (público) y /soporte (app). */
export default function SupportForm({
  variant = "marketing",
  defaultCategory = "otro",
}: {
  variant?: Variant
  defaultCategory?: TicketCategory
}) {
  const s = STYLES[variant]
  const uid = useId()
  const { data: session } = authClient.useSession()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [category, setCategory] = useState<TicketCategory | "">(defaultCategory)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [consent, setConsent] = useState(false)
  const [trap, setTrap] = useState("")
  const [errors, setErrors] = useState<TicketErrors>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<SupportTicket | null>(null)

  // Prefill con la sesión (sin pisar lo que la persona ya escribió)
  const effName = name || session?.user?.name || ""
  const effEmail = email || session?.user?.email || ""

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const input = {
      name: effName.trim(),
      email: normalizeEmail(effEmail),
      category: category || undefined,
      subject: subject.trim(),
      message: message.trim(),
    }
    const next = validateTicket(input, consent)
    setErrors(next)
    if (hasErrors(next)) return
    // Honeypot: un bot rellena el campo oculto; fingimos éxito sin enviar
    if (trap) {
      setSent({
        name: input.name, email: input.email, category: "otro", subject: input.subject, message: input.message,
        id: "x", number: "SUP-0000", status: "open", createdAt: "", updatedAt: "",
      })
      return
    }
    setSending(true)
    try {
      const ticket = await saas.support.submit({ ...input, category: input.category as TicketCategory })
      setSent(ticket)
      await refreshTickets()
    } catch (err) {
      toast.error("No pudimos enviar tu mensaje", { description: saasErrorMessage(err) })
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start gap-3 p-6 rounded-xl border border-[#DDD6C8] bg-white">
        <CheckCircle2 size={28} className="text-[#10B981]" aria-hidden="true" />
        <p className="font-semibold text-[#12213A]">¡Mensaje enviado!</p>
        <p className="text-sm text-[#4A4438] leading-relaxed">
          Tu solicitud es <strong>{sent.number}</strong>. Te responderemos a <strong>{sent.email || effEmail}</strong> en
          máximo 1 día hábil.
        </p>
        <button
          type="button"
          className="text-sm underline text-[#1B4FD8]"
          onClick={() => {
            setSent(null); setSubject(""); setMessage(""); setConsent(false)
          }}
        >
          Enviar otro mensaje
        </button>
      </div>
    )
  }

  const err = (k: keyof TicketErrors) =>
    errors[k] ? (
      <p id={`${uid}-${k}-err`} role="alert" className="text-xs" style={{ color: "var(--error, #B42020)" }}>{errors[k]}</p>
    ) : null
  const aria = (k: keyof TicketErrors) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${uid}-${k}-err` : undefined })

  return (
    <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${uid}-name`} className={s.label}>Nombre</label>
          <input id={`${uid}-name`} className={s.field} autoComplete="name" value={effName} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" {...aria("name")} />
          {err("name")}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${uid}-email`} className={s.label}>Correo electrónico</label>
          <input id={`${uid}-email`} type="email" className={s.field} autoComplete="email" value={effEmail} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" {...aria("email")} />
          {err("email")}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${uid}-cat`} className={s.label}>Tema</label>
        <select id={`${uid}-cat`} className={s.field} value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} {...aria("category")}>
          <option value="" disabled>Selecciona una opción</option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        {err("category")}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${uid}-subject`} className={s.label}>Asunto</label>
        <input id={`${uid}-subject`} className={s.field} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Resume tu consulta" maxLength={140} {...aria("subject")} />
        {err("subject")}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${uid}-msg`} className={s.label}>Mensaje</label>
        <textarea
          id={`${uid}-msg`}
          rows={5}
          className={`${s.field} ${variant === "app" ? "h-auto py-2" : ""} resize-none`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Cuéntanos en qué podemos ayudarte…"
          {...aria("message")}
        />
        <div className="flex justify-between">
          {err("message") ?? <span />}
          <span className="text-xs text-[#7A6E60]">{message.length}/{MESSAGE_MAX}</span>
        </div>
      </div>

      {/* Honeypot: invisible para personas */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          No llenar
          <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 accent-[#1B4FD8]" checked={consent} onChange={(e) => setConsent(e.target.checked)} {...aria("consent")} />
          <span className={s.consent}>
            He leído y acepto la{" "}
            <Link href="/privacy" target="_blank" className="text-[#1B4FD8] hover:underline">Política de Privacidad</Link>.
            Entiendo que mis datos serán usados únicamente para atender mi consulta.
          </span>
        </label>
        {err("consent")}
      </div>

      <button type="submit" disabled={sending} className={s.button}>
        {sending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  )
}
