# CO$AYB — Frontend

Software de costos de alimentos y bebidas para restaurantes colombianos.

## Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + Tailwind CSS v4
- **Auth:** Better Auth (React client)
- **Icons:** Lucide React
- **Tipos:** TypeScript estricto

## Requisitos

- Node.js >= 18
- pnpm >= 11
- Backend corriendo en `http://localhost:3005`

## Inicio rápido

```bash
# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env   # y llenar los valores

# Empieza el servidor de desarrollo
pnpm dev
```

El frontend arranca en `http://localhost:3002`.

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend API | `http://localhost:3005` |
| `NEXT_PUBLIC_FRONTEND_URL` | URL del frontend | `http://localhost:3002` |

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo en puerto 3002 |
| `pnpm build` | Compila para producción |
| `pnpm start` | Ejecuta la versión compilada |
| `pnpm lint` | Linting con ESLint |

## Estructura del proyecto

```
cosayb-web/
├── app/
│   ├── layout.tsx                  # Root layout (fonts, metadata)
│   ├── globals.css                 # Design system CSS variables
│   ├── sitemap.ts                  # Sitemap XML
│   ├── robots.ts                   # Robots.txt
│   ├── api/
│   │   └── auth/[...all]/route.ts  # Proxy de auth al backend
│   ├── (marketing)/
│   │   ├── layout.tsx              # Layout landing (Nav + Footer)
│   │   └── page.tsx                # Landing page
│   ├── (app)/
│   │   ├── layout.tsx              # Layout app (AppShell)
│   │   ├── inventario/page.tsx     # CRUD de ingredientes
│   │   ├── recetas/page.tsx        # Fichas técnicas (TODO)
│   │   ├── menu/page.tsx           # Menús (TODO)
│   │   ├── punto-equilibrio/page.tsx  # Punto de equilibrio (TODO)
│   │   ├── valoracion/page.tsx     # Valoración A&B (TODO)
│   │   └── factor-rendimiento/page.tsx  # Factor de rendimiento (TODO)
│   ├── login/page.tsx              # Login (email + Google)
│   └── onboarding/page.tsx         # Wizard de 3 pasos
├── components/
│   ├── ui/                         # Componentes genéricos
│   │   ├── Button.tsx              # Variantes: primary, ghost, danger
│   │   ├── Modal.tsx               # Diálogo overlay
│   │   ├── Input.tsx               # Input con label/error
│   │   ├── Badge.tsx               # Etiquetas de estado
│   │   ├── Card.tsx                # Tarjetas
│   │   ├── Table.tsx               # Tabla con columnas
│   │   ├── PageHeader.tsx          # Título + subtítulo + acción
│   │   ├── EmptyState.tsx          # Estado vacío
│   │   ├── LoadingSpinner.tsx      # Spinner de carga
│   │   └── Toast.tsx               # Notificaciones
│   ├── app/                        # Componentes de la app
│   │   ├── AppShell.tsx            # Shell: Sidebar + Topbar + contenido
│   │   ├── Sidebar.tsx             # Navegación lateral
│   │   ├── Topbar.tsx              # Barra superior
│   │   ├── PlanBadge.tsx           # Badge de plan (Free/Pro/Academia)
│   │   ├── UpgradePrompt.tsx       # Banner de upgrade
│   │   └── inventario/             # Componentes del módulo inventario
│   │       ├── IngredientCard.tsx
│   │       ├── IngredientFilters.tsx
│   │       ├── IngredientGrid.tsx
│   │       ├── IngredientSearchBar.tsx
│   │       ├── Pagination.tsx
│   │       └── QuotaBanner.tsx
│   └── landing/                    # Componentes de la landing
│       ├── Nav.tsx
│       ├── Hero.tsx
│       ├── Problema.tsx
│       ├── ComoFunciona.tsx
│       ├── Modulos.tsx
│       ├── AppMockup.tsx
│       ├── Pricing.tsx
│       ├── Testimonios.tsx
│       ├── CTAFinal.tsx
│       └── Footer.tsx
├── lib/
│   ├── auth.ts                     # Cliente Better Auth
│   ├── api.ts                      # Fetcher genérico + funciones CRUD
│   └── utils.ts                    # cn(), formatCOP(), formatDate()
├── types/
│   ├── api.ts                      # ApiResponse, PaginatedResponse
│   ├── auth.ts                     # Session
│   ├── domain.ts                   # Tipos de dominio (Plan, Receta, Menu, etc.)
│   └── ingredient.ts              # Ingredient, IngredientForm
└── proxy.ts                        # Route guard (reemplaza middleware.ts)
```

