"use client"

import { memo } from "react"
import useSWR from "swr"
import { ChevronRight, Pencil, Trash2 } from "lucide-react"
import type { Menu } from "@/types/domain"
import { getMenuCosto } from "@/lib/api"
import { fmt } from "./menuFormat"

/** Columnas en desktop, compartidas por la cabecera y las filas para que queden alineadas. */
const MENU_COLUMNS =
  "md:grid-cols-[minmax(0,1fr)_5rem_6rem_8.5rem_8.5rem_8.5rem_5.5rem] xl:grid-cols-[minmax(0,1fr)_6rem_7rem_10rem_10rem_10rem_6rem]"

function MenuTableHeader() {
  const cell = "text-xs font-semibold"
  return (
    <div
      className={`hidden items-center gap-4 px-5 py-3 md:grid ${MENU_COLUMNS}`}
      style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
      aria-hidden="true"
    >
      <span className={cell}>Menú</span>
      <span className={`${cell} text-right`}>Platos</span>
      <span className={`${cell} text-right`}>Personas</span>
      <span className={`${cell} text-right`}>Costo por porción</span>
      <span className={`${cell} text-right`} style={{ color: "var(--text-secondary)" }}>
        Precio por persona
      </span>
      <span className={`${cell} text-right`}>Precio total</span>
      <span />
    </div>
  )
}

/** Costos del menú: misma clave que otros usos de getMenuCosto, así comparten caché de SWR. */
function useMenuMoney(menuId: string, hasItems: boolean) {
  const { data, isLoading } = useSWR(
    hasItems ? ["menu-costo", menuId] : null,
    () => getMenuCosto(menuId).then((r) => r.data.costo),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  )
  return {
    costPerServing: data ? data.costoTotalPorcion : null,
    pricePerPerson: data ? data.precioPotencialVentaPorcion : null,
    priceTotal: data ? data.precioPotencialVentaTotal : null,
    loading: hasItems && isLoading,
  }
}

function Money({ value, loading, strong }: { value: number | null; loading: boolean; strong?: boolean }) {
  if (loading) {
    return <span className="inline-block h-3.5 w-16 animate-pulse rounded-md" style={{ background: "var(--bg-secondary)" }} />
  }
  if (value == null) return <span style={{ color: "var(--text-muted)" }}>—</span>
  return (
    <span className={strong ? "font-bold" : ""} style={{ color: strong ? "var(--text-primary)" : "var(--text-secondary)" }}>
      {fmt(value)}
    </span>
  )
}

interface MenuRowProps {
  menu: Menu
  onView: (menu: Menu) => void
  onEdit?: (menu: Menu) => void
  onDelete?: (menu: Menu) => void
}

const MenuRow = memo(function MenuRow({ menu, onView, onEdit, onDelete }: MenuRowProps) {
  const dishes = menu.recetasCount ?? menu.recetas?.length ?? 0
  const { costPerServing, pricePerPerson, priceTotal, loading } = useMenuMoney(menu.id, dishes > 0)

  return (
    <li className="group relative list-none transition-colors even:bg-[var(--bg-primary)]/60 hover:bg-[var(--accent-light)]/50 focus-within:bg-[var(--accent-light)]/50">
      {/* Botón que cubre toda la fila → abre el detalle. Las acciones van por encima (z-10). */}
      <button
        type="button"
        onClick={() => onView(menu)}
        className="absolute inset-0 z-0 w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
        aria-label={`Ver menú ${menu.nombre}`}
      />

      {/* ── Mobile: nombre, dos cifras con etiqueta y pie ─────────────────── */}
      <div className="pointer-events-none relative flex flex-col gap-2.5 px-4 py-3.5 md:hidden">
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 text-[15px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
            {menu.nombre}
          </span>
          <ChevronRight size={16} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: "var(--border-medium)" }} />
        </div>
        <dl
          className="m-0 grid grid-cols-2 gap-px overflow-hidden tabular-nums"
          style={{ background: "var(--border-light)", borderRadius: "var(--radius-md)" }}
        >
          <div className="flex flex-col gap-0.5 px-3 py-2" style={{ background: "var(--bg-primary)" }}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Costo por porción
            </dt>
            <dd className="m-0 text-[15px]">
              <Money value={costPerServing} loading={loading} />
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 px-3 py-2" style={{ background: "var(--bg-primary)" }}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Precio por persona
            </dt>
            <dd className="m-0 text-[15px]">
              <Money value={pricePerPerson} loading={loading} strong />
            </dd>
          </div>
        </dl>
        <p className="m-0 text-[12.5px] tabular-nums" style={{ color: "var(--text-muted)" }}>
          {dishes} plato{dishes !== 1 ? "s" : ""} · {menu.numPersonas} persona{menu.numPersonas !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Desktop: columnas alineadas, números a la derecha ────────────── */}
      <div className={`pointer-events-none relative hidden items-center gap-4 px-5 md:grid ${MENU_COLUMNS}`} style={{ minHeight: 52 }}>
        <span className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }} title={menu.nombre}>
          {menu.nombre}
        </span>
        <span className="text-right text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {dishes}
        </span>
        <span className="text-right text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {menu.numPersonas}
        </span>
        <span className="text-right text-sm tabular-nums">
          <Money value={costPerServing} loading={loading} />
        </span>
        <span className="text-right text-sm tabular-nums">
          <Money value={pricePerPerson} loading={loading} strong />
        </span>
        <span className="text-right text-sm tabular-nums">
          <Money value={priceTotal} loading={loading} />
        </span>
        <div className="flex items-center justify-end gap-0.5">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(menu)}
              aria-label={`Editar menú ${menu.nombre}`}
              title="Editar menú"
              className="pointer-events-auto relative z-10 p-2 text-[var(--text-secondary)] opacity-60 transition hover:bg-[var(--bg-secondary)] hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(menu)}
              aria-label={`Eliminar menú ${menu.nombre}`}
              title="Eliminar menú"
              className="pointer-events-auto relative z-10 p-2 text-[var(--text-secondary)] opacity-60 transition hover:bg-red-50 hover:text-[#B42020] hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </li>
  )
})

/** Lista de menús: el compendio de platos y extras con lo que importa en plata. */
export default function MenuTable({ menus, onView, onEdit, onDelete }: { menus: Menu[] } & Omit<MenuRowProps, "menu">) {
  return (
    <div
      className="overflow-hidden"
      style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}
    >
      <MenuTableHeader />
      <ul aria-label="Menús">
        {menus.map((menu) => (
          <MenuRow key={menu.id} menu={menu} onView={onView} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </ul>
    </div>
  )
}
