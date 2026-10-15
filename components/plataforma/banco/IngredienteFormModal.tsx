"use client"

import { useState } from "react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { bancoCreateIngredient, bancoUpdateIngredient } from "@/lib/api"
import { friendlyError } from "@/lib/errorMessage"
import { formatPerGram } from "@/components/app/inventario/format"
import type { Ingrediente } from "@/types/domain"
import { normalizeName, PRECIO_ALTO_POR_GRAMO, PRECIO_BAJO_POR_GRAMO } from "@/lib/plataforma/banco/quality"
import { MAX_COSTO, MAX_NOMBRE, MAX_PESO_G } from "@/lib/plataforma/banco/csv"

export interface FormularioIngrediente {
  /** ingrediente que se edita; null al crear */
  editando: Ingrediente | null
  /** valores iniciales al crear (por ejemplo al duplicar) */
  plantilla?: { name: string; costPerUnit: string; weightGrams: string } | null
}

interface Errores { nombre?: string; costo?: string; peso?: string }

/** Validación del formulario, en español y sin depender del servidor. */
export function validarIngrediente(
  nombre: string,
  costo: string,
  peso: string,
  otros: { id: string; name: string }[]
): { errores: Errores; costo: number; peso: number } {
  const errores: Errores = {}
  const n = nombre.trim().replace(/\s+/g, " ")
  if (!n) errores.nombre = "Escribe el nombre del ingrediente."
  else if (n.length > MAX_NOMBRE) errores.nombre = `El nombre es muy largo (máximo ${MAX_NOMBRE} letras).`
  else if (otros.some((o) => normalizeName(o.name) === normalizeName(n))) {
    errores.nombre = "Ya hay un ingrediente con este nombre en el banco. Edita ese en lugar de crear otro."
  }
  const c = costo.trim() === "" ? NaN : Number(costo)
  if (costo.trim() === "") errores.costo = "Escribe cuánto cuesta la compra."
  else if (!Number.isFinite(c)) errores.costo = "El costo debe ser un número, por ejemplo 14500."
  else if (c <= 0) errores.costo = "El costo debe ser mayor que cero."
  else if (c > MAX_COSTO) errores.costo = "Ese costo es demasiado grande; revisa que no sobren ceros."
  const p = peso.trim() === "" ? NaN : Number(peso)
  if (peso.trim() === "") errores.peso = "Escribe cuántos gramos trae la compra."
  else if (!Number.isFinite(p)) errores.peso = "El peso debe ser un número en gramos, por ejemplo 1000."
  else if (p <= 0) errores.peso = "El peso debe ser mayor que cero."
  else if (p > MAX_PESO_G) errores.peso = "Ese peso es demasiado grande; revisa que esté en gramos."
  return { errores, costo: c, peso: p }
}

export default function IngredienteFormModal({
  abierto,
  formulario,
  existentes,
  onClose,
  onGuardado,
}: {
  abierto: boolean
  formulario: FormularioIngrediente
  existentes: Ingrediente[]
  onClose: () => void
  onGuardado: (info: { nombre: string; creado: boolean }) => void
}) {
  // El contenido se monta de nuevo con cada apertura (ver key) para empezar con los valores correctos
  return (
    <Modal
      open={abierto}
      onClose={onClose}
      title={formulario.editando ? "Editar ingrediente del banco" : "Nuevo ingrediente del banco"}
    >
      {abierto && (
        <Contenido
          key={formulario.editando?.id ?? `nuevo-${formulario.plantilla?.name ?? ""}`}
          formulario={formulario}
          existentes={existentes}
          onClose={onClose}
          onGuardado={onGuardado}
        />
      )}
    </Modal>
  )
}

function Contenido({
  formulario,
  existentes,
  onClose,
  onGuardado,
}: {
  formulario: FormularioIngrediente
  existentes: Ingrediente[]
  onClose: () => void
  onGuardado: (info: { nombre: string; creado: boolean }) => void
}) {
  const inicial = formulario.editando ?? formulario.plantilla ?? null
  const [nombre, setNombre] = useState(inicial?.name ?? "")
  const [costo, setCosto] = useState(inicial ? String(parseFloat(inicial.costPerUnit)) : "")
  const [peso, setPeso] = useState(inicial ? String(parseFloat(inicial.weightGrams)) : "")
  const [intento, setIntento] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)

  // Al editar sin cambiar el nombre no se bloquea (así se pueden corregir los que ya están repetidos)
  const mismoNombre = !!formulario.editando && normalizeName(nombre) === normalizeName(formulario.editando.name)
  const otros = mismoNombre ? [] : existentes.filter((i) => i.id !== formulario.editando?.id)
  const { errores, costo: c, peso: p } = validarIngrediente(nombre, costo, peso, otros)
  const porGramo = c > 0 && p > 0 ? c / p : null
  const aviso =
    porGramo === null ? null
      : porGramo > PRECIO_ALTO_POR_GRAMO ? "Ese precio por gramo es muy alto (más de $500.000 el kilo). Revisa que no sobren ceros."
      : porGramo < PRECIO_BAJO_POR_GRAMO ? "Ese precio por gramo es muy bajo (menos de $100 el kilo). Revisa el costo o el peso."
      : null
  const ver = (e?: string) => (intento ? e : undefined)

  async function guardar() {
    setIntento(true)
    setErrorServidor(null)
    if (Object.keys(errores).length > 0) return
    setGuardando(true)
    try {
      const datos = { name: nombre.trim().replace(/\s+/g, " "), costPerUnit: c, weightGrams: p }
      if (formulario.editando) await bancoUpdateIngredient(formulario.editando.id, datos)
      else await bancoCreateIngredient(datos)
      onGuardado({ nombre: datos.name.toUpperCase(), creado: !formulario.editando })
    } catch (err) {
      setErrorServidor(friendlyError(err, "No se pudo guardar el ingrediente. Revisa tu conexión e inténtalo de nuevo."))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => { e.preventDefault(); void guardar() }}
      noValidate
    >
      <Input
        label="Nombre"
        placeholder="Ej. Harina de trigo"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        error={ver(errores.nombre)}
        hint="Se guarda en mayúsculas, como el resto del banco."
        autoFocus
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Costo de la compra (COP)"
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="Ej. 14500"
          value={costo}
          onChange={(e) => setCosto(e.target.value)}
          error={ver(errores.costo)}
        />
        <Input
          label="Peso de la compra (gramos)"
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="Ej. 1500"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          error={ver(errores.peso)}
        />
      </div>

      <div
        className="flex items-center justify-between rounded-xl px-3 py-2.5"
        style={{ background: "var(--accent-light)" }}
        aria-live="polite"
      >
        <span className="text-xs" style={{ color: "var(--accent-text)" }}>Costo por gramo</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-text)" }}>
          {porGramo === null ? "—" : `${formatPerGram(porGramo)}/g`}
        </span>
      </div>

      {aviso && <p className="text-xs" style={{ color: "#B45309" }}>{aviso}</p>}
      {errorServidor && <p role="alert" className="text-xs" style={{ color: "var(--error)" }}>{errorServidor}</p>}

      <div className="flex justify-end gap-2.5 pt-1">
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary" loading={guardando}>
          {formulario.editando ? "Guardar cambios" : "Crear ingrediente"}
        </Button>
      </div>
    </form>
  )
}
