# Graph Report - cosayb-web  (2026-10-01)

## Corpus Check
- 186 files · ~400,469 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .css 5, (none) 1, .log 1)

## Summary
- 1278 nodes · 3464 edges · 84 communities (67 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `007341bd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- InventarioPage
- (app)/recetas/page.tsx
- devDependencies
- SubscriptionCheckout.tsx
- api/index.ts
- domain.ts
- settings.ts
- machine.ts
- punto-equilibrio/page.tsx
- ValuationCalculator.tsx
- planes/page.tsx
- UpgradeModal.tsx
- services.ts
- next
- fetchAPI
- FactorRendimientoPage
- menu/page.tsx
- CalculatorFlow.tsx
- ValuationViewModal.tsx
- cuenta/page.tsx
- entry.ts
- Modal
- compilerOptions
- precios-mercado/page.tsx
- Button
- lib.ts
- swr
- plataforma/roles/page.tsx
- usuarios/[id]/page.tsx
- usePermissions
- catalog.ts
- plataforma/layout.tsx
- dashboard/page.tsx
- ingredientes/page.tsx
- AppShell.tsx
- data-layout.spec.ts
- banco/recetas/page.tsx
- Input
- CO$AYB — Frontend
- (marketing)/page.tsx
- MembresiasPage
- Nav.tsx
- MenuPage
- onboarding/page.tsx
- RecipeDetailModal.tsx
- capacitacion/page.tsx
- configuracion/roles/page.tsx
- [plan]/page.tsx
- (marketing)/layout.tsx
- formatCOP
- Recipe
- AppContainer.tsx
- RecipeFormModal.tsx
- package.json
- ConsultoriaPage
- Button.tsx
- nosotros/page.tsx
- ImpersonationBanner.tsx
- inventario-form.test.ts
- dependencies
- proxy.ts
- route.ts
- cookies/page.tsx
- libro/page.tsx
- privacy/page.tsx
- terms/page.tsx
- lucide-react
- capacitacion/layout.tsx
- contacto/layout.tsx
- contacto/page.tsx
- register/page.tsx
- scripts
- opencode.json
- postcss.config.mjs
- RecipeFormModal
- Global Constraints
- YieldFactorSearchBar.tsx
- PageHeader
- eslint.config.mjs
- This is NOT the Next.js you know

## God Nodes (most connected - your core abstractions)
1. `fetchAPI()` - 105 edges
2. `Button` - 86 edges
3. `lucide-react` - 86 edges
4. `react` - 83 edges
5. `usePermissions()` - 64 edges
6. `next` - 59 edges
7. `Modal()` - 54 edges
8. `swr` - 40 edges
9. `RecetasPage()` - 30 edges
10. `FactorRendimientoPage()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `Task 4: Componente `BancoRecipeCard`` --references--> `Recipe`  [INFERRED]
  docs/superpowers/plans/2026-06-29-banco-recetas-frontend.md → types/domain.ts
- `Task 5: Agregar tabs + lógica en `recetas/page.tsx`` --references--> `PageHeader()`  [INFERRED]
  docs/superpowers/plans/2026-06-29-banco-recetas-frontend.md → components/ui/PageHeader.tsx
- `Global Constraints` --references--> `fetchAPI()`  [INFERRED]
  docs/superpowers/plans/2026-06-29-banco-recetas-frontend.md → lib/api/index.ts
- `Task 3: Tipos + funciones API cliente` --references--> `importarBancoRecipe()`  [INFERRED]
  docs/superpowers/plans/2026-06-29-banco-recetas-frontend.md → lib/api/index.ts
- `Task 5: Agregar tabs + lógica en `recetas/page.tsx`` --references--> `importarBancoRecipe()`  [INFERRED]
  docs/superpowers/plans/2026-06-29-banco-recetas-frontend.md → lib/api/index.ts

## Import Cycles
- None detected.

## Communities (84 total, 17 thin omitted)

### Community 0 - "InventarioPage"
Cohesion: 0.07
Nodes (40): InventarioPage(), handleDelete(), displayName(), formatCOP(), formatGrams(), formatPerGram(), getPriceStatus(), isOwnIngredient() (+32 more)

### Community 1 - "(app)/recetas/page.tsx"
Cohesion: 0.14
Nodes (13): ActiveChip(), Chip(), EMPTY_EXTRA, FilterGroup(), RecetasPage(), changeSearch(), handleClearSearch(), handleDelete() (+5 more)

### Community 2 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, eslint-config-next, playwright, @playwright/test, tailwindcss, @tailwindcss/postcss, @types/node (+4 more)

### Community 3 - "SubscriptionCheckout.tsx"
Cohesion: 0.15
Nodes (33): BookCheckoutPage(), Inner(), activeGroup(), BookCheckout(), BookReview(), BookSuccess(), GROUPS, EnrollmentFlow() (+25 more)

### Community 4 - "api/index.ts"
Cohesion: 0.07
Nodes (28): AuditoriaPage(), MetricasPage(), ActivityEntry, AssignableRole, AuditLogEntry, BancoRecipePayload, CreateRecipePayload, CustomRole (+20 more)

### Community 5 - "domain.ts"
Cohesion: 0.11
Nodes (18): RecipeCostModalProps, BreakEvenRecord, CostoMenuResult, MenuIndicator, MenuReceta, Organization, PlanFeature, ProfitabilityAnalysis (+10 more)

### Community 6 - "settings.ts"
Cohesion: 0.11
Nodes (28): AcceptInvitationPage(), load(), ROLE_LABELS, EquipoPage(), handleInvite(), handleRemove(), handleRevoke(), handleRoleChange() (+20 more)

### Community 7 - "machine.ts"
Cohesion: 0.15
Nodes (27): sub(), CheckoutAction, CheckoutData, CheckoutKind, checkoutReducer(), CheckoutState, computeSteps(), emptyPayment (+19 more)

### Community 8 - "punto-equilibrio/page.tsx"
Cohesion: 0.15
Nodes (21): DetailView(), handleCalcular(), FixedCostRow(), FixedCostRowProps, formatCOP(), formatDate(), HistorySkeleton(), PageView (+13 more)

### Community 9 - "ValuationCalculator.tsx"
Cohesion: 0.11
Nodes (18): FIELD_META, useCountUp(), formatField(), formatResult(), isTypingTarget(), PERCENT_FIELDS, RECIPE_TRIGGER, ValuationCalculator() (+10 more)

### Community 10 - "planes/page.tsx"
Cohesion: 0.15
Nodes (22): LoginForm(), LoginPage(), ORDER, PlanesPage(), choosePaid(), startFree(), CheckoutGuard(), PlanId (+14 more)

### Community 11 - "UpgradeModal.tsx"
Cohesion: 0.14
Nodes (20): MembresiaPage(), PLAN_CONFIG, AppLayout(), QuotaBanner(), QuotaBannerProps, getNextPlan(), PLAN_ICONS, PLAN_ORDER (+12 more)

### Community 12 - "services.ts"
Cohesion: 0.14
Nodes (23): Form, BookFormat, PaidPlanId, PaymentMethodId, ProgramId, InitOptions, billingFetch(), BookCheckoutInput (+15 more)

### Community 13 - "next"
Cohesion: 0.08
Nodes (5): metadata, metadata, metadata, nextConfig, next

### Community 14 - "fetchAPI"
Cohesion: 0.15
Nodes (20): OrganizacionDetallePage(), changeMembership(), handleStartImpersonation(), toggleStatus(), createIngrediente(), createOrganization(), deleteIngrediente(), fetchAPI() (+12 more)

### Community 15 - "FactorRendimientoPage"
Cohesion: 0.19
Nodes (8): FactorRendimientoPage(), handleDelete(), handleSubmit(), TableSkeleton(), createFactorRendimiento(), deleteFactorRendimiento(), getFactoresRendimiento(), updateFactorRendimiento()

### Community 16 - "menu/page.tsx"
Cohesion: 0.09
Nodes (29): calcularCosto(), CostoPanel(), DetailView(), addLineItem(), handleSave(), fmt(), fmtDate(), getStoredPctMP() (+21 more)

### Community 17 - "CalculatorFlow.tsx"
Cohesion: 0.15
Nodes (12): CalculatorFlow(), CalculatorPrefill, CalculatorMode, EMPTY_SAVE, MODE_META, saveFormFromValuation(), ModeSwitcher(), Tab (+4 more)

### Community 18 - "ValuationViewModal.tsx"
Cohesion: 0.22
Nodes (18): HistorySkeleton(), HistoryView(), fmt(), fmtPct(), IND, moneyFromPct(), PricingResult, refLabel() (+10 more)

### Community 19 - "cuenta/page.tsx"
Cohesion: 0.13
Nodes (19): CuentaPage(), DeleteAccountSection(), OrganizacionTab(), parseUserAgent(), PasswordCard(), PerfilTab(), handleSave(), ROLE_LABELS (+11 more)

### Community 20 - "entry.ts"
Cohesion: 0.20
Nodes (14): Action, reducer(), RegistersState, applyEntryKey(), digitCount(), EntryKey, EntryOptions, formatMoneyEntry() (+6 more)

### Community 21 - "Modal"
Cohesion: 0.18
Nodes (18): YieldFactorDeleteModal(), YieldFactorDeleteModalProps, formatCOP(), formatDate(), YieldFactorDetailModal(), YieldFactorDetailModalProps, calcPreview(), formatCOP() (+10 more)

### Community 22 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 23 - "precios-mercado/page.tsx"
Cohesion: 0.08
Nodes (34): CITY_LABEL, formatCOP(), formatDate(), PreciosMercadoPage(), goToPage(), PreciosPagination(), PriceCard(), PriceCardSkeleton() (+26 more)

### Community 24 - "Button"
Cohesion: 0.47
Nodes (4): AppError(), AccessDenied(), AccessDeniedProps, Button

### Community 25 - "lib.ts"
Cohesion: 0.12
Nodes (28): calcPricing(), describeMissing(), getStored(), joinMissing(), missingInputs(), MODE_ORDER, ModeMeta, nextMode() (+20 more)

### Community 26 - "swr"
Cohesion: 0.16
Nodes (13): barlowCondensed, cormorantGaramond, inter, jetbrainsMono, manrope, metadata, RootLayout(), BASE_CONFIG (+5 more)

### Community 27 - "plataforma/roles/page.tsx"
Cohesion: 0.19
Nodes (13): ROLE_DISPLAY, RolesPage(), handleCreateRole(), handleDeleteOrgRole(), resetCreateForm(), save(), SCOPE_LABEL, platformCreateSystemRole() (+5 more)

### Community 28 - "usuarios/[id]/page.tsx"
Cohesion: 0.20
Nodes (13): AddOrgMembership(), add(), ORG_ROLES, OrgRoleCard(), save(), PLATFORM_ROLES, UsuarioDetallePage(), savePlatformRoles() (+5 more)

### Community 29 - "usePermissions"
Cohesion: 0.13
Nodes (23): ACTION_LABELS, ActividadPage(), labelFor(), module_(), OrganizacionesPage(), TIER_STYLE, UsuariosPage(), NAV_GROUPS (+15 more)

### Community 30 - "catalog.ts"
Cohesion: 0.22
Nodes (12): CourseEnrollmentPage(), PaymentDetails(), DemoNotice(), SelectField(), COURSE_PROGRAM, DOCUMENT_TYPES, PAYMENT_METHODS, PlanEntry (+4 more)

### Community 31 - "plataforma/layout.tsx"
Cohesion: 0.17
Nodes (8): links, ConsoleSection, firstSectionFor(), PlataformaLayout(), SECTIONS, SessionGuard(), authClient, better-auth

### Community 32 - "dashboard/page.tsx"
Cohesion: 0.20
Nodes (11): ALL_CARDS, buildInsight(), DashboardPage(), fmtCOP(), getTimeGreeting(), InsightContent, ModuleCard(), ModuleCardDef (+3 more)

### Community 33 - "ingredientes/page.tsx"
Cohesion: 0.18
Nodes (11): BancoIngredientCard(), BancoIngredientesPage(), handleDelete(), handleSave(), Pagination(), PaginationProps, bancoCreateIngredient(), bancoDeleteIngredient() (+3 more)

### Community 34 - "AppShell.tsx"
Cohesion: 0.22
Nodes (14): CuentaTab(), handleSignOut(), handleSwitchOrg(), AppContainer(), AppShell(), handleSignOut(), SidebarProps, Topbar() (+6 more)

### Community 35 - "data-layout.spec.ts"
Cohesion: 0.07
Nodes (23): STATE_PATH, @playwright/test, statePath, BREAK_EVEN, CORS_HEADERS, CTX, expectNoOverflow(), FACTORS (+15 more)

### Community 36 - "banco/recetas/page.tsx"
Cohesion: 0.19
Nodes (11): BANCO_SOURCE, BancoRecetasPage(), handleDelete(), BancoRecipeCard(), TYPE_TABS, bancoCreateRecipe(), bancoDeleteRecipe(), bancoGetRecipe() (+3 more)

### Community 37 - "Input"
Cohesion: 0.26
Nodes (8): MarcaPage(), confirmSave(), SavePanel(), handleSave(), Input, InputProps, createValuation(), updateOrganization()

### Community 38 - "CO$AYB — Frontend"
Cohesion: 0.09
Nodes (21): CO$AYB — Frontend, Componentes UI, Deploy, Design system, Estructura del proyecto, Flujo de autenticación, Inicio rápido, Inventario (`/inventario`) (+13 more)

### Community 39 - "(marketing)/page.tsx"
Cohesion: 0.18
Nodes (10): FaqItem(), faqs, features, heroStats, LandingPage(), modules, plans, rows (+2 more)

### Community 40 - "MembresiasPage"
Cohesion: 0.30
Nodes (11): MembresiasPage(), changeLimit(), changeLockedMessage(), changeRoleMaxUsers(), toggleFeature(), toggleRole(), TIER_STYLE, platformListMemberships() (+3 more)

### Community 41 - "Nav.tsx"
Cohesion: 0.20
Nodes (9): Nav(), isActive(), isGroupActive(), NavChild, NavGroup, navGroups, NavLink, navLinks (+1 more)

### Community 42 - "MenuPage"
Cohesion: 0.22
Nodes (8): MenuListSkeleton(), MenuPage(), handleDelete(), openEdit(), deleteMenu(), getIngredientes(), getMenuById(), getMenus()

### Community 43 - "onboarding/page.tsx"
Cohesion: 0.25
Nodes (8): BUSINESS_TYPES, OnboardingPage(), check(), handleFinish(), PlanCard(), setOnboardingCookie(), Step, StepDot()

### Community 44 - "RecipeDetailModal.tsx"
Cohesion: 0.26
Nodes (11): COP, CostCard(), DetailField(), MetricCard(), RatingBadge(), RecipeDetailModal(), handleImport(), LoadingSpinner() (+3 more)

### Community 45 - "capacitacion/page.tsx"
Cohesion: 0.22
Nodes (8): CapacitacionPage(), goToEnrollment(), handleSelectPrograma(), inversionPorPrograma, PROGRAM_SLUG, programaOptions, programas, tracks

### Community 46 - "configuracion/roles/page.tsx"
Cohesion: 0.27
Nodes (10): RolesPage(), handleDelete(), handleSave(), openEdit(), createCustomRole(), CUSTOM_ROLE_MODULES, deleteCustomRole(), getCustomRoleDetail() (+2 more)

### Community 47 - "[plan]/page.tsx"
Cohesion: 0.42
Nodes (8): AlreadyOnPlan(), CheckoutResolver(), InfoShell(), InvalidPlan(), Loading(), PAID, SubscriptionCheckoutPage(), PLAN_CATALOG

### Community 48 - "(marketing)/layout.tsx"
Cohesion: 0.33
Nodes (6): MarketingLayout(), metadata, TransitionWrapper(), Footer(), footerSections, socialLinks

### Community 49 - "formatCOP"
Cohesion: 0.36
Nodes (7): OrderPage(), Row(), Row(), SubscriptionPage(), BOOK, formatCOP(), billingQueries

### Community 50 - "Recipe"
Cohesion: 0.23
Nodes (10): BancoDetailModalProps, BancoRecipeCard(), BancoRecipeCardProps, Stat(), RecipeCard, RecipeCardProps, Stat(), RecipeDetailModalProps (+2 more)

### Community 51 - "AppContainer.tsx"
Cohesion: 0.29
Nodes (4): AppContainerProps, AppContainerVariant, variantClasses, cn()

### Community 52 - "RecipeFormModal.tsx"
Cohesion: 0.11
Nodes (19): COP, HeaderForm, ItemDraft, ItemRow(), ItemRowProps, RecipeFormDataSource, RecipeFormModalProps, RecipePayload (+11 more)

### Community 53 - "package.json"
Cohesion: 0.18
Nodes (10): name, private, version, playwright, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+2 more)

