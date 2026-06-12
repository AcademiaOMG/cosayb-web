"use client"

import { useEffect, useState, useCallback } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import Modal from "@/components/ui/Modal"
import Input from "@/components/ui/Input"
import Table from "@/components/ui/Table"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Package } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

interface Ingredient {
  id: string
  name: string
  costPerUnit: string
  weightGrams: string
  costPerGram: string
  isPublic: boolean
  userId: string | null
}

interface IngredientForm {
  name: string
  costPerUnit: string
  weightGrams: string
}

const FREE_LIMIT = 30

export default function InventarioPage() {
  const [items, setItems] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [plan, setPlan] = useState<"free" | "pro">("free")

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [form, setForm] = useState<IngredientForm>({ name: "", costPerUnit: "", weightGrams: "" })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Modal eliminar
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Modal importar
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ inserted: number; skipped: number } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/ingredients`, { credentials: "include" })
      const body = await res.json()
      setItems(body.data ?? [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => load())
    // Obtener plan
    fetch(`${API}/api/v1/organizations/me`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((b) => { if (b?.data?.plan) setPlan(b.data.plan) })
      .catch(() => {})
  }, [load])

  const myIngredients = items.filter((i) => i.userId !== null)
  const quotaUsed = myIngredients.length
  const quotaFull = plan === "free" && quotaUsed >= FREE_LIMIT

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    if (quotaFull) return
    setEditing(null)
    setForm({ name: "", costPerUnit: "", weightGrams: "" })
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(item: Ingredient) {
    setEditing(item)
    setForm({
      name: item.name,
      costPerUnit: item.costPerUnit,
      weightGrams: item.weightGrams,
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.costPerUnit || !form.weightGrams) {
      setFormError("Todos los campos son obligatorios")
      return
    }
    setSaving(true)
    setFormError(null)

    const body = {
      name: form.name.trim(),
      costPerUnit: parseFloat(form.costPerUnit),
      weightGrams: parseFloat(form.weightGrams),
    }

    try {
      const url = editing
        ? `${API}/api/v1/ingredients/${editing.id}`
        : `${API}/api/v1/ingredients`
      const method = editing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 429) {
          setFormError(`Límite del plan Free: máximo ${FREE_LIMIT} ingredientes.`)
          return
        }
        throw new Error(err.message ?? "Error al guardar")
      }

      setModalOpen(false)
      await load()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`${API}/api/v1/ingredients/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      setDeleteTarget(null)
      await load()
    } catch {
      // silencioso, el modal se cierra igual
    } finally {
      setDeleting(false)
    }
  }

  async function handleImport() {
    setImporting(true)
    setImportResult(null)
    try {
      const res = await fetch(`${API}/api/v1/ingredients/import`, {
        method: "POST",
        credentials: "include",
      })
      const body = await res.json()
      setImportResult(body)
      await load()
    }  catch {
  setDeleteTarget(null) // cerrar igual aunque falle
} finally {
  setDeleting(false)
}
  }

  const costPerGramDisplay = (item: Ingredient) =>
    `$${parseFloat(item.costPerGram).toFixed(4)}`

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventario"
        subtitle={
          plan === "free"
            ? `${quotaUsed} / ${FREE_LIMIT} ingredientes`
            : "Ingredientes de tu organización"
        }
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setImportOpen(true)}>
              Importar banco base
            </Button>
            <Button
              variant="primary"
              onClick={openCreate}
              disabled={quotaFull}
              title={quotaFull ? `Límite del plan Free: ${FREE_LIMIT} ingredientes` : undefined}
            >
              Nuevo ingrediente
            </Button>
          </div>
        }
      />

      {/* Barra de búsqueda */}
      {items.length > 0 && (
        <Input
          placeholder="Buscar ingrediente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {/* Alerta de cuota llena */}
      {quotaFull && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: "var(--bg-warning, #FEF3C7)",
            color: "#92400E",
            border: "1px solid #FDE68A",
          }}
        >
          Has alcanzado el límite de {FREE_LIMIT} ingredientes del plan Free.{" "}
          <strong>Actualiza a Pro</strong> para agregar más.
        </div>
      )}

      {/* Contenido principal */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={40} style={{ color: "var(--text-muted)" }} />}
          title={search ? "Sin resultados" : "No tienes ingredientes todavía"}
          description={
            search
              ? `No se encontró ningún ingrediente con "${search}".`
              : "Agrega ingredientes manualmente o importa el banco base."
          }
          action={
            !search ? (
              <Button variant="ghost" onClick={() => setImportOpen(true)}>
                Importar banco base
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table
          columns={[
            { key: "name", label: "Nombre" },
            { key: "costPerUnit", label: "Costo unitario", render: (v) => `$${parseFloat(String(v)).toLocaleString("es-CO")}` },
            { key: "weightGrams", label: "Peso (g)", render: (v) => `${parseFloat(String(v)).toLocaleString("es-CO")} g` },
            { key: "costPerGram", label: "Costo/g", render: (_, row) => costPerGramDisplay(row as unknown as Ingredient) },
            {
              key: "isPublic",
              label: "Origen",
              render: (v, row) =>
                (row as unknown as Ingredient).userId === null ? (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                    Banco base
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>
                    Propio
                  </span>
                ),
            },
            {
              key: "id",
              label: "",
              render: (_, row) => {
                const item = row as unknown as Ingredient
                if (item.userId === null) return null // banco base: no editar
                return (
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(item)}
                      style={{ color: "var(--color-danger, #E24B4A)" }}>
                      Eliminar
                    </Button>
                  </div>
                )
              },
            },
          ]}
          data={filtered as unknown as Record<string, unknown>[]}
          rowKey="id"
        />
      )}

      {/* ── Modal crear / editar ──────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar ingrediente" : "Nuevo ingrediente"}
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editing ? "Guardar cambios" : "Crear ingrediente"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre"
            placeholder="Ej. Harina de trigo"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Costo unitario (COP)"
            placeholder="Ej. 3500"
            type="number"
            value={form.costPerUnit}
            onChange={(e) => setForm((f) => ({ ...f, costPerUnit: e.target.value }))}
          />
          <Input
            label="Peso (gramos)"
            placeholder="Ej. 1000"
            type="number"
            value={form.weightGrams}
            onChange={(e) => setForm((f) => ({ ...f, weightGrams: e.target.value }))}
          />
          {form.costPerUnit && form.weightGrams && parseFloat(form.weightGrams) > 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Costo por gramo calculado:{" "}
              <strong>${(parseFloat(form.costPerUnit) / parseFloat(form.weightGrams)).toFixed(4)}</strong>
              {" "}(solo lectura, lo calcula el backend)
            </p>
          )}
          {formError && (
            <p className="text-sm" style={{ color: "#E24B4A" }}>{formError}</p>
          )}
        </div>
      </Modal>

      {/* ── Modal eliminar ────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar ingrediente"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={deleting}
              onClick={handleDelete}
              style={{ background: "#E24B4A" }}
            >
              Eliminar
            </Button>
          </div>
        }
      >
        <p style={{ color: "var(--text-secondary)" }}>
          ¿Estás seguro de que quieres eliminar{" "}
          <strong style={{ color: "var(--text-primary)" }}>{deleteTarget?.name}</strong>?
          Esta acción no se puede deshacer.
        </p>
      </Modal>

      {/* ── Modal importar banco base ─────────────────────── */}
      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportResult(null) }}
        title="Importar banco base"
        footer={
          importResult ? (
            <Button variant="primary" onClick={() => { setImportOpen(false); setImportResult(null) }}>
              Listo
            </Button>
          ) : (
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setImportOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" loading={importing} onClick={handleImport}>
                Importar
              </Button>
            </div>
          )
        }
      >
        {importResult ? (
          <div className="flex flex-col gap-2">
            <p style={{ color: "var(--text-primary)" }}>
              ✅ <strong>{importResult.inserted}</strong> ingredientes importados.
            </p>
            {importResult.skipped > 0 && (
              <p style={{ color: "var(--text-muted)" }}>
                {importResult.skipped} ya existían y fueron omitidos.
              </p>
            )}
          </div>
        ) : (
          <p style={{ color: "var(--text-secondary)" }}>
            Se copiarán todos los ingredientes del banco base a tu inventario.
            Los que ya tengas con el mismo nombre serán omitidos.
            {plan === "free" && (
              <span style={{ color: "#92400E" }}>
                {" "}⚠️ En el plan Free solo puedes tener {FREE_LIMIT} ingredientes.
              </span>
            )}
          </p>
        )}
      </Modal>
    </div>
  )
}