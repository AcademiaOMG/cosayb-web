"use client"

import Link from "next/link"
import { Suspense, useMemo, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth"
import { getPendingCheckout, pendingToPath, pendingContextLine } from "@/lib/commerce/pending"

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const returnTo = useMemo(() => {
    const rt = searchParams.get("returnTo") || searchParams.get("redirect")
    return rt && rt.startsWith("/") ? rt : null
  }, [searchParams])

  const pending = useMemo(() => (typeof window !== "undefined" ? getPendingCheckout() : null), [])
  const destination = useMemo(
    () => returnTo ?? (pending ? pendingToPath(pending) : "/onboarding"),
    [returnTo, pending]
  )

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")

    if (form.name.trim().length < 2) return setError("Ingresa tu nombre completo.")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("Ingresa un correo válido.")
    if (form.password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.")
    if (form.password !== form.confirmPassword) return setError("Las contraseñas no coinciden.")
    if (!form.acceptTerms) return setError("Debes aceptar los términos y condiciones.")

    setLoading(true)
    const { error: authError } = await authClient.signUp.email({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    })
    if (authError) {
      setLoading(false)
      setError(
        authError.message?.toLowerCase().includes("exist")
          ? "Ya existe una cuenta con este correo. Inicia sesión."
          : "No pudimos crear tu cuenta. Inténtalo nuevamente."
      )
      return
    }
    // Better Auth deja sesión iniciada tras signUp.
    router.replace(destination)
  }

  const isCheckout = !!pending

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-10 text-[#12213A]">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-[#DDD6C8] bg-white shadow-lg lg:grid-cols-2">
        <div className="bg-[#12213A] p-8 text-white lg:p-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#C8D5E8]">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>
          <div className="mt-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#7AAEFF]">Crear cuenta</p>
            <h1 className="font-display text-3xl font-extrabold">
              {isCheckout ? "Crear cuenta para continuar" : "Crea tu cuenta"}
            </h1>
            <p className="mt-4 max-w-sm text-sm text-[#DFEAFB]">
              {isCheckout
                ? pendingContextLine(pending!)
                : "Empieza a costear tus platos y controlar la rentabilidad de tu negocio."}
            </p>
            {isCheckout && (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                <p className="text-[#C8D5E8]">Proceso actual</p>
                <p className="mt-1 text-lg font-semibold">
                  {pending!.kind === "subscription"
                    ? `Adquisición del plan ${pending!.plan === "pro" ? "Pro" : "Academia"}`
                    : pending!.kind === "book"
                      ? "Compra del libro"
                      : "Inscripción a curso"}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 lg:p-12">
          <h2 className="text-2xl font-bold">Datos de la cuenta</h2>
          <p className="mt-2 text-sm text-[#4A4438]">
            {isCheckout ? "Al terminar retomamos tu compra automáticamente." : "Solo necesitas lo básico para empezar."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Field label="Nombre completo *" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Tu nombre" />
            <Field label="Correo *" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="correo@ejemplo.com" />
            <Field label="Contraseña *" type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="Mínimo 8 caracteres" />
            <Field label="Confirmar contraseña *" type="password" value={form.confirmPassword} onChange={(v) => setForm((f) => ({ ...f, confirmPassword: v }))} placeholder="Repite tu contraseña" />

            <label className="flex items-start gap-3 rounded-xl border border-[#DDD6C8] bg-[#F7F5F2] p-3 text-sm text-[#4A4438]">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => setForm((f) => ({ ...f, acceptTerms: e.target.checked }))}
                className="mt-1 h-4 w-4 accent-[#1B4FD8]"
              />
              <span>Acepto los términos y condiciones.</span>
            </label>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B4FD8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#163FB9] disabled:opacity-70"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isCheckout ? "Crear cuenta y continuar" : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#4A4438]">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href={`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : pending ? `?returnTo=${encodeURIComponent(pendingToPath(pending))}` : ""}`}
              className="font-semibold text-[#1B4FD8]"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-[#12213A]">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#DDD6C8] bg-[#F7F5F2] px-3 py-3 text-sm outline-none focus:border-[#1B4FD8]"
      />
    </label>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#F5F0E8]">
          <Loader2 className="h-6 w-6 animate-spin text-[#1B4FD8]" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
