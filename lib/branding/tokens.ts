/**
 * CATÁLOGO DE TOKENS DE MARCA — fuente única de verdad del alcance de cada color.
 *
 * Modelo en 3 capas (como los sistemas de Design Tokens / Semantic Color):
 *   1. ENTRADAS  (BrandTheme.colors + calculator): lo que el negocio elige. Pocas.
 *   2. DERIVADOS (BrandOverrides): lo que el motor calcula solo, y el usuario puede
 *      fijar a mano en "Avanzado". Nunca se piden por defecto.
 *   3. TOKENS CSS (--xxx): lo que consumen los componentes. Un componente NUNCA lee
 *      una entrada directamente ni usa un hex: solo tokens CSS.
 *
 * Regla de oro: cada token "on-*" / de texto se calcula contra el fondo sobre el
 * que se pinta (contraste WCAG ≥ 4.5:1 para texto, ≥ 3:1 para iconos/UI grande).
 * Cambiar una entrada NO puede dejar texto ilegible en ningún componente.
 */
import type { BrandColors, BrandOverrides } from "./types"

export type TokenSource = "input" | "derived"

export interface TokenSpec {
  /** Clave en BrandColors / BrandTheme (entradas) o BrandOverrides (derivados) */
  key: string
  source: TokenSource
  /** Variables CSS que produce */
  cssVars: string[]
  /** Etiqueta para el editor (español, sin jerga) */
  label: string
  /** Qué elementos de la plataforma modifica EXACTAMENTE (se muestra en el editor) */
  affects: string[]
  /** Qué NO modifica (evita confusiones) */
  doesNotAffect?: string[]
  /** Cómo se calcula si el usuario no lo fija */
  derivation?: string
}

export interface TokenGroup {
  id: "brand" | "sidebar" | "header" | "surfaces" | "text" | "states" | "calculator"
  title: string
  description: string
  tokens: TokenSpec[]
}

export const TOKEN_GROUPS: TokenGroup[] = [
  {
    id: "brand",
    title: "Marca",
    description: "Los colores que identifican a tu negocio en botones, enlaces y estados activos.",
    tokens: [
      {
        key: "primary",
        source: "input",
        cssVars: ["--brand-primary"],
        label: "Color principal",
        affects: [
          "Identidad general: base de la paleta sugerida",
          "Ilustraciones de los módulos (trazo principal)",
          "Color base de la calculadora si no defines uno",
        ],
        doesNotAffect: ["Fondo del sidebar", "Textos"],
      },
      {
        key: "accent",
        source: "input",
        cssVars: ["--accent", "--accent-hover", "--accent-light", "--accent-text", "--on-accent", "--focus-ring"],
        label: "Color de acción",
        affects: [
          "Botones primarios",
          "Enlaces",
          "Foco de teclado",
          "Ítem activo del menú (fondo)",
          "Pestañas, chips y toggles seleccionados",
          "Barras de progreso",
        ],
        derivation:
          "hover = oscurecer L; light = fondo tenue (L≈0.95); text = variante con contraste ≥4.5 sobre light; on-accent = blanco/oscuro por contraste",
      },
      {
        key: "secondary",
        source: "input",
        cssVars: ["--brand-secondary", "--secondary-light", "--on-secondary"],
        label: "Color secundario",
        affects: ["Etiquetas y badges informativos", "Series secundarias en gráficos", "Ilustraciones (trazo secundario)"],
        doesNotAffect: ["Botones", "Sidebar"],
        derivation: "sugerido por armonía OKLCH (análogo/complementario del principal, croma contenido)",
      },
    ],
  },
  {
    id: "sidebar",
    title: "Barra lateral",
    description: "Todo el contenido del sidebar se adapta solo al fondo elegido.",
    tokens: [
      {
        key: "sidebarBg",
        source: "input",
        cssVars: ["--sidebar-bg"],
        label: "Fondo de la barra lateral",
        affects: ["Fondo del sidebar (y de su cabecera con logo)"],
        doesNotAffect: ["Fondo de la app", "Encabezado superior"],
      },
      {
        key: "sidebarText",
        source: "derived",
        cssVars: ["--sidebar-text", "--sidebar-muted", "--sidebar-label", "--sidebar-hairline", "--sidebar-hover-bg"],
        label: "Texto e iconos del sidebar",
        affects: ["Etiquetas, iconos y títulos de grupo del sidebar", "Divisores y hover"],
        derivation: "claro u oscuro según contraste con sidebarBg; muted/label = mezcla con el fondo garantizando ≥4.5 / ≥3",
      },
      {
        key: "sidebarActiveBg",
        source: "derived",
        cssVars: ["--sidebar-active-bg"],
        label: "Ítem activo del sidebar (fondo)",
        affects: ["Fondo del ítem seleccionado del menú lateral"],
        derivation:
          "accent; si el accent no contrasta ≥3:1 con sidebarBg se ajusta su luminosidad o se usa un tono claro del sidebar",
      },
      {
        key: "sidebarActiveText",
        source: "derived",
        cssVars: ["--sidebar-active-text"],
        label: "Ítem activo del sidebar (texto/icono)",
        affects: ["Texto e icono del ítem seleccionado"],
        derivation: "on-color de sidebarActiveBg (≥4.5:1)",
      },
    ],
  },
  {
    id: "header",
    title: "Encabezado",
    description: "Barra superior con el nombre del negocio y el plan.",
    tokens: [
      {
        key: "headerBg",
        source: "derived",
        cssVars: ["--header-bg", "--header-border"],
        label: "Fondo del encabezado",
        affects: ["Fondo de la barra superior"],
        derivation: "surface por defecto",
      },
      {
        key: "headerText",
        source: "derived",
        cssVars: ["--header-text", "--chip-bg", "--chip-text", "--chip-border"],
        label: "Texto del encabezado y chip del negocio",
        affects: ["Nombre del negocio", "Badge/chip del plan y del negocio", "Iconos del encabezado"],
        derivation: "on-color de headerBg; el chip usa accent-light/accent-text o un neutro con contraste ≥4.5",
      },
    ],
  },
  {
    id: "surfaces",
    title: "Fondos y superficies",
    description: "Lienzo de la app y contenedores.",
    tokens: [
      {
        key: "bg",
        source: "input",
        cssVars: ["--bg-primary", "--bg-secondary"],
        label: "Fondo de la app",
        affects: ["Lienzo detrás de las tarjetas", "Zonas secundarias (tablas, filas alternas)"],
        doesNotAffect: ["Tarjetas", "Sidebar"],
      },
      {
        key: "surface",
        source: "input",
        cssVars: ["--bg-surface", "--on-surface"],
        label: "Tarjetas y paneles",
        affects: ["Tarjetas", "Modales", "Menús desplegables", "Inputs"],
        doesNotAffect: ["Fondo de la app"],
      },
      {
        key: "border",
        source: "derived",
        cssVars: ["--border-light", "--border-medium"],
        label: "Bordes",
        affects: ["Bordes de tarjetas, inputs y tablas", "Divisores"],
        derivation: "mezcla de text sobre surface (≈10% / 20%)",
      },
    ],
  },
  {
    id: "text",
    title: "Texto",
    description: "Se calcula contra las superficies; solo ajústalo si lo necesitas.",
    tokens: [
      {
        key: "text",
        source: "input",
        cssVars: ["--text-primary"],
        label: "Texto principal",
        affects: ["Títulos y cuerpo de texto sobre el fondo de la app, tarjetas y modales"],
        doesNotAffect: ["Texto del sidebar", "Texto sobre botones o badges de color"],
        derivation: "si no contrasta ≥4.5:1 con surface y bg se corrige automáticamente",
      },
      {
        key: "textSecondary",
        source: "derived",
        cssVars: ["--text-secondary", "--text-muted"],
        label: "Texto secundario",
        affects: ["Subtítulos, ayudas, placeholders, metadatos"],
        derivation: "mezcla de text hacia surface garantizando ≥4.5",
      },
    ],
  },
  {
    id: "states",
    title: "Estados",
    description: "Éxito, advertencia, error e información. Cada uno genera fondo, borde y texto legibles.",
    tokens: [
      {
        key: "success",
        source: "input",
        cssVars: ["--success", "--success-bg", "--success-bg-strong", "--success-text", "--success-border"],
        label: "Éxito",
        affects: ["Badges y banners de éxito", "Indicadores positivos"],
      },
      {
        key: "warning",
        source: "input",
        cssVars: ["--warning", "--warning-bg", "--warning-bg-strong", "--warning-text", "--warning-border", "--warning-solid"],
        label: "Advertencia",
        affects: ["Banners y badges de advertencia"],
      },
      {
        key: "error",
        source: "input",
        cssVars: ["--error", "--error-bg", "--error-text", "--error-border", "--error-hover"],
        label: "Error",
        affects: ["Mensajes de error", "Botones destructivos", "Campos inválidos"],
      },
      {
        key: "info",
        source: "input",
        cssVars: ["--info", "--info-bg", "--info-text", "--info-border"],
        label: "Información",
        affects: ["Banners y badges informativos"],
      },
    ],
  },
  {
    id: "calculator",
    title: "Calculadora",
    description: "Una sola elección; el resto de la calculadora se arma solo.",
    tokens: [
      {
        key: "calculator",
        source: "input",
        cssVars: [
          "--calc-body",
          "--calc-body-2",
          "--calc-key",
          "--calc-key-text",
          "--calc-key-op",
          "--calc-key-op-text",
          "--calc-key-equals",
          "--calc-key-equals-text",
          "--calc-display-bg",
          "--calc-display-text",
          "--calc-accent",
          "--calc-ring",
        ],
        label: "Color de la calculadora",
        affects: [
          "Carcasa",
          "Teclas numéricas, de operación y de igual",
          "Pantalla y textos de teclas",
          "Indicadores y anillos de foco de la calculadora",
        ],
        doesNotAffect: ["Resto de la plataforma"],
        derivation:
          "por defecto = primary. Se normaliza croma/luminosidad en OKLCH para conservar identidad funcional y legibilidad con cualquier tono; cada tecla y la pantalla calculan su texto por contraste",
      },
    ],
  },
]

/** Claves de entrada que el editor muestra siempre. */
export const INPUT_KEYS = TOKEN_GROUPS.flatMap((g) => g.tokens.filter((t) => t.source === "input").map((t) => t.key))
/** Claves derivadas que el usuario puede fijar a mano en "Avanzado". */
export const DERIVED_KEYS = TOKEN_GROUPS.flatMap((g) => g.tokens.filter((t) => t.source === "derived").map((t) => t.key))

/** Todas las variables CSS que el tema de marca debe definir SIEMPRE (el motor las emite todas). */
export const REQUIRED_CSS_VARS: string[] = Array.from(
  new Set(TOKEN_GROUPS.flatMap((g) => g.tokens.flatMap((t) => t.cssVars))),
)

// Comprobación de tipos: las entradas existen en BrandColors/BrandTheme y los derivados en BrandOverrides.
export type InputKey = keyof BrandColors | "calculator"
export type DerivedKey = keyof BrandOverrides
