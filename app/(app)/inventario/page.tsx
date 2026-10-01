"use client"

import useSWR from "swr"
import { useState, useMemo, useEffect } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Input from "@/components/ui/Input"
import QuotaBanner from "@/components/app/inventario/QuotaBanner"
import IngredientSearchBar from "@/components/app/inventario/IngredientSearchBar"
import IngredientFilters from "@/components/app/inventario/IngredientFilters"
import IngredientList from "@/components/app/inventario/IngredientList"
import IngredientDetailModal from "@/components/app/inventario/IngredientDetailModal"
import IngredientFormModal from "@/components/app/inventario/IngredientFormModal"
import PriceSuggestion from "@/components/app/inventario/PriceSuggestion"
import { displayName, normalizeForSearch } from "@/components/app/inventario/format"
import { Plus } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { useHelpAvailable } from "@/hooks/useHelpAvailable"
import { fetchAPI } from "@/lib/api"
import type { Ingredient, IngredientForm, IngredientOriginFilter } from "@/types/ingredient"
import ModuleLocked from "@/components/app/ModuleLocked"

// ── Constants ────────────────────────────────────────────────────────────────
const FREE_LIMIT = 30
const PAGE_SIZE = 20

// ── Helpers ──────────────────────────────────────────────────────────────────
// (parseFormattedNumber removed — no longer needed with type="number" inputs)

