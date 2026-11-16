# Marca blanca: tokens y motor de color

Fuente de verdad del alcance de cada color: `lib/branding/tokens.ts` (catalogo `TOKEN_GROUPS`, `REQUIRED_CSS_VARS`).
Motor: `lib/branding/{color,palette,calcPalette,theme}.ts`.

## Modelo de 3 capas

1. **Entradas** (`BrandTheme.colors` + `calculator`): lo que el negocio elige. 11 colores + 1.
2. **Derivados** (`BrandTheme.overrides`, todos opcionales): sidebarText, sidebarActiveBg, sidebarActiveText,
   headerBg, headerText, textSecondary, border. El motor los calcula; el usuario puede fijarlos en "Avanzado".
3. **Tokens CSS** (`--accent`, `--sidebar-active-bg`, ...): lo unico que leen los componentes. Nunca un hex ni una entrada.

`themeToCssVars(theme)` emite SIEMPRE todas las `REQUIRED_CSS_VARS` (hay una prueba que lo exige), mas radios, sombras,
fuentes, `--bg-inverse`, `--on-inverse`, `--glass-tint`, `--secondary-text`, `--*-text-strong`.

## Que hace cada token (resumen; el detalle esta en tokens.ts)

| Token | Variables | Alcance |
|---|---|---|
| primary | `--brand-primary`, `--bg-inverse` | Identidad, ilustraciones, base de la calculadora. No toca sidebar ni textos |
| accent | `--accent`, `-hover`, `-light`, `-text`, `--on-accent`, `--focus-ring` | Botones, enlaces, foco, pestanas/chips seleccionados, progreso |
| secondary | `--brand-secondary`, `--secondary-light`, `--on-secondary`, `--secondary-text` | Etiquetas/badges informativos, series secundarias |
| sidebarBg | `--sidebar-bg` | Solo el fondo del sidebar |
| sidebarText (derivado) | `--sidebar-text/-muted/-label/-hairline/-hover-bg` | Texto, iconos, divisores y hover del sidebar |
| sidebarActiveBg/Text | `--sidebar-active-bg/-text` | Item seleccionado del menu |
| headerBg/headerText | `--header-bg/-text/-border`, `--chip-bg/-text/-border` | Barra superior y chip del negocio/plan |
| bg / surface | `--bg-primary/-secondary`, `--bg-surface`, `--on-surface` | Lienzo y tarjetas/modales/inputs |
| border | `--border-light/-medium` | Bordes y divisores |
| text / textSecondary | `--text-primary`, `--text-secondary/-muted` | Texto sobre bg y surface |
| success/warning/error/info | `--x`, `--x-bg`, `-bg-strong`, `-text`, `-border` (+`-solid`, `-hover`) | Banners, badges, errores |
| calculator | 12 variables `--calc-*` | Solo la calculadora |

## Algoritmos

### Color (`color.ts`, sin dependencias)
- sRGB <-> lineal <-> OKLab <-> OKLCH (matrices de Ottosson). `toOklch`, `fromOklch`.
- **Gamut mapping**: si (L,C,h) cae fuera de sRGB se reduce C por biseccion conservando L y h (no se recorta canal a canal,
  que cambiaria el matiz).
- `contrastRatio` WCAG 2.x; `apca` (SAPC 0.0.98G) solo informativo.
- `onColor(bg)`: blanco o tinta `#12213A`; si ninguno llega a 4.5 (fondos de luminosidad media) usa negro/blanco puros.
  Garantiza >=4.5 para cualquier fondo.
- `ensureContrast(fg, bg, min)`: mueve L en OKLCH (matiz y croma conservados, con gamut mapping) en la direccion natural
  (texto claro sigue siendo claro); si no hay solucion, prueba el otro sentido; ultimo recurso negro/blanco.
  `ensureContrastAll` lo hace contra varias superficies, con barrido por extremos si oscila (polaridades mixtas).
- `mix` perceptual en OKLab. `isFluorescent` / `tameChroma` limitan neones (C>=0.255, o C alto con L alta).

### Paleta sugerida (`suggestPalette(primary, {harmony, sidebar})`)
accent = primary con croma acotado y L ajustada a >=4.5 contra surface; secondary por rotacion de matiz (analogo +30,
complementario +180, triadico +120, monocromo) con croma contenido; bg/surface neutros con croma 0.004-0.012 del matiz de
marca; text AAA (>=7) tintado; sidebar oscuro (L 0.25), claro (L 0.975) o de marca; estados con matiz fijo
(verde 152, ambar 78, rojo 27, azul 245) y croma ligeramente escalado por el de la marca. Grises/blancos/negros: sin tinte.
Es un punto de partida; todo sigue editable.

### Derivacion en `themeToCssVars`
- Texto: `ensureContrastAll(text, [bg, surface, bg-secondary], 4.5)`; secondary/muted derivan de el.
- Accent: `--on-accent` por `onFill` (blanco si llega a 3:1; ver abajo); hover = L -/+ 0.06 manteniendo el contraste del texto; light = L 0.95 (0.30 si la
  superficie es oscura) con croma bajo; `--accent-text` >=4.5 sobre light, bg y surface; `--focus-ring` >=3.
- Sidebar: texto por `onColor(sidebarBg)`; muted/label >=4.5 sobre fondo y hover. **Item activo**: usa accent; si no
  contrasta >=3 con el sidebar se ajusta su L (si el salto <=0.22 y conserva croma) o se usa un tono claro/oscuro del
  matiz del sidebar. Su texto es `onFill` (>=3, texto semibold de interfaz).
- Encabezado: texto = `text` si contrasta, si no `onColor(headerBg)`. Chip = accent-light (o neutro si se confunde con el
  encabezado) con texto >=4.5.
- Estados: bg L 0.97 / strong 0.93 / borde 0.85 con el matiz del estado; texto >=4.5 y strong >=7. `--warning-solid` >=3.
- Calculadora: `calcPaletteVars(base)` normaliza en OKLCH: carcasa siempre oscura (L 0.27/0.20, C 0.04-0.09), teclas marfil
  fijas, teclas de operacion en tono de marca desaturado claro, igual con L 0.56 y C 0.10-0.19, LCD verdoso clasico; textos
  por contraste (LCD >=7); acento y anillo >=3 sobre la carcasa; teclas >=3 contra la carcasa.
- **Overrides**: son el punto de partida. Al pintar, si no llegan al minimo se corrigen (red de seguridad: nada ilegible
  sale a pantalla). `validateTheme` los reporta con `fix` antes de guardar; `autoFixTheme` los corrige.

## Garantias (verificadas por pruebas)
`CONTRAST_PAIRS` (theme.ts) lista cada pareja texto/fondo del contrato con su minimo; `auditCssVars(vars)` devuelve las que
fallen. Las pruebas la aplican a 44 colores en cada entrada, a combinaciones accent x sidebar extremas y a 44 x 12
configuraciones de `suggestPalette`. Excepcion conocida: bg y surface de polaridad opuesta (p. ej. bg oscuro y surface
blanca) no admiten un unico texto: `validateTheme` lo avisa.

## Decisiones
- **OKLCH**: L es claridad percibida; ajustar L conserva el matiz (HSL no) y permite normalizar claridad/croma entre tonos.
  Mas simple y ligero que HCT (Material 3) o CAM16 con resultados comparables para este uso; se evito traer dependencias.
- **WCAG 2.x como criterio normativo** (4.5 texto, 3 iconos/UI): es el estandar exigible. APCA modela mejor el texto claro
  sobre oscuro pero no es normativo; se expone como dato extra.
- **12 pasos estilo Radix/Leonardo**: no se generan escalas completas; se derivan solo los pasos que usa la UI
  (fondo tenue, borde, solido, texto), calculados contra su fondo.
- Los componentes solo consumen tokens CSS: cambiar una entrada nunca deja un componente sin actualizar.

## Como anadir un token
1. Entrada: campo en `BrandColors`/`calculator` (types.ts, zod del API); derivado: clave en `BrandOverrides` y en
   `BRAND_OVERRIDE_KEYS` (web y API).
2. Declararlo en `TOKEN_GROUPS` (tokens.ts) con `cssVars`, `affects`, `doesNotAffect`, `derivation`.
3. Emitir las variables en `themeToCssVars` (theme.ts) calculandolas por contraste contra su fondo.
4. Si es texto/icono, anadir la pareja a `CONTRAST_PAIRS`.
5. Consumir solo `var(--...)` en los componentes y anadir pruebas.

## Texto sobre rellenos de marca (`onFill`, `FILL_MIN = 3`)

Botones, ítem activo del sidebar y badges sólidos llevan texto corto y semibold. Para esos rellenos el motor
**prefiere blanco** mientras alcance 3:1 (el mínimo de WCAG 2.x para texto grande/negrita y componentes de interfaz,
1.4.3/1.4.11), aunque la tinta oscura tenga más contraste matemático: sobre un naranja o rojo vivo (p. ej. `#FF4A00`,
blanco 3.4:1) el usuario espera letras blancas. Si el blanco no llega (amarillos, verdes claros, ámbar) usa la tinta
`#12213A`. El texto de lectura (párrafos, tablas, etiquetas pequeñas, sidebar inactivo, chip) sigue exigiendo 4.5:1.
Quien necesite AA estricto en un relleno puede fijar `sidebarActiveText` a mano (se corrige solo si baja de 3:1).
