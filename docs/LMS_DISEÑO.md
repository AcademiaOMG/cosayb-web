# Diseño del LMS de Academia OMG

Estado: implementado en `feat/lms-web` (sin push, sin PR). Estilos en `app/(learn)/lms.css`, componentes en `components/lms/`.

## 1. Qué se evaluó y qué se adoptó

| Fuente | Patrón | Decisión |
|---|---|---|
| Referencia "Quyl" (imagen 5) | Sidebar con ítem activo de color, topbar con búsqueda/campana/avatar, tarjeta "continuar", tres tarjetas pastel con número grande y donut, tabla "Mis cursos" con tabs, calendario con rango, lista "Próximos" | Adoptado en `/inicio` y `LearnShell`. Pasteles amarillo/rosa/verde conservados; el morado se cambió por el azul del proyecto |
| Referencia "Fikri" (imágenes 6-8) | Rejilla de tarjetas con portada ilustrada y badges, donuts, chips de filtro, vista lista, tabs subrayadas | `CourseCard`/`CourseRow` (catálogo, mis cursos, panel del instructor), `Tabs`, `Chip` |
| Referencia imagen 9 | Detalle de quiz con métricas (donut/aro), barras por opción (verde = correcta), panel Statistics | `AnalyticsPanel` (pestaña "Analítica" del curso) |
| Coursera / Udemy / Skillshare | Catálogo con filtros y orden, página de curso con hero, temario en acordeón, instructor | `/cursos`, `/cursos/[slug]` |
| Duolingo | Evaluación una pregunta por pantalla, progreso, celebración | `/evaluacion/[id]` con confeti y donut animado |
| Moodle 5 / Canvas / Teachable | Reproductor con currículo lateral plegable y pestañas (resumen, recursos, notas) | `/aprender/[slug]` |
| Thinkific | Certificado imprimible con verificación pública | `CertificateArt`, `/verificar` |

## 2. Decisión de paleta (azul de marca, sin violeta)

Instrucción del usuario: donde las referencias usan morado se usa el azul del proyecto. Todo el morado se resuelve con los tokens existentes de `app/globals.css`:

- `--accent` (botones, ítem activo, tabs, chips, barras, donuts, focos, enlaces, gradientes e ilustraciones)
- `--accent-hover` (hover/pressed y sombras de gradiente)
- `--accent-light` (fondos tintados, badges)
- `--accent-text` (texto sobre fondos tintados, AA)
- Tintes derivados con `color-mix(in srgb, var(--accent) N%, white|transparent)`; no hay hex nuevos de color de marca.
- Se conservan los semánticos: pastel amarillo/rosa/verde de las tarjetas de estado, verde = correcto, rojo/rosa = error, ámbar = aviso.
- Neutros (fondo `#f3f6fb`, línea `#e3e8f2`, tinta `--text-primary`, apagado `#566176`) en tono azul-grisáceo.
- Verificación: `grep -riE "violet|violeta|purple|morado|indigo|índigo|#6a45f2|#7c5cf5|#5532d6|#5a3dd0|#a78bfa|#6d28d9|#7c3aed|#8b5cf6"` sobre `components/lms`, `app/(learn)`, `app/(instructor)` y `app/(admin)` no devuelve coincidencias (ver informe final).
- En el código la antigua clave de tono `violet` se renombró `brand` y las variables `--l-tint*`.

## 3. Tokens

Definidos en `.lms-root` (`lms.css`): `--l-bg`, `--l-surface`, `--l-ink`, `--l-ink-2`, `--l-muted`, `--l-line`, `--l-brand*` (alias de `--accent*`), pasteles `--l-{amber,rose,mint,sky}-{bg,ink}`, `--l-tint*`, radios (22 px tarjetas, 14 px controles), sombras suaves de dos capas y curva `--l-ease`. Tipografía Manrope (ya cargada por el proyecto). Solo modo claro: el proyecto no soporta oscuro.

## 4. Componentes

- Base (`components/lms/ui/index.tsx`): Card, Badge, Button, LinkButton, Chip, Tabs (roles tablist/tab, flechas), Avatar, Skeleton, EmptyState, ErrorPanel, ProgressBar (role progressbar), Donut (role img), IconTile, PageHeader.
- Compuestos (`parts.tsx`): CourseCard, CourseRow, CourseThumb, LevelBadge, StatusBadge, CardSkeletonGrid. `ActivityCalendar`, `CertificateArt`, `AssetViews` (VideoPlayer, mini-markdown, documentos).
- Shell (`LearnShell.tsx`): sidebar colapsable (se recuerda en localStorage con try/catch), modo "cine" automático en el reproductor, barra inferior en móvil, búsqueda, notificaciones (pendientes reales), enlace "Mi negocio (costeo)" solo si el usuario tiene membresías.
- Ilustraciones (`art/Cover.tsx`): 15 escenas SVG isométricas originales (costeo, merma, equilibrio, menú, inventario, compras, panadería, precios, finanzas, autor, servicio, higiene, bar, delivery, cocina), inline, `aria-hidden`.
- Seguridad de contenido: `lib/lms/markdown.ts` es un mini-markdown propio que produce un árbol de nodos (no HTML); React lo renderiza escapado. Sin enlaces ni imágenes. Probado contra payloads XSS (`markdown.test.ts`); `safety.test.ts` prohíbe `dangerouslySetInnerHTML`/`innerHTML`.

