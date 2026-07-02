"use client"

import useSWR from "swr"
import { useEffect, useState, useMemo } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Input from "@/components/ui/Input"
import QuotaBanner from "@/components/app/inventario/QuotaBanner"
import IngredientSearchBar from "@/components/app/inventario/IngredientSearchBar"
import IngredientFilters from "@/components/app/inventario/IngredientFilters"
import IngredientGrid from "@/components/app/inventario/IngredientGrid"
import PriceSuggestion from "@/components/app/inventario/PriceSuggestion"
import type { Ingredient, IngredientForm, IngredientOriginFilter } from "@/types/ingredient"

// ── Constants ────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
const FREE_LIMIT = 30
const PAGE_SIZE = 12

// ── Page ─────────────────────────────────────────────────────────────────────
export default function InventarioPage() {
  const { data: items = [], isLoading, error, mutate } = useSWR<Ingredient[]>(
    "ingredients",
    () =>
      fetch(`${API}/api/v1/ingredients`, { credentials: "include" })
        .then((r) => { if (!r.ok) throw new Error("Response not ok"); return r.json() })
        .then((b) => b.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  // ── Plan (no se cachea — viene del AppShell también) ─────────────────────
  const [plan, setPlan] = useState<"free" | "pro">("free")

  useEffect(() => {
    fetch(`${API}/api/v1/organizations/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => { if (b?.data?.plan) setPlan(b.data.plan) })
      .catch(() => {})
  }, [])

  // ── Search / Filter / Pagination ──────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [originFilter, setOriginFilter] = useState<IngredientOriginFilter>("all")
  const [currentPage, setCurrentPage] = useState(1)

  // ── Modal: create / edit ──────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [form, setForm] = useState<IngredientForm>({
    name: "",
    costPerUnit: "",
    weightGrams: "",
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [priceSource, setPriceSource] = useState<string | null>(null)

  // ── Modal: delete ─────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Reset page when filters change ────────────────────────────────────────
  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleFilterChange(filter: IngredientOriginFilter) {
    setOriginFilter(filter)
    setCurrentPage(1)
  }

  // ── Derived: quota ────────────────────────────────────────────────────────
  const myIngredients = items.filter((i) => i.userId !== null)
  const quotaUsed = myIngredients.length
  const quotaFull = plan === "free" && quotaUsed >= FREE_LIMIT

  // ── Derived: filter + search ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = items
    if (originFilter === "own") result = result.filter((i) => i.userId !== null)
    else if (originFilter === "base") result = result.filter((i) => i.userId === null)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((i) => i.name.toLowerCase().includes(q))
    }
    return result
  }, [items, originFilter, search])

  // ── Derived: pagination ───────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // ── Derived: filter counts ────────────────────────────────────────────────
  const filterCounts = useMemo<Record<IngredientOriginFilter, number>>(() => {
    const base = search.trim()
      ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
      : items
    return {
      all: base.length,
      own: base.filter((i) => i.userId !== null).length,
      base: base.filter((i) => i.userId === null).length,
    }
  }, [items, search])

  // ── Actions ───────────────────────────────────────────────────────────────
  function openCreate() {
    if (quotaFull) return
    setEditing(null)
    setForm({ name: "", costPerUnit: "", weightGrams: "" })
    setFormError(null)
    setPriceSource(null)
    setModalOpen(true)
  }

  function openEdit(ingredient: Ingredient) {
    setEditing(ingredient)
    setForm({
      name: ingredient.name,
      costPerUnit: ingredient.costPerUnit,
      weightGrams: ingredient.weightGrams,
    })
    setFormError(null)
    setPriceSource(null)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.costPerUnit || !form.weightGrams) {
      setFormError("Todos los campos son obligatorios")
      return
    }
    setSaving(true)
    setFormError(null)

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      costPerUnit: parseFloat(form.costPerUnit),
      weightGrams: parseFloat(form.weightGrams),
      ...(priceSource && { priceConfirmation: { priceSource } }),
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
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 429) {
          setFormError(`Límite del plan Free: máximo ${FREE_LIMIT} ingredientes.`)
          return
        }
        throw new Error((err as { message?: string }).message ?? "Error al guardar")
      }

      setModalOpen(false)
      await mutate()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : String(err))
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
      await mutate()
    } catch {
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Inventario"
        subtitle={
          plan === "free"
            ? `${quotaUsed} de ${FREE_LIMIT} ingredientes registrados`
            : "Precios de compra de tus ingredientes — base de tus recetas"
        }
        action={
          <Button
            variant="primary"
            onClick={openCreate}
            disabled={quotaFull}
            title={
              quotaFull
                ? `Límite del plan Free: ${FREE_LIMIT} ingredientes`
                : undefined
            }
          >
            Nuevo ingrediente
          </Button>
        }
      />

      {/* Quota banner (free plan) */}
      {plan === "free" && !isLoading && !error && (
        <QuotaBanner used={quotaUsed} limit={FREE_LIMIT} />
      )}

      {/* Search + Filters toolbar */}
      {!error && (
        <div className="flex flex-col gap-3">
          <IngredientSearchBar
            value={search}
            onChange={handleSearchChange}
            resultCount={search ? filtered.length : undefined}
          />
          <IngredientFilters
            active={originFilter}
            onChange={handleFilterChange}
            counts={filterCounts}
          />
        </div>
      )}

      {/* Ingredient grid (loading / error / empty / cards + pagination) */}
      <IngredientGrid
        ingredients={paginated}
        loading={isLoading}
        error={!!error}
        searchQuery={search}
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onRetry={() => void mutate()}
        pageSize={PAGE_SIZE}
      />

      {/* ── Modal: create / edit ─────────────────────────────────────────── */}
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
            label="Nombre del ingrediente"
            placeholder="Ej. Harina de trigo"
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }))
              setPriceSource(null)
            }}
          />
          <PriceSuggestion
            ingredientName={form.name}
            onAccept={(pricePerUnit, weightGrams, source) => {
              setForm((f) => ({
                ...f,
                costPerUnit: String(pricePerUnit),
                weightGrams: String(weightGrams),
              }))
              setPriceSource(source)
            }}
          />
          <Input
            label="Precio de compra (COP)"
            placeholder="Ej. 3.500"
            type="number"
            step="any"
            min="0"
            value={form.costPerUnit}
            onChange={(e) => setForm((f) => ({ ...f, costPerUnit: e.target.value }))}
            hint="Lo que pagaste por esta presentación o empaque"
          />
          <Input
            label="Peso del empaque (g)"
            placeholder="Ej. 1000"
            type="number"
            step="any"
            min="0"
            value={form.weightGrams}
            onChange={(e) => setForm((f) => ({ ...f, weightGrams: e.target.value }))}
            hint="¿Cuántos gramos trae la presentación que compraste?"
          />
          {form.costPerUnit && form.weightGrams && parseFloat(form.weightGrams) > 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Costo por gramo calculado:{" "}
              <strong>
                ${(parseFloat(form.costPerUnit) / parseFloat(form.weightGrams)).toFixed(4)}
              </strong>{" "}
              
            </p>
          )}
          {formError && (
            <p className="text-sm" style={{ color: "#E24B4A" }}>
              {formError}
            </p>
          )}
        </div>
      </Modal>

      {/* ── Modal: delete ────────────────────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar ingrediente"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        }
      >
        <p style={{ color: "var(--text-secondary)" }}>
          ¿Estás seguro de que quieres eliminar{" "}
          <strong style={{ color: "var(--text-primary)" }}>{deleteTarget?.name}</strong>
          ? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}