### Community 55 - "Button.tsx"
Cohesion: 0.27
Nodes (8): COP, fmt(), RatingBadge(), RecipeCostModal(), SummaryCard(), ButtonProps, ButtonSize, ButtonVariant

### Community 56 - "nosotros/page.tsx"
Cohesion: 0.29
Nodes (5): equipo, features, metadata, principios, stats

### Community 57 - "ImpersonationBanner.tsx"
Cohesion: 0.52
Nodes (6): formatRemaining(), ImpersonationBanner(), handleElevate(), handleEnd(), elevateImpersonation(), endImpersonation()

### Community 59 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, better-auth, clsx, lucide-react, next, react, react-dom, swr

### Community 60 - "proxy.ts"
Cohesion: 0.33
Nodes (4): config, PROTECTED_PREFIXES, PUBLIC_ROUTES, SESSION_COOKIE_NAMES

### Community 62 - "route.ts"
Cohesion: 0.83
Nodes (3): GET(), POST(), proxyToBackend()

### Community 67 - "lucide-react"
Cohesion: 0.12
Nodes (16): articles, areasInteres, slides, IngredientFormModal(), IngredientSearchBar(), IngredientSearchBarProps, CommunityPrice, fetchJson() (+8 more)

### Community 72 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, start, test, test:e2e, test:e2e:auth

