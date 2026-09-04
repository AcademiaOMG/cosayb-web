"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { CheckCircle, Loader2 } from "lucide-react"
import { getMyProfile } from "@/lib/api"
import { PROGRAMS, type ProgramId } from "@/lib/commerce/catalog"
import { enrollmentService, CommerceRequestError } from "@/lib/commerce/services"
import { clearPendingCheckout } from "@/lib/commerce/pending"
import { useCommerceSession } from "@/lib/commerce/session"
import type { EnrollmentResult } from "@/lib/commerce/types"
import { useBeforeUnloadGuard } from "./useAbandonGuard"
import { TextField, SelectField, FieldError, Stepper, ExitConfirmModal, GlobalError } from "./ui"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\s()-]{7,}$/
const DRAFT_KEY = "cosayb.enrollment.draft"

interface Form {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  country: string
  program: ProgramId
  message: string
  consent: boolean
}

export default function EnrollmentFlow({
  courseId,
  defaultProgram,
}: {
  courseId: string
  defaultProgram: ProgramId
}) {
  const router = useRouter()
  const { isAuthenticated } = useCommerceSession()
  const { data: profile } = useSWR(
    isAuthenticated ? "me-profile" : null,
    () => getMyProfile().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  const [form, setForm] = useState<Form>(() => ({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    country: "Colombia",
    program: defaultProgram,
    message: "",
    consent: false,
  }))
  const [step, setStep] = useState<"form" | "review" | "processing" | "success">("form")
  const [processingLabel, setProcessingLabel] = useState("Validando información...")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [result, setResult] = useState<EnrollmentResult | null>(null)
  const [exitOpen, setExitOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const exitHref = useMemo(() => ({ current: "/capacitacion" }), [])

  // hidratar borrador
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (raw) setForm((f) => ({ ...f, ...JSON.parse(raw) }))
    } catch {
      /* noop */
    }
    setHydrated(true)
  }, [])

  // prefill desde perfil
  useEffect(() => {
    if (!profile) return
    setForm((f) => ({
      ...f,
      firstName: f.firstName || profile.name?.split(" ")[0] || "",
      lastName: f.lastName || profile.name?.split(" ").slice(1).join(" ") || "",
      email: f.email || profile.email || "",
    }))
  }, [profile])

  const isDirty =
    form.firstName || form.lastName || form.email || form.phone || form.city || form.message
  useBeforeUnloadGuard(step === "form" && !!isDirty && step !== ("processing" as string))

  useEffect(() => {
    if (!hydrated || step === "success") return
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    } catch {
      /* noop */
    }
  }, [form, hydrated, step])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = "El nombre es obligatorio."
    if (!form.lastName.trim()) e.lastName = "El apellido es obligatorio."
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Ingresa un correo válido."
    if (!PHONE_RE.test(form.phone.trim())) e.phone = "Ingresa un teléfono válido."
    if (!form.city.trim()) e.city = "La ciudad es obligatoria."
    if (!form.country.trim()) e.country = "El país es obligatorio."
    if (!form.program) e.program = "Selecciona un programa."
    if (!form.consent) e.consent = "Debes aceptar el consentimiento para continuar."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function confirm() {
    setStep("processing")
    setGlobalError(null)
    const labels = ["Validando información...", "Registrando solicitud...", "Confirmando inscripción..."]
    let i = 0
    const int = setInterval(() => {
      i = Math.min(i + 1, labels.length - 1)
      setProcessingLabel(labels[i])
    }, 450)
    const started = Date.now()
    try {
      const res = await enrollmentService.create({
        program: form.program,
        courseId,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        city: form.city,
        country: form.country,
        message: form.message || undefined,
        consent: form.consent,
      })
      const elapsed = Date.now() - started
      if (elapsed < 1400) await new Promise((r) => setTimeout(r, 1400 - elapsed))
      clearInterval(int)
      setResult(res)
      setStep("success")
      try {
        sessionStorage.removeItem(DRAFT_KEY)
      } catch {
        /* noop */
      }
      clearPendingCheckout()
    } catch (err) {
      clearInterval(int)
      setGlobalError(
        err instanceof CommerceRequestError
          ? err.message
          : "No pudimos registrar tu inscripción. Inténtalo nuevamente."
      )
      setStep("review")
    }
  }

  const leaveTo = (href: string) => {
    if (step === "form" && isDirty) {
      exitHref.current = href
      setExitOpen(true)
    } else router.push(href)
  }

  if (step === "success" && result) {
    return <EnrollSuccess result={result} />
  }

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-8 text-[#12213A]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button onClick={() => leaveTo("/capacitacion")} className="text-sm font-semibold text-[#1B4FD8]">
            ← Volver a cursos
          </button>
          <span className="rounded-full bg-[#E9F3FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#1434A4]">
            Inscripción
          </span>
        </div>

        <section className="rounded-3xl border border-[#DDD6C8] bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4FD8]">Curso</p>
            <h1 className="mt-2 text-3xl font-extrabold">Inscribirme</h1>
          </div>

          {step !== "processing" && (
            <div className="mb-8">
              <Stepper steps={["Formulario", "Revisión", "Confirmación"]} activeIndex={step === "form" ? 0 : step === "review" ? 1 : 2} />
            </div>
          )}

          {globalError && step === "review" && (
            <div className="mb-4">
              <GlobalError message={globalError} onRetry={confirm} onBack={() => setGlobalError(null)} />
            </div>
          )}

          {step === "processing" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-[#EEF5FF] p-4 text-[#1434A4]">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-semibold">Registrando tu inscripción...</span>
              </div>
              <ul className="space-y-2 rounded-2xl border border-[#DDD6C8] bg-[#FAF8F4] p-4 text-sm">
                {["Validando información...", "Registrando solicitud...", "Confirmando inscripción..."].map((s) => (
                  <li key={s} className={s === processingLabel ? "font-semibold text-[#12213A]" : "text-[#7A6E60]"}>
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === "form" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Nombre *" value={form.firstName} onChange={(v) => set("firstName", v)} error={errors.firstName} />
              <TextField label="Apellido *" value={form.lastName} onChange={(v) => set("lastName", v)} error={errors.lastName} />
              <TextField label="Correo electrónico *" type="email" inputMode="email" value={form.email} onChange={(v) => set("email", v)} error={errors.email} />
              <TextField label="Teléfono / WhatsApp *" inputMode="tel" value={form.phone} onChange={(v) => set("phone", v)} error={errors.phone} />
              <TextField label="Ciudad *" value={form.city} onChange={(v) => set("city", v)} error={errors.city} />
              <TextField label="País *" value={form.country} onChange={(v) => set("country", v)} error={errors.country} />
              <SelectField
                className="sm:col-span-2"
                label="Programa de inscripción *"
                value={form.program}
                onChange={(v) => set("program", v as ProgramId)}
                options={[...PROGRAMS]}
                error={errors.program}
              />
              <label className="block space-y-1.5 text-sm sm:col-span-2">
                <span className="font-medium text-[#12213A]">Mensaje (opcional)</span>
                <textarea
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  className="min-h-24 w-full rounded-xl border border-[#DDD6C8] bg-[#F7F5F2] px-3 py-3 text-sm outline-none focus:border-[#1B4FD8]"
                />
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-[#DDD6C8] bg-[#F7F5F2] p-3 text-sm text-[#4A4438] sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#1B4FD8]"
                />
                <span>
                  Acepto ser contactado por Academia OMG para recibir información académica y proceso de inscripción.
                </span>
              </label>
              <div className="sm:col-span-2">
                <FieldError msg={errors.consent} />
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Revisa tu inscripción</h2>
              <div className="space-y-1 rounded-2xl border border-[#DDD6C8] bg-[#FAF8F4] p-5 text-sm">
                <RevRow k="Programa" v={form.program} />
                <RevRow k="Nombre" v={`${form.firstName} ${form.lastName}`} />
                <RevRow k="Correo" v={form.email} />
                <RevRow k="Teléfono" v={form.phone} />
                <RevRow k="Ciudad / País" v={`${form.city} / ${form.country}`} />
                {form.message && <RevRow k="Mensaje" v={form.message} />}
                <RevRow k="Consentimiento" v="Aceptado" />
              </div>
            </div>
          )}

          {step !== "processing" && (
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              {step === "form" ? (
                <button
                  onClick={() => leaveTo("/capacitacion")}
                  className="rounded-xl border border-[#DDD6C8] bg-white px-5 py-3 text-sm font-semibold text-[#12213A]"
                >
                  Volver a cursos
                </button>
              ) : (
                <button
                  onClick={() => setStep("form")}
                  className="rounded-xl border border-[#DDD6C8] bg-white px-5 py-3 text-sm font-semibold text-[#12213A]"
                >
                  Editar información
                </button>
              )}
              {step === "form" ? (
                <button
                  onClick={() => {
                    if (validate()) setStep("review")
                  }}
                  className="rounded-xl bg-[#1B4FD8] px-5 py-3 text-sm font-semibold text-white sm:ml-auto"
                >
                  Continuar
                </button>
              ) : (
                <button
                  onClick={confirm}
                  className="rounded-xl bg-[#1B4FD8] px-5 py-3 text-sm font-semibold text-white sm:ml-auto"
                >
                  Confirmar inscripción
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      <ExitConfirmModal
        open={exitOpen}
        onStay={() => setExitOpen(false)}
        onLeave={() => {
          setExitOpen(false)
          router.push(exitHref.current)
        }}
      />
    </main>
  )
}

function RevRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="text-[#7A6E60]">{k}</span>
      <span className="max-w-[60%] text-right font-semibold">{v}</span>
    </div>
  )
}

function EnrollSuccess({ result }: { result: EnrollmentResult }) {
  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-10 text-[#12213A]">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#B7E7CB] bg-white p-8 text-center shadow-sm">
        <CheckCircle className="mx-auto h-14 w-14 text-[#15803D]" />
        <h1 className="mt-4 text-3xl font-extrabold">¡Inscripción registrada!</h1>
        <p className="mt-2 text-[#4A4438]">Recibimos correctamente tu solicitud de inscripción.</p>
        <div className="mt-6 rounded-2xl bg-[#FAF8F4] p-5 text-left text-sm">
          <RevRow k="Programa" v={result.program} />
          <RevRow k="Número de solicitud" v={result.operationNo} />
        </div>
        <p className="mt-4 text-sm text-[#4A4438]">
          Nuestro equipo se pondrá en contacto contigo para continuar el proceso.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => (window.location.href = "/capacitacion")}
            className="rounded-xl bg-[#1B4FD8] px-5 py-3 text-sm font-semibold text-white"
          >
            Volver a cursos
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="rounded-xl border border-[#DDD6C8] bg-white px-5 py-3 text-sm font-semibold text-[#12213A]"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    </main>
  )
}
