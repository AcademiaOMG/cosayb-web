export interface FreePeriodNotice {
  tone: "warning" | "info"
  message: string
  cta: { label: string; href: string }
}

/** Aviso del plan Free: solo lectura al vencer los 10 días, o cuenta regresiva en los últimos 3. */
export function freePeriodNotice(
  plan: { membership?: string; readOnly?: boolean; freePeriodDaysLeft?: number | null } | null | undefined,
): FreePeriodNotice | null {
  if (!plan || plan.membership !== "free") return null
  if (plan.readOnly) {
    return {
      tone: "warning",
      message: "Tu periodo gratuito de 10 días terminó. Tus datos se conservan, pero la cuenta está en solo lectura.",
      cta: { label: "Elegir plan", href: "/planes" },
    }
  }
  const days = plan.freePeriodDaysLeft
  if (days != null && days <= 3) {
    return {
      tone: "info",
      message: days > 0 ? `Tu periodo gratuito termina en ${days} ${days === 1 ? "día" : "días"}.` : "Tu periodo gratuito termina hoy.",
      cta: { label: "Elegir plan", href: "/planes" },
    }
  }
  return null
}