### Community 77 - "RecipeFormModal"
Cohesion: 0.33
Nodes (4): emptyItem(), RecipeFormModal(), addItem(), SummaryItem()

### Community 78 - "Global Constraints"
Cohesion: 0.33
Nodes (6): Banco de Recetas — Frontend Plan, Global Constraints, Task 3: Tipos + funciones API cliente, Task 4: Componente `BancoRecipeCard`, Task 5: Agregar tabs + lógica en `recetas/page.tsx`, getBancoRecipes()

### Community 79 - "YieldFactorSearchBar.tsx"
Cohesion: 0.33
Nodes (4): FILTER_OPTIONS, YieldFactorFilter, YieldFactorSearchBar(), YieldFactorSearchBarProps

### Community 80 - "PageHeader"
Cohesion: 0.60
Nodes (3): ConfiguracionLayout(), PageHeader(), PageHeaderProps

### Community 81 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

## Knowledge Gaps
- **303 isolated node(s):** `$schema`, `plugin`, `ACTION_LABELS`, `ROLE_COLORS`, `PLAN_CONFIG` (+298 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 446 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lucide-react` connect `lucide-react` to `InventarioPage`, `(app)/recetas/page.tsx`, `SubscriptionCheckout.tsx`, `api/index.ts`, `settings.ts`, `punto-equilibrio/page.tsx`, `ValuationCalculator.tsx`, `planes/page.tsx`, `UpgradeModal.tsx`, `fetchAPI`, `menu/page.tsx`, `CalculatorFlow.tsx`, `ValuationViewModal.tsx`, `cuenta/page.tsx`, `entry.ts`, `Modal`, `precios-mercado/page.tsx`, `Button`, `plataforma/roles/page.tsx`, `usuarios/[id]/page.tsx`, `usePermissions`, `catalog.ts`, `plataforma/layout.tsx`, `dashboard/page.tsx`, `ingredientes/page.tsx`, `AppShell.tsx`, `banco/recetas/page.tsx`, `Input`, `(marketing)/page.tsx`, `Nav.tsx`, `RecipeDetailModal.tsx`, `capacitacion/page.tsx`, `configuracion/roles/page.tsx`, `[plan]/page.tsx`, `(marketing)/layout.tsx`, `formatCOP`, `Recipe`, `RecipeFormModal.tsx`, `package.json`, `Button.tsx`, `nosotros/page.tsx`, `ImpersonationBanner.tsx`, `cookies/page.tsx`, `libro/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`, `contacto/page.tsx`, `YieldFactorSearchBar.tsx`, `PageHeader`?**
  _High betweenness centrality (0.182) - this node is a cross-community bridge._
- **Why does `react` connect `lucide-react` to `InventarioPage`, `(app)/recetas/page.tsx`, `SubscriptionCheckout.tsx`, `settings.ts`, `machine.ts`, `punto-equilibrio/page.tsx`, `ValuationCalculator.tsx`, `planes/page.tsx`, `UpgradeModal.tsx`, `next`, `fetchAPI`, `menu/page.tsx`, `CalculatorFlow.tsx`, `ValuationViewModal.tsx`, `cuenta/page.tsx`, `entry.ts`, `Modal`, `precios-mercado/page.tsx`, `Button`, `lib.ts`, `swr`, `plataforma/roles/page.tsx`, `usuarios/[id]/page.tsx`, `usePermissions`, `plataforma/layout.tsx`, `dashboard/page.tsx`, `ingredientes/page.tsx`, `AppShell.tsx`, `banco/recetas/page.tsx`, `Input`, `(marketing)/page.tsx`, `MembresiasPage`, `Nav.tsx`, `onboarding/page.tsx`, `RecipeDetailModal.tsx`, `capacitacion/page.tsx`, `configuracion/roles/page.tsx`, `[plan]/page.tsx`, `Recipe`, `RecipeFormModal.tsx`, `package.json`, `Button.tsx`, `ImpersonationBanner.tsx`, `register/page.tsx`, `YieldFactorSearchBar.tsx`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `SubscriptionCheckout.tsx`, `settings.ts`, `punto-equilibrio/page.tsx`, `planes/page.tsx`, `UpgradeModal.tsx`, `fetchAPI`, `cuenta/page.tsx`, `precios-mercado/page.tsx`, `Button`, `swr`, `usuarios/[id]/page.tsx`, `usePermissions`, `catalog.ts`, `plataforma/layout.tsx`, `dashboard/page.tsx`, `AppShell.tsx`, `(marketing)/page.tsx`, `Nav.tsx`, `onboarding/page.tsx`, `capacitacion/page.tsx`, `configuracion/roles/page.tsx`, `[plan]/page.tsx`, `(marketing)/layout.tsx`, `formatCOP`, `package.json`, `nosotros/page.tsx`, `proxy.ts`, `route.ts`, `cookies/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`, `capacitacion/layout.tsx`, `contacto/layout.tsx`, `contacto/page.tsx`, `register/page.tsx`, `PageHeader`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `usePermissions()` (e.g. with `can()` and `featureLimit()`) actually correct?**
  _`usePermissions()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `plugin`, `ACTION_LABELS` to the rest of the system?**
  _303 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `InventarioPage` be split into smaller, more focused modules?**
  _Cohesion score 0.07259528130671507 - nodes in this community are weakly interconnected._
- **Should `(app)/recetas/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._