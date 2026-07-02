// ─── Feature Flags Client-Side ────────────────────────────────────────────────
//
// Replica del config/features.ts del backend.
// Se usa para mostrar/ocultar UI elements antes de hacer la llamada al API.
// ──────────────────────────────────────────────────────────────────────────────

export type Plan = "free" | "pro" | "academia";

export type FeatureKey =
  | "unlimited_ingredients"
  | "import_base_ingredients"
  | "unlimited_recipes"
  | "recipe_cost_calculation"
  | "unlimited_menus"
  | "yield_factors"
  | "valuations"
  | "break_even_analysis"
  | "export_data"
  | "advanced_reports"
  | "priority_support"
  | "multi_location"
  | "api_access"
  | "training";

const FEATURE_PLAN_MAP: Record<FeatureKey, Plan> = {
  unlimited_ingredients: "free",
  import_base_ingredients: "free",
  recipe_cost_calculation: "free",
  yield_factors: "free",
  valuations: "free",
  break_even_analysis: "free",
  unlimited_recipes: "free",
  unlimited_menus: "free",
  export_data: "pro",
  advanced_reports: "pro",
  priority_support: "pro",
  multi_location: "academia",
  api_access: "academia",
  training: "academia",
};

const PLAN_ORDER: Record<Plan, number> = {
  free: 0,
  pro: 1,
  academia: 2,
};

export function hasFeature(plan: Plan, feature: FeatureKey): boolean {
  const required = FEATURE_PLAN_MAP[feature];
  return PLAN_ORDER[plan] >= PLAN_ORDER[required];
}

export function getRequiredPlan(feature: FeatureKey): Plan {
  return FEATURE_PLAN_MAP[feature];
}

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  unlimited_ingredients: "Ingredientes ilimitados",
  import_base_ingredients: "Importar banco base",
  unlimited_recipes: "Recetas ilimitadas",
  recipe_cost_calculation: "Cálculo de costo",
  unlimited_menus: "Menús ilimitados",
  yield_factors: "Factor de rendimiento",
  valuations: "Valoración A&B",
  break_even_analysis: "Punto de equilibrio",
  export_data: "Exportar datos",
  advanced_reports: "Reportes avanzados",
  priority_support: "Soporte prioritario",
  multi_location: "Multi-sucursal",
  api_access: "Acceso a API",
  training: "Capacitación",
};

export const PLAN_DETAILS: Record<Plan, {
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  color: string;
  bg: string;
}> = {
  free: {
    name: "Free",
    price: 0,
    priceLabel: "$0",
    description: "Para empezar a costear tus platos",
    color: "var(--text-muted)",
    bg: "var(--bg-secondary)",
  },
  pro: {
    name: "Pro",
    price: 30000,
    priceLabel: "$30.000",
    description: "Para restaurantes que quieren crecer",
    color: "var(--accent-text)",
    bg: "var(--accent-light)",
  },
  academia: {
    name: "Academia",
    price: 50000,
    priceLabel: "$50.000",
    description: "Para escuelas y grupos gastronómicos",
    color: "#92400E",
    bg: "#FEF3C7",
  },
};

export const ALL_FEATURES: FeatureKey[] = [
  "unlimited_ingredients",
  "import_base_ingredients",
  "unlimited_recipes",
  "recipe_cost_calculation",
  "unlimited_menus",
  "yield_factors",
  "valuations",
  "break_even_analysis",
  "export_data",
  "advanced_reports",
  "priority_support",
  "multi_location",
  "api_access",
  "training",
];

export const PLAN_FEATURES: Record<Plan, FeatureKey[]> = {
  free: [
    "unlimited_ingredients",
    "import_base_ingredients",
    "unlimited_recipes",
    "recipe_cost_calculation",
    "unlimited_menus",
    "yield_factors",
    "valuations",
    "break_even_analysis",
  ],
  pro: [
    "unlimited_ingredients",
    "import_base_ingredients",
    "unlimited_recipes",
    "recipe_cost_calculation",
    "unlimited_menus",
    "yield_factors",
    "valuations",
    "break_even_analysis",
    "export_data",
    "advanced_reports",
    "priority_support",
  ],
  academia: ALL_FEATURES,
};