## Rutas públicas vs protegidas

El archivo `proxy.ts` controla el acceso:

| Ruta | Acceso |
|---|---|
| `/` | Pública (landing) |
| `/login` | Pública |
| `/register` | Pública |
| `/onboarding` | Requiere sesión |
| `/inventario` | Requiere sesión + onboarding |
| `/recetas` | Requiere sesión + onboarding |
| `/api/auth/*` | Siempre permitido (proxy al backend) |

### Flujo de autenticación

```
Usuario entra a /app
    ↓
proxy.ts verifica cookie "better-auth.session_token"
    ↓
Sin sesión → redirect a /login
Con sesión + sin cookie "cosayb.onboarding" → redirect a /onboarding
Con sesión + onboarding completado → permite acceso
```

## Páginas

### Landing (`/`)
Marketing con hero, problema, módulos, pricing, testimonios y CTA. Incluye JSON-LD para SEO.

### Login (`/login`)
- Email + contraseña
- Google OAuth
- Redirect automático si ya tiene sesión

### Onboarding (`/onboarding`)
Wizard de 3 pasos:
1. Nombre del negocio
2. Tipo de negocio
3. Selección de plan

Al completar, setea cookie `cosayb.onboarding=true` y redirige a `/inventario`.

### Inventario (`/inventario`)
- CRUD completo de ingredientes
- Búsqueda en tiempo real
- Filtros: Todos / Propios / Banco base
- Paginación
- Barra de cuota (30 ingredientes en Free)
- Importar banco base con 1 click

### Módulos pendientes (TODO)
- **Recetas:** Fichas técnicas con ingredientes y porciones
- **Menú:** Menús con recetas asociadas
- **Punto de equilibrio:** Análisis de costos fijos vs variables
- **Valoración A&B:** Valoración de alimentos y bebidas
- **Factor de rendimiento:** Control de mermas

## Componentes UI

Todos los componentes están en `components/ui/` y son reutilizables:

```tsx
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Input from "@/components/ui/Input"

// Uso
<Button variant="primary" size="md" onClick={handleClick}>
  Guardar
</Button>

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nuevo ingrediente">
  <Input label="Nombre" error={errors.name} />
</Modal>
```

### Variantes de Button

| Variante | Uso |
|---|---|
| `primary` | Acciones principales |
| `ghost` | Acciones secundarias |
| `danger` | Eliminar, acciones destructivas |

## Design system

El CSS usa variables personalizadas definidas en `globals.css`:

```css
--bg-primary      /* Fondo principal */
--bg-secondary    /* Fondo secundario */
--bg-card         /* Fondo de tarjetas */
--accent          /* Color accent */
--text-primary    /* Texto principal */
--text-secondary  /* Texto secundario */
--text-muted      /* Texto deshabilitado */
--border          /* Bordes */
--radius          /* Border radius */
```

## Deploy

### Vercel

1. Crear proyecto en Vercel
2. Conectar repositorio
3. Configurar variables de entorno:
   - `NEXT_PUBLIC_API_URL` = URL del backend en Render
   - `NEXT_PUBLIC_FRONTEND_URL` = URL de Vercel
4. Deploy automático

### Notas para producción

- Cambiar `NEXT_PUBLIC_API_URL` a la URL del backend en Render
- Cambiar `NEXT_PUBLIC_FRONTEND_URL` al dominio de Vercel
- El backend debe tener `FRONTEND_URL` apuntando al dominio de Vercel (para CORS)
- En `app/layout.tsx`, la metadata usa `NEXT_PUBLIC_FRONTEND_URL` para URLs canónicas y OG tags
