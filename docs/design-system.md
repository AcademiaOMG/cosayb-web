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
