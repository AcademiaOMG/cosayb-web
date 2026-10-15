"use client"

import { useState } from "react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { PAYMENT_METHODS, type PaymentMethodId } from "@/lib/commerce/catalog"
import { deriveCardLast4, formatCardInput, formatExpiryInput } from "@/lib/commerce/mask"
import { brandFromCardNumber, luhnValid, parseExpiry } from "@/lib/saas/billing"
import { refreshBilling } from "@/lib/saas/hooks"
import { saas, saasErrorMessage } from "@/lib/saas/services"
import { toast } from "@/lib/toast"

type Errors = Partial<Record<"holder" | "number" | "expiry" | "cvc", string>>

/**
 * Alta/cambio del método de pago. Sin pasarela real solo se envían marca, últimos 4
 * dígitos y vencimiento: el número completo y el CVC nunca salen de este formulario.
 */
export default function PaymentMethodModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: () => void }) {
  const [method, setMethod] = useState<PaymentMethodId>("tarjeta")
  const [holder, setHolder] = useState("")
  const [number, setNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  function reset() {
    setHolder(""); setNumber(""); setExpiry(""); setCvc(""); setErrors({}); setMethod("tarjeta")
  }

  function close() {
    reset()
    onClose()
  }

  async function save() {
    let input
    if (method === "tarjeta") {
      const exp = parseExpiry(expiry)
      const next: Errors = {
        holder: holder.trim().length < 3 ? "Ingresa el nombre como aparece en la tarjeta." : undefined,
        number: luhnValid(number) ? undefined : "Número de tarjeta no válido.",
        expiry: exp ? undefined : "Vencimiento no válido (MM/AA).",
        cvc: /^\d{3,4}$/.test(cvc) ? undefined : "CVC de 3 o 4 dígitos.",
      }
      setErrors(next)
      if (Object.values(next).some(Boolean)) return
      input = {
        type: method,
        brand: brandFromCardNumber(number),
        last4: deriveCardLast4(number),
        expMonth: exp![0],
        expYear: exp![1],
      }
    } else {
      input = {
        type: method,
        brand: method === "pse" ? "PSE" : "Nequi",
        last4: null,
        expMonth: null,
        expYear: null,
      }
    }

    setSaving(true)
    try {
      await saas.billing.setPaymentMethod(input)
      await refreshBilling()
      toast.success("Método de pago actualizado")
      reset()
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error("No se pudo guardar el método de pago", { description: saasErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Método de pago"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={save} loading={saving}>Guardar</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Tipo de método de pago</legend>
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm cursor-pointer"
              style={{
                border: `1px solid ${method === m.id ? "var(--accent)" : "var(--border-light)"}`,
                background: method === m.id ? "var(--accent-light)" : "transparent",
                color: "var(--text-primary)",
              }}
            >
              <input type="radio" name="pm" checked={method === m.id} onChange={() => setMethod(m.id)} />
              {m.label}
            </label>
          ))}
        </fieldset>

        {method === "tarjeta" ? (
          <>
            <Input label="Nombre en la tarjeta" autoComplete="cc-name" value={holder} onChange={(e) => setHolder(e.target.value)} error={errors.holder} />
            <Input
              label="Número de tarjeta"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              value={number}
              onChange={(e) => setNumber(formatCardInput(e.target.value))}
              error={errors.number}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Vencimiento"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/AA"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiryInput(e.target.value))}
                error={errors.expiry}
              />
              <Input
                label="CVC"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                error={errors.cvc}
              />
            </div>
          </>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Con {method === "pse" ? "PSE" : "Nequi / Daviplata"} confirmarás cada cobro desde tu banco o app al renovar.
          </p>
        )}

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Pago simulado: no se realiza ningún cobro real. Solo guardamos la marca y los últimos 4 dígitos.
        </p>
      </div>
    </Modal>
  )
}