## 5. React Bits

Fuente consultada: https://reactbits.dev y el repositorio `DavidHDev/react-bits`. Licencia verificada en el repositorio: **MIT + Commons Clause**. Se puede usar dentro de una aplicación o sitio (uso comercial incluido) pero **no** vender, sublicenciar ni redistribuir los componentes solos, en paquete o como versión portada. Se incluye el aviso de origen/licencia en cada archivo. No se copió código tal cual: son reimplementaciones propias, en TypeScript, sin dependencias (sin gsap/motion/three/ogl), de estas ideas:

| Archivo | Idea de origen |
|---|---|
| `components/lms/fx/CountUp.tsx` | "Count Up" (contadores animados) |
| `components/lms/fx/SpotlightCard.tsx` | "Spotlight Card" (luz que sigue al cursor, con variables CSS) |
| `components/lms/fx/Confetti.tsx` | fondos/partículas (confeti CSS decorativo) |

Todas respetan `prefers-reduced-motion` (CSS global del LMS reduce animaciones a ~0 ms y oculta el confeti; CountUp salta al valor final).

## 6. Animaciones

Solo `transform`/`opacity` y `stroke-dashoffset`: entrada escalonada (`.l-rise` con `--i`), hover de tarjetas, barras y donuts que se llenan, contadores, transición de página (`.l-page`), pop al seleccionar/completar, flotación de ilustraciones.

## 7. Accesibilidad

Enlace "Saltar al contenido"; foco visible de 3 px; tabs con roles y flechas; progreso con `role=progressbar` y valores; donuts con `role=img` y etiqueta; navegación con `aria-current`; radios nativos en el quiz; iconos decorativos `aria-hidden`; estados de curso con texto oculto ("Bloqueada", "Completada"). Contraste: texto apagado `#566176` sobre blanco ≈ 6:1; textos pastel usan las variantes `-ink` oscuras. No se ejecutó una auditoría automática de contraste (axe) en esta ronda.

## 8. Datos de demo

`cosayb-api/src/scripts/seed-lms-demo.ts` (idempotente, `--limpiar`, se niega a correr si `DATABASE_URL` no es localhost). **Los videos de demo no son reales**: solo una cabecera `ftyp` mínima para probar la tubería (no se reproduce) y un PDF mínimo en la primera lección del primer curso. El instructor debe subir videos reales (MP4/WebM).

## 9. Lo no incluido / pendiente

- QR en el certificado (se imprime código y URL de verificación; un QR requiere un codificador propio o dependencia).
- Reordenar módulos/lecciones por arrastre: el editor existente conserva su mecanismo por posición.
- Subida de recursos con barra de progreso: el editor usa la subida existente sin progreso por bytes.
- Auditoría automática de contraste y `next build` no ejecutados.
- Nota técnica: el `SWRProvider` global cambia de caché justo tras hidratar; en una recarga dura las peticiones iniciadas antes quedan escritas en el caché anterior y la vista queda "cargando". El LMS monta el contenido un frame después para evitarlo. La consola de plataforma (fuera del alcance) puede mostrar ese síntoma al recargar en frío.

## 10. Checklist contra las referencias

| Referencia | Elemento | Dónde |
|---|---|---|
| 5 Quyl | Sidebar con ítem activo | `LearnShell` |
| 5 | Topbar búsqueda/campana/avatar | `LearnShell` |
| 5 | Tarjeta continuar + Resume | `/inicio` |
| 5 | Tres tarjetas pastel con donut | `/inicio` `StatusCard` |
| 5 | Mis cursos con tabs y barras de colores | `/inicio`, `/mis-cursos` |
| 5 | Calendario con rango + Próximos | `ActivityCalendar`, `/inicio` |
| 6-7 Fikri | Tarjetas con portada, badges, donut, tags | `CourseCard` |
| 6-7 | Chips de filtro, orden, búsqueda | `/cursos` |
| 6-7 | Tabs superiores | panel del instructor (`/instructor`) |
| 8 | Vista de lista | `CourseRow`, panel del instructor |
| 9 | Métricas (donut/aro, envíos, tiempo) | `AnalyticsPanel` |
| 9 | Barras horizontales por opción (verde correcta) y Statistics | `QuestionCard` |
| 9 | Tabs Preguntas / Resumen | `QuizSection` |

## Áreas y shells (estudiante · instructor · administrador)

Tres áreas separadas, cada una con su shell (`components/lms/LearnShell.tsx` con la prop `area`), menú y portada; no hay menús mezclados ni selector de «ver como». Rutas: `app/(learn)` (estudiante), `app/(instructor)/instructor/…`, `app/(admin)/administracion/…`. Las pantallas compartidas (reproductor `components/lms/Player.tsx`, evaluación `QuizRunner.tsx`, editor de cursos `studio/`) enlazan solo dentro de su área mediante `usePaths()` (`lib/lms/roles.ts`). Cada shell redirige a la portada del rol de quien entra a un área ajena (`areaRedirect`) y el servidor responde 403. Detalle de roles y permisos: `cosayb-api/docs/LMS_ROLES.md`.