// ── Page ─────────────────────────────────────────────────────────────────────
export default function InventarioPage() {
  useHelpAvailable()
  const { data: items = [], isLoading, error, mutate } = useSWR<Ingredient[]>(
    "ingredients",
    () =>
      fetchAPI<{ data: Ingredient[] }>("/api/v1/ingredients")
        .then((b) => b.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  // ── Permisos y plan ───────────────────────────────────────────────────────
  const { can, organization, hasFeature, featureLockedMessage } = usePermissions()
  const plan = organization?.membership === "free" ? "free" : "pro"
  const canUpdate = can("ingredients", "update")
  const canDelete = can("ingredients", "delete")

  // ── Search / Filter / Pagination ──────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [originFilter, setOriginFilter] = useState<IngredientOriginFilter>("all")
  const [currentPage, setCurrentPage] = useState(1)

  // ── Modal: create / edit ──────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)

  // ── Modal: detail ─────────────────────────────────────────────────────────
  const [detail, setDetail] = useState<Ingredient | null>(null)

  // ── Modal: delete ─────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Modal: help ──────────────────────────────────────────────────────────
  const [helpOpen, setHelpOpen] = useState(false)

  // Listen for help event from Topbar
  useEffect(() => {
    function handleHelp() { setHelpOpen(true) }
    window.addEventListener("open-help", handleHelp)
    return () => window.removeEventListener("open-help", handleHelp)
  }, [])

  // ── Reset page when filters change ────────────────────────────────────────
  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleFilterChange(filter: IngredientOriginFilter) {
    setOriginFilter(filter)
    setCurrentPage(1)
  }

  function clearFilters() {
    setSearch("")
    setOriginFilter("all")
    setCurrentPage(1)
  }

  function handlePageChange(page: number) {
    setCurrentPage(page)
    // El scroll vive en el <main> del AppShell, no en window
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" })
  }

  // ── Derived: quota ────────────────────────────────────────────────────────
  const myIngredients = items.filter((i) => i.userId !== null)
  const quotaUsed = myIngredients.length
  const quotaFull = plan === "free" && quotaUsed >= FREE_LIMIT

  // ── Derived: search (sin tildes ni mayúsculas) → filtro de origen ─────────
  const searched = useMemo(() => {
    const q = normalizeForSearch(search)
    if (!q) return items
    return items.filter((i) => normalizeForSearch(i.name).includes(q))
  }, [items, search])

  const filtered = useMemo(() => {
    if (originFilter === "own") return searched.filter((i) => i.userId !== null)
    if (originFilter === "base") return searched.filter((i) => i.userId === null)
    return searched
  }, [searched, originFilter])

  // ── Derived: pagination ───────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // ── Derived: filter counts ────────────────────────────────────────────────
  const filterCounts = useMemo<Record<IngredientOriginFilter, number>>(() => {
    const own = searched.filter((i) => i.userId !== null).length
    return { all: searched.length, own, base: searched.length - own }
  }, [searched])

  // ── Actions ───────────────────────────────────────────────────────────────
  function openCreate() {
    if (quotaFull) return
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(ingredient: Ingredient) {
    setEditing(ingredient)
    setModalOpen(true)
  }

  async function handleSave() {
    setModalOpen(false)
    await mutate()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetchAPI(`/api/v1/ingredients/${deleteTarget.id}`, {
        method: "DELETE",
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
  if (!hasFeature("module_ingredients")) {
    return <ModuleLocked message={featureLockedMessage("module_ingredients")} />
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Inventario"
        subtitle="Controla el stock, la trazabilidad y el costo real de cada ingrediente de tu cocina."
        action={
          can("ingredients", "create") ? (
            <Button
              variant="primary"
              onClick={openCreate}
              disabled={quotaFull}
              title={
                quotaFull
                  ? `Límite del plan Free: ${FREE_LIMIT} ingredientes`
                  : undefined
              }
              aria-label="Nuevo ingrediente"
            >
              <Plus size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Nuevo ingrediente</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          ) : undefined
        }
      />

      {/* Quota banner (free plan) */}
      {plan === "free" && !isLoading && !error && (
        <QuotaBanner used={quotaUsed} limit={FREE_LIMIT} />
      )}

      {/* Buscador + filtro, en una sola línea */}
      <div className="flex flex-col gap-3">
        {!error && (
          <div className="flex items-center gap-2">
            <IngredientSearchBar value={search} onChange={handleSearchChange} />
            <IngredientFilters
              active={originFilter}
              onChange={handleFilterChange}
              counts={filterCounts}
            />
          </div>
        )}

        {/* Listado (loading / error / vacío / filas + paginación) */}
        <IngredientList
          ingredients={paginated}
          totalCount={filtered.length}
          loading={isLoading}
          error={!!error}
          searchQuery={search}
          filter={originFilter}
          currentPage={safePage}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
          onOpen={setDetail}
          onEdit={canUpdate ? openEdit : undefined}
          onDelete={canDelete ? setDeleteTarget : undefined}
          onRetry={() => void mutate()}
          onClearFilters={clearFilters}
        />
      </div>

      <IngredientDetailModal
        ingredient={detail}
        onClose={() => setDetail(null)}
        onEdit={canUpdate ? openEdit : undefined}
        onDelete={canDelete ? setDeleteTarget : undefined}
      />

      <IngredientFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => void mutate()}
        editing={editing}
      />

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
          <strong style={{ color: "var(--text-primary)" }}>{deleteTarget ? displayName(deleteTarget.name) : ""}</strong>
          ? Esta acción no se puede deshacer.
        </p>
      </Modal>

      {/* ── Modal: help ──────────────────────────────────────────────────── */}
      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Inventario"
      >
        <div className="flex flex-col gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          <p>En esta seccion podra gestionar el inventario de ingredientes de manera eficiente.</p>

          <div>
            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Funcionalidades:</p>
            <ul className="flex flex-col gap-2 ml-1">
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Almacenamiento de productos:</strong> Registra ingredientes con su costo por unidad y peso en gramos.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Verificar existencia:</strong> Usa la barra de busqueda para verificar si un ingrediente ya existe antes de crearlo.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Modificar un producto:</strong> Haz clic en el icono de editar para actualizar el costo, peso o nombre.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Insertar un nuevo producto:</strong> Haz clic en Nuevo ingrediente y completa los campos (nombre, precio, peso).</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Eliminar un producto:</strong> Haz clic en el icono de eliminar junto al ingrediente.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Filtros:</strong> Usa el ícono de filtro junto al buscador para ver todos, solo tus ingredientes propios o solo el banco general.</span>
              </li>
            </ul>
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            <strong>Nota:</strong> La informacion se basa en promedios de mercado. Trabaja unicamente en las casillas indicadas e ingresa la informacion correspondiente.
          </p>
        </div>
      </Modal>
    </div>
  )
}