# Design system — COSAYB web

Mini sistema extraído del diseño existente (Inicio y barra mobile). Los tokens viven en `app/globals.css`.
Dentro de `app/(app)/...` aplica `.app-theme-neutral`, que sobreescribe fondos, textos, bordes, radios y sombras.

## Tokens

| Rol | Token | Valor (app autenticada) |
|---|---|---|
| Fondo página / secundario / superficie | `--bg-primary` / `--bg-secondary` / `--bg-surface` | `#EFF2F6` / `#E8EBF0` / `#FFFFFF` |
| Texto | `--text-primary` / `--text-secondary` / `--text-muted` | `#12213A` / `#4B5563` / `#8890A0` |
| Acento | `--accent`, `-hover`, `-light`, `-text` | `#1B4FD8`, `#1540B0`, `#DEEAFF`, `#1434A4` |
| Bordes | `--border-light` / `--border-medium` | `#E2E5EA` / `#CBD2DA` |
| Estados | `--success` / `--warning` / `--error` (`--error-hover`) | `#10B981` / `#F59E0B` / `#B42020` (`#8F1A1A`) |
| Radios | `--radius-sm` / `-md` / `-lg` | 10 / 14 / 20 px |
| Sombras | `--shadow-sm` / `-md` / `-lg` | ver `globals.css` |

Todos están disponibles en Tailwind (`bg-bg-surface`, `text-text-muted`, `text-error`, `bg-success`…).

Uso de radios: **lg** cards y paneles; **md** inputs, botones y stats; **sm** elementos pequeños.

## Liquid Glass

Dos niveles, definidos en `@layer components` (las utilidades de Tailwind pueden sobreescribirlos).
Solo los valores propios del efecto son tokens `--glass-*`; fondo, radio y sombra del nivel sutil reutilizan `--bg-surface`, `--radius-lg` y `--shadow-sm`.

### `glass` — sutil
Cards y paneles sobre el fondo de la app: superficie blanca con mancha azul de marca (`--glass-tint`) y `--glass-filter` (`blur(10px) saturate(140%)`).

```tsx
<Card variant="glass">…</Card>      // incluye p-6
<div className="glass p-5">…</div>  // o la clase directa
```

Hover tipo elevación (como las cards de Inicio): `transition` + `hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]`
(ver `.glass-card` en `app/(app)/dashboard/glass.css`).

### `glass-strong` — pronunciado
Elementos **flotantes sobre contenido** que deben distorsionar lo que hay detrás (barra inferior mobile, overlays): fondo `--glass-strong-bg` 50% blanco, `--glass-strong-filter` (`blur(26px) saturate(220%)`), sombra con highlights interiores y brillo diagonal (`::before`).

```tsx
<nav className="glass-strong fixed bottom-5 left-1/2 rounded-full">…</nav>
```

Requisitos: el elemento debe estar posicionado (`fixed`/`absolute`/`relative`) y definir su propio `border-radius`; el `::before` se ancla a él.
Los hijos directos quedan por encima del brillo.

**Cuándo usar cuál:** `glass` para contenido (cards, paneles, listas); `glass-strong` solo para superficies flotantes. No convertir pantallas completas a glass.

Contraste: texto `--text-primary` / `--text-secondary` sobre ambos niveles.

## Spacing (patrones observados)

- Contenedor de página: `px-4 sm:px-6 lg:px-8 py-6` (`AppContainer`).
- Entre secciones: `gap-8`. Dentro de una sección (título + contenido): `gap-3`.
- Padding de cards: `p-6` en `Card`; `20px` en cards de módulo; `16px 18px` en stats.
- Grilla de cards: gap 14px (mobile) / 18px (≥640) / 20px (≥1024).

## Estados con tokens

`Button` (danger) e `Input` (error) usan `--error` / `--error-hover`. Otros archivos aún tienen esos hex literales; migrarlos a los tokens es seguro (mismos valores).

## Notificaciones (`toast`)

Sistema **único y global**: un solo `<FeedbackProvider />` montado en `app/layout.tsx` (no montar otro). El store es independiente de React (`lib/toast.ts`), así que se puede llamar desde cualquier handler, hook o utilidad.

```tsx
import { toast } from "@/lib/toast"

toast.success("Receta guardada")
toast.error("No se pudo eliminar el ingrediente", { description: "Intenta de nuevo en unos segundos." })
toast.warning("Tu plan está por vencer")
toast.info("Importamos 12 ingredientes")
```

| Aspecto | Regla |
|---|---|
| Ubicación | Móvil: arriba y centrado (abajo está la barra flotante). ≥sm: abajo a la derecha. `z-70`, sobre modales. |
| Duración | success 4 s · info 5 s · warning 6 s · error 8 s. `{ duration: 0 }` = no se cierra sola. Pausa al hover/foco. |
| Jerarquía | Tarjeta blanca con borde izquierdo e icono del color semántico (`--success`, `--error`, `--warning`, `--accent`). Máx. 4 simultáneas. |
| Deduplicación | Mismo tipo + mensaje mientras sigue visible → no se apila: muestra `×N` y reinicia el tiempo. `{ id }` para agrupar a mano. |
| Accesibilidad | `error`/`warning` → `role="alert"` (assertive); `success`/`info` → `role="status"` (polite). Cierre con botón; el texto lleva prefijo sr-only del tipo. |
| Animación | `.toast-in` / `.toast-out` (200/160 ms); desactivada con `prefers-reduced-motion`. |

**No usar** mensajes inline verdes/rojos improvisados (`setMsg`, `bg-[#F0FDF4]`, `#166534`…) ni `alert()` para confirmar un resultado. Los errores de validación de un campo siguen siendo inline en el propio campo (`Input error`); el toast es para el resultado de una acción.

## Confirmaciones (`useConfirm`)

Solo para acciones **destructivas o sensibles**: eliminar, descartar cambios sin guardar, cerrar sesión en todos los dispositivos. **Nunca** para confirmar un guardado.

```tsx
import { useConfirm } from "@/components/ui/ConfirmDialog"

const confirm = useConfirm()

async function onDelete(recipe: Recipe) {
  const ok = await confirm({
    title: "Eliminar receta",
    itemName: recipe.name,                       // qué se eliminará, destacado
    description: "Esta acción no se puede deshacer.",
    confirmLabel: "Eliminar",                    // por defecto: "Eliminar" (danger) / "Confirmar"
    variant: "danger",                           // rojo; "default" para acciones no destructivas
  })
  if (!ok) return
  await deleteRecipe(recipe.id)
  toast.success(`Receta «${recipe.name}» eliminada`)
}
```

Construido sobre `components/ui/Modal.tsx`: el foco inicial cae en **Cancelar**, Esc/backdrop/X cancelan (resuelve `false`), trap de foco y restauración del foco al cerrar. Peticiones simultáneas se encolan. Fuera de componentes: `confirmDialog(options)` de `lib/confirm.ts`.

## Modales (`components/ui/Modal.tsx`)

Todo diálogo debe usar `Modal` (no `fixed inset-0` propios). Comportamiento estándar:

- **Animación en todos**: overlay fundido (220 ms) + panel con leve subida/escala (entrada 220 ms, salida 160 ms con desmontaje diferido). `animate={false}` solo para casos excepcionales. `prefers-reduced-motion` la elimina (CSS y sin espera de salida).
- Esc cierra solo el modal superior (pila), trap de Tab/Shift+Tab, foco inicial en `[data-autofocus]` → botón «Cerrar» → panel, y el foco vuelve al disparador. El scroll del body se libera al cerrar el último modal abierto.
- `aria-labelledby` con id único por instancia (`useId`), así que se pueden anidar modales.
- Variantes: por defecto `max-w-lg`; `wide` (3xl); `xwide` (5xl, calculadoras); `blur` para overlay desenfocado.
- Excepciones intencionales sin Modal: bloqueos de `SessionGuard` (no descartables) y el menú móvil de `Nav` (no es un diálogo).
