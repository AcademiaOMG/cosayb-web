# Marca blanca (white label) por negocio

Cada negocio puede personalizar logotipos, paleta, radios, sombras y tipografía. Requiere la feature `white_label` del plan; sin ella el editor se muestra bloqueado con el CTA de mejora de plan.

## Cómo funciona

1. **Contrato** (`lib/branding/types.ts`): `BrandTheme` = 11 colores `#RRGGBB` + `radius` + `shadow` + `font`. `BrandingResponse` lo trae junto a los assets (`logoPrimary`, `logoAlt`, `icon`) y `displayName`.
2. **Derivación** (`lib/branding/theme.ts`): `themeToCssVars(theme)` convierte el tema en todos los tokens CSS (`--accent`, `--bg-*`, `--sidebar-*`, familias de estado, `--radius-*`, `--shadow-*`, `--font-*`). El ThemeProvider los aplica en el wrapper `.app-theme-neutral`. `validateTheme` / `autoFixTheme` comprueban y corrigen el contraste AA.
3. **Editor** (`/configuracion/marca`, `components/branding/editor/*`): borrador local con `useReducer` (`lib/branding/draft.ts`: reducer, `isDirty`, validación de archivos, catálogos). Guardar hace `PUT /organizations/me/branding`; los logotipos se suben/eliminan al instante por `POST/DELETE .../branding/assets`.
4. **Vista previa en vivo** (`BrandPreview.tsx`): contenedor aislado con `style={themeToCssVars(draft)}` y componentes reales del design system.
5. **Probar en toda la plataforma** (`lib/branding/platformPreview.ts` + `PlatformPreviewBar.tsx`, montada en `app/(app)/layout.tsx`): inyecta `<style id="brand-preview">` en `<head>` con cada token `!important` sobre `:root, body, .app-theme-neutral` (así gana al estilo en línea del wrapper y también cubre los portales, que llevan su propio `.app-theme-neutral`). El borrador vive solo en memoria; "Descartar" o salir elimina el `<style>`; "Guardar" persiste. No se recarga la página.

## Tipografías

Las 8 fuentes curadas se cargan con `next/font/google` en `app/layout.tsx` y exponen estas variables CSS (mapeo `BRAND_FONT_VARIABLE` en `theme.ts`):

`--font-manrope`, `--font-inter`, `--font-poppins`, `--font-dm-sans`, `--font-nunito`, `--font-lato`, `--font-montserrat`, `--font-source-sans-3`.

Estrategia de descarga: Manrope e Inter ya estaban cargadas. Las otras seis usan `preload: false`; next/font solo emite el `@font-face` con `unicode-range` y el navegador descarga el archivo únicamente cuando un elemento usa esa familia. `next/font` no permite elegir fuentes por tenant en tiempo de ruta (se declaran de forma estática), así que esta es la opción más barata: se paga solo la fuente usada (más las que se muestren en el selector del editor). Coste: sin `<link rel=preload>` hay un breve swap en el primer render.

## Cómo añadir un token nuevo

1. Declara el valor por defecto en `:root` de `app/globals.css` (y en `.app-theme-neutral` si difiere) y, si usas Tailwind, el puente `@theme inline`.
2. Derívalo en `themeToCssVars` (`lib/branding/theme.ts`) a partir de los colores del tema (o añade un color a `BrandColors` y a `DEFAULT_BRAND_THEME`, a la validación del API y a `COLOR_GROUPS` en `lib/branding/draft.ts`; hay un test que exige que los grupos cubran todos los colores).
3. Usa `var(--token)` en los componentes; nunca hex sueltos para estilos de marca.
4. Mantén el valor derivado del tema por defecto idéntico al CSS actual.

## Límites conocidos

- La vista previa aislada no hereda el tema en **portales** (desplegable de `SearchableSelect`, `Modal` real, toasts, tooltips): por eso el modal de la muestra es simulado. Para verlos, "Probar en toda la plataforma".
- No se tematizan a propósito: arte decorativo (portadas LMS), calculadora tipo hardware, colores de datos por rol y de gráficos (`RatioDonut`, `ValuationDetailCard`), sitio de marketing/login.
- Quedan colores rojos/verdes de estado sueltos en algunas pantallas (`#DC2626`, `#EF4444`, `#16A34A` en cuenta, equipo, roles, factor de rendimiento) con tonos distintos a los tokens por defecto; migrarlos cambiaría el aspecto por defecto.
- Los logotipos aceptan PNG/JPG/WebP/SVG de hasta 1 MB (validación de cliente; el API valida de nuevo).
