"use client"

import { CreditCard } from "lucide-react"
import { PAYMENT_METHODS, PSE_BANKS, DOCUMENT_TYPES } from "@/lib/commerce/catalog"
import { formatCardInput, formatExpiryInput } from "@/lib/commerce/mask"
import type { CheckoutState, CheckoutAction } from "@/lib/commerce/machine"
import { TextField, SelectField, FieldError, DemoNotice } from "./ui"

export function MethodPicker({
  state,
  dispatch,
}: {
  state: CheckoutState
  dispatch: React.Dispatch<CheckoutAction>
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Selecciona tu método de pago</h2>
      <div className="grid gap-3">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => dispatch({ type: "SELECT_METHOD", method: m.id })}
            className={`flex items-center justify-between rounded-2xl border p-4 text-left ${
              state.data.method === m.id
                ? "border-[#1B4FD8] bg-[#EDF3FF]"
                : "border-[#DDD6C8] bg-[#F7F5F2]"
            }`}
          >
            <span className="font-semibold text-[#12213A]">{m.label}</span>
            <CreditCard className="h-4 w-4 text-[#1B4FD8]" />
          </button>
        ))}
      </div>
      <FieldError msg={state.errors.method} />
    </div>
  )
}

export function PaymentDetails({
  state,
  dispatch,
}: {
  state: CheckoutState
  dispatch: React.Dispatch<CheckoutAction>
}) {
  const { data, errors } = state
  const set = (path: string, value: string) => dispatch({ type: "SET_FIELD", path, value })

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">
        {data.method === "tarjeta" && "Datos de la tarjeta"}
        {data.method === "pse" && "Datos para PSE"}
        {data.method === "nequi" && "Datos de Nequi / Daviplata"}
      </h2>

      {data.method === "tarjeta" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            className="sm:col-span-2"
            label="Número de tarjeta *"
            placeholder="XXXX XXXX XXXX XXXX"
            inputMode="numeric"
            value={data.payment.cardNumber}
            onChange={(v) => set("payment.cardNumber", formatCardInput(v))}
            error={errors["payment.cardNumber"]}
          />
          <TextField
            className="sm:col-span-2"
            label="Nombre del titular *"
            value={data.payment.cardName}
            onChange={(v) => set("payment.cardName", v)}
            error={errors["payment.cardName"]}
          />
          <TextField
            label="Fecha de vencimiento *"
            placeholder="MM/AA"
            inputMode="numeric"
            value={data.payment.expiry}
            onChange={(v) => set("payment.expiry", formatExpiryInput(v))}
            error={errors["payment.expiry"]}
          />
          <TextField
            label="CVV *"
            placeholder="123"
            inputMode="numeric"
            value={data.payment.cvv}
            onChange={(v) => set("payment.cvv", v.replace(/\D/g, "").slice(0, 4))}
            error={errors["payment.cvv"]}
          />
        </div>
      )}

      {data.method === "pse" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Banco *"
            value={data.payment.bank}
            onChange={(v) => set("payment.bank", v)}
            options={PSE_BANKS}
            error={errors["payment.bank"]}
          />
          <SelectField
            label="Tipo de documento *"
            value={data.payment.docType}
            onChange={(v) => set("payment.docType", v)}
            options={DOCUMENT_TYPES}
          />
          <TextField
            className="sm:col-span-2"
            label="Número de documento *"
            inputMode="numeric"
            value={data.payment.documentNumber}
            onChange={(v) => set("payment.documentNumber", v.replace(/\D/g, ""))}
            error={errors["payment.documentNumber"]}
          />
        </div>
      )}

      {data.method === "nequi" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Número de celular *"
            placeholder="3001234567"
            inputMode="tel"
            value={data.payment.nequiPhone}
            onChange={(v) => set("payment.nequiPhone", v.replace(/\D/g, "").slice(0, 10))}
            error={errors["payment.nequiPhone"]}
          />
          <TextField
            label="Nombre del titular *"
            value={data.payment.nequiName}
            onChange={(v) => set("payment.nequiName", v)}
            error={errors["payment.nequiName"]}
          />
        </div>
      )}

      <p className="text-xs text-[#7A6E60]">
        No guardamos el número completo de tu tarjeta ni el CVV. Esta pantalla solo simula la experiencia.
      </p>
      <DemoNotice />
    </div>
  )
}

export function CustomerStep({
  state,
  dispatch,
  withComments = false,
}: {
  state: CheckoutState
  dispatch: React.Dispatch<CheckoutAction>
  withComments?: boolean
}) {
  const { data, errors } = state
  const set = (path: string, value: string) => dispatch({ type: "SET_FIELD", path, value })
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Datos del comprador</h2>
        <p className="mt-1 text-sm text-[#4A4438]">Los usamos para tu factura simulada y para contactarte.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField className="sm:col-span-2" label="Nombre completo *" value={data.customer.fullName} onChange={(v) => set("customer.fullName", v)} error={errors["customer.fullName"]} />
        <TextField label="Correo electrónico *" type="email" inputMode="email" value={data.customer.email} onChange={(v) => set("customer.email", v)} error={errors["customer.email"]} />
        <TextField label="Teléfono / WhatsApp *" inputMode="tel" value={data.customer.phone} onChange={(v) => set("customer.phone", v)} error={errors["customer.phone"]} />
        <TextField label="Ciudad *" value={data.customer.city} onChange={(v) => set("customer.city", v)} error={errors["customer.city"]} />
        <TextField label="País *" value={data.customer.country} onChange={(v) => set("customer.country", v)} error={errors["customer.country"]} />
        {withComments && (
          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="font-medium text-[#12213A]">Comentarios (opcional)</span>
            <textarea
              value={data.customer.comments}
              onChange={(e) => set("customer.comments", e.target.value)}
              className="min-h-24 w-full rounded-xl border border-[#DDD6C8] bg-[#F7F5F2] px-3 py-3 text-sm outline-none focus:border-[#1B4FD8]"
            />
          </label>
        )}
      </div>
    </div>
  )
}
