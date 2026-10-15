import { redirect } from "next/navigation"

// El API (contrato §1) espera esta ruta tras el registro: reutiliza la pantalla de verify-email.
export default async function VerifyEmailSentPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams
  redirect(`/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`)
}
