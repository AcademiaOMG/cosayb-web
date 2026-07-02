# Banco de Recetas — Frontend Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un tab "Banco" en `/recetas` que muestre las 150 recetas públicas con dos acciones por card: "Importar" (copia silenciosa) y "Usar como plantilla" (copia + abre editor).

**Architecture:** La página `/recetas` agrega un `activeTab` state. El tab "Banco" llama a `GET /recipes/banco`, muestra `BancoRecipeCard` por cada receta, y delega la acción al handler de la página que llama `POST /recipes/importar-banco/:id`. "Usar como plantilla" hace lo mismo pero redirige a `/recetas/:newId/editar`.

**Tech Stack:** Next.js App Router, React, SWR, TypeScript, CSS-in-JS inline styles (patrón existente del proyecto).

## Global Constraints

- Todo componente de página usa `"use client"`. Sin shadcn/ui — usar estilos inline con variables CSS del proyecto (`var(--bg-surface)`, `var(--accent)`, etc.).
- El fetcher de `lib/api.ts` usa `fetchAPI` con `credentials: "include"`.
- Los tipos numéricos de recetas vienen como string desde Drizzle (`servings`, `quantityG`, etc.).
- No agregar librerías nuevas.

---

### Task 3: Tipos + funciones API cliente

**Files:**
- Modify: `cosayb-web/types/domain.ts` — hacer `organizationId` nullable en `Recipe`
- Modify: `cosayb-web/lib/api.ts` — agregar `getBancoRecipes` e `importarBancoRecipe`

**Interfaces:**
- Produces:
  - `getBancoRecipes(search?: string): Promise<{ data: Recipe[] }>`
  - `importarBancoRecipe(id: string): Promise<{ data: Recipe }>`

- [ ] **Step 1: Actualizar tipo `Recipe` en domain.ts**

En `cosayb-web/types/domain.ts`, localizar:
```typescript
export interface Recipe {
  id: string
  organizationId: string
```

Cambiar a:
```typescript
export interface Recipe {
  id: string
  organizationId: string | null   // null = receta del banco global
```

- [ ] **Step 2: Agregar funciones en lib/api.ts**

Al final de la sección `// ─── Recetas` de `cosayb-web/lib/api.ts`, justo antes de la sección `// ─── Menús`, agregar:

```typescript
/** GET /api/v1/recipes/banco — recetas del banco global (isPublic = true) */
export async function getBancoRecipes(search?: string): Promise<{ data: Recipe[] }> {
  const q = search ? `?search=${encodeURIComponent(search)}` : ''
  return fetchAPI(`/api/v1/recipes/banco${q}`)
}

/** POST /api/v1/recipes/importar-banco/:id — clona una receta del banco en el tenant */
export async function importarBancoRecipe(id: string): Promise<{ data: Recipe }> {
  return fetchAPI(`/api/v1/recipes/importar-banco/${id}`, { method: 'POST' })
}
```

- [ ] **Step 3: Commit**

```bash
git add cosayb-web/types/domain.ts cosayb-web/lib/api.ts
git commit -m "feat(web): add getBancoRecipes and importarBancoRecipe API client functions"
```

---

### Task 4: Componente `BancoRecipeCard`

**Files:**
- Create: `cosayb-web/components/app/recipes/BancoRecipeCard.tsx`

**Interfaces:**
- Consumes: `Recipe` de `@/types/domain`
- Props: `{ recipe: Recipe; onImport: (r: Recipe) => void; onUseAsTemplate: (r: Recipe) => void; importing: boolean }`

- [ ] **Step 1: Crear el componente**

Crear `cosayb-web/components/app/recipes/BancoRecipeCard.tsx`:

```tsx
"use client"

import type { Recipe } from "@/types/domain"
import { ChefHat, Download, Pencil, BookMarked } from "lucide-react"
import Button from "@/components/ui/Button"

interface BancoRecipeCardProps {
  recipe: Recipe
  onImport: (recipe: Recipe) => void
  onUseAsTemplate: (recipe: Recipe) => void
  importing: boolean
}

export default function BancoRecipeCard({
  recipe,
  onImport,
  onUseAsTemplate,
  importing,
}: BancoRecipeCardProps) {
  const servings = parseFloat(recipe.servings)
  const servingWeight = recipe.servingWeightG ? parseFloat(recipe.servingWeightG) : null
  const itemCount = recipe.items?.length ?? 0

  return (
    <article
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        transition: "box-shadow 0.18s ease, border-color 0.18s ease",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(18,33,58,0.10)"
        ;(e.currentTarget as HTMLElement).style.borderColor = "var(--border-medium)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = ""
        ;(e.currentTarget as HTMLElement).style.borderColor = "var(--border-light)"
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div
          style={{
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: "10px",
            background: "#F0FDF4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChefHat size={20} style={{ color: "#16A34A" }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h3
              className="font-semibold text-sm"
              style={{
                color: "var(--text-primary)",
                lineHeight: "1.3",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              {recipe.name}
            </h3>
            {recipe.isBase && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  color: "#6D28D9",
                  background: "#EDE9FE",
                  borderRadius: "100px",
                  padding: "2px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                <BookMarked size={10} />
                Base
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "2px" }}>
            {itemCount} ingrediente{itemCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <Stat label="Porciones" value={servings % 1 === 0 ? String(servings) : servings.toFixed(1)} />
        <Stat
          label="Peso / porción"
          value={servingWeight != null ? `${servingWeight} g` : "—"}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
        <Button
          size="sm"
          variant="ghost"
          loading={importing}
          onClick={() => onImport(recipe)}
          style={{ flex: 1, justifyContent: "center" }}
          title="Importar a mis recetas"
        >
          <Download size={14} />
          Importar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={importing}
          onClick={() => onUseAsTemplate(recipe)}
          style={{ flex: 1, justifyContent: "center" }}
          title="Importar y abrir en el editor"
        >
          <Pencil size={14} />
          Usar como plantilla
        </Button>
      </div>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "var(--bg-primary)",
        borderRadius: "10px",
        padding: "8px 10px",
      }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)", marginBottom: "2px" }}>
        {label}
      </p>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add cosayb-web/components/app/recipes/BancoRecipeCard.tsx
git commit -m "feat(web): add BancoRecipeCard component"
```

---

### Task 5: Agregar tabs + lógica en `recetas/page.tsx`

**Files:**
- Modify: `cosayb-web/app/(app)/recetas/page.tsx`

**Interfaces:**
- Consumes: `BancoRecipeCard`, `getBancoRecipes`, `importarBancoRecipe` de tareas anteriores

- [ ] **Step 1: Agregar imports al inicio del archivo**

Después de los imports actuales, agregar:

```typescript
import BancoRecipeCard from "@/components/app/recipes/BancoRecipeCard"
import { getBancoRecipes, importarBancoRecipe } from "@/lib/api"
```

- [ ] **Step 2: Agregar estado de tab y banco dentro del componente**

Después de `const [costError, setCostError] = useState<string | null>(null)`, agregar:

```typescript
// ── Tab ────────────────────────────────────────────────────────────────────
const [activeTab, setActiveTab] = useState<"mis-recetas" | "banco">("mis-recetas")

// ── Banco de recetas ───────────────────────────────────────────────────────
const [bancoSearch, setBancoSearch] = useState("")
const {
  data: bancoRecipes = [],
  isLoading: bancoLoading,
} = useSWR(
  activeTab === "banco" ? `banco-recipes-${bancoSearch}` : null,
  () => getBancoRecipes(bancoSearch || undefined).then((r) => r.data ?? []),
  { revalidateOnFocus: false, dedupingInterval: 60_000 }
)
const [importingId, setImportingId] = useState<string | null>(null)
const [importSuccess, setImportSuccess] = useState<string | null>(null) // nombre de receta importada
```

- [ ] **Step 3: Agregar handlers de importación**

Después de `handleOpenCost`, agregar:

```typescript
async function handleImport(recipe: Recipe) {
  if (importingId) return
  setImportingId(recipe.id)
  setImportSuccess(null)
  try {
    await importarBancoRecipe(recipe.id)
    await mutate() // refresca "mis recetas"
    setImportSuccess(recipe.name)
    setTimeout(() => setImportSuccess(null), 3000)
  } catch (err) {
    console.error("Error importando receta del banco:", err)
  } finally {
    setImportingId(null)
  }
}

async function handleUseAsTemplate(recipe: Recipe) {
  if (importingId) return
  setImportingId(recipe.id)
  try {
    const res = await importarBancoRecipe(recipe.id)
    await mutate()
    router.push(`/recetas/${res.data.id}/editar`)
  } catch (err) {
    console.error("Error usando receta como plantilla:", err)
    setImportingId(null)
  }
}
```

- [ ] **Step 4: Reemplazar el `<PageHeader>` actual con uno que incluya los tabs**

Localizar el bloque del `PageHeader` (líneas aprox. 76–93 del archivo actual) y reemplazarlo por:

```tsx
{/* ── Header ──────────────────────────────────────────────── */}
<PageHeader
  title="Recetas"
  subtitle={
    isLoading
      ? "Cargando…"
      : `${recipes.length} receta${recipes.length !== 1 ? "s" : ""} · ${recipes.filter((r) => r.isBase).length} base${recipes.filter((r) => r.isBase).length !== 1 ? "s" : ""}`
  }
  action={
    activeTab === "mis-recetas" ? (
      <Button
        id="btn-nueva-receta"
        variant="primary"
        onClick={() => router.push("/recetas/nueva")}
      >
        <Plus size={16} />
        Nueva receta
      </Button>
    ) : undefined
  }
/>

{/* ── Tabs ─────────────────────────────────────────────────── */}
<div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--border-light)", paddingBottom: "0" }}>
  {(["mis-recetas", "banco"] as const).map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      style={{
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: 500,
        color: activeTab === tab ? "var(--accent)" : "var(--text-secondary)",
        background: "transparent",
        border: "none",
        borderBottom: activeTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
        cursor: "pointer",
        transition: "all 0.15s ease",
        marginBottom: "-1px",
      }}
    >
      {tab === "mis-recetas" ? "Mis recetas" : `Banco (150)`}
    </button>
  ))}
</div>
```

- [ ] **Step 5: Agregar el bloque del tab "Banco" antes del cierre del div principal**

Antes de los modales (antes de `{/* ── Modal: eliminar */}`), agregar:

```tsx
{/* ── TAB: Banco de recetas ───────────────────────────────── */}
{activeTab === "banco" && (
  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

    {/* Buscador banco */}
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <Search
        size={16}
        style={{ position: "absolute", left: "12px", color: "var(--text-muted)", pointerEvents: "none" }}
      />
      <input
        type="search"
        placeholder="Buscar en el banco…"
        value={bancoSearch}
        onChange={(e) => setBancoSearch(e.target.value)}
        style={{
          width: "100%",
          height: "40px",
          paddingLeft: "36px",
          paddingRight: "12px",
          borderRadius: "12px",
          border: "1px solid var(--border-light)",
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
          fontSize: "14px",
          outline: "none",
        }}
      />
    </div>

    {/* Banner éxito importación */}
    {importSuccess && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 16px",
          borderRadius: "12px",
          background: "#F0FDF4",
          border: "1px solid #BBF7D0",
          color: "#166534",
          fontSize: "13px",
        }}
      >
        ✓ <strong>{importSuccess}</strong> importada a Mis recetas.
      </div>
    )}

    {/* Skeleton banco */}
    {bancoLoading && (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
          >
            <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "70%" }} />
            <div className="h-3 rounded" style={{ background: "var(--bg-secondary)", width: "40%" }} />
          </div>
        ))}
      </div>
    )}

    {/* Grid banco */}
    {!bancoLoading && (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {bancoRecipes.map((recipe) => (
          <BancoRecipeCard
            key={recipe.id}
            recipe={recipe}
            onImport={handleImport}
            onUseAsTemplate={handleUseAsTemplate}
            importing={importingId === recipe.id}
          />
        ))}
      </div>
    )}

    {!bancoLoading && bancoRecipes.length === 0 && (
      <EmptyState
        icon={<ChefHat size={40} style={{ color: "var(--text-muted)" }} />}
        title="Sin resultados en el banco"
        description="Intenta con otros términos de búsqueda."
      />
    )}
  </div>
)}
```

- [ ] **Step 6: Envolver el contenido de "Mis recetas" en un condicional**

Todo el bloque actual de búsqueda + filtros + skeleton + error + empty state + grid de cards de "Mis recetas" debe mostrarse solo cuando `activeTab === "mis-recetas"`. Envolver desde la barra de búsqueda hasta el grid:

```tsx
{/* ── TAB: Mis recetas ────────────────────────────────────── */}
{activeTab === "mis-recetas" && (
  <>
    {/* ── Barra de búsqueda + filtros (bloque existente sin cambios) */}
    {/* ── Skeleton, error, empty state, grid de RecipeCards (sin cambios) */}
  </>
)}
```

- [ ] **Step 7: Verificar en browser**

1. Abrir `http://localhost:3002/recetas`
2. Confirmar que hay dos tabs: "Mis recetas" y "Banco (150)"
3. Click en "Banco" → debe cargar las 150 recetas en grid
4. Buscar "pollo" → cards filtradas
5. Click "Importar" en una receta → banner verde "X importada a Mis recetas"
6. Cambiar a "Mis recetas" → la receta importada aparece en el grid
7. Volver a "Banco", click "Usar como plantilla" → redirige al editor de esa receta

- [ ] **Step 8: Commit**

```bash
git add cosayb-web/app/\(app\)/recetas/page.tsx
git commit -m "feat(web): add banco de recetas tab with import and use-as-template actions"
```
