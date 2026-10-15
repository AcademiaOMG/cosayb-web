# Backlog SaaS — frontend (cosayb-web)undefineddone ||||||||

Objetivo: dejar la web como producto SaaS comercial completo; solo falta conectar la pasarela real.
Rama: `feat/saas-web`. Estado: `todo` · `doing` · `done` · `partial` (hecho en web, depende del API) · `blocked` (requiere decisión o servicio externo).

## Convenciones y decisiones

- **Frontera mock/real**: `lib/saas/services.ts` es el único punto. `NEXT_PUBLIC_SAAS_MODE=mock|real` (por defecto `mock`).
  `mock` guarda en `localStorage`; `real` llama al API (`/api/v1/...`) según `SAAS_API_CONTRATO.md`. El checkout existente (`lib/commerce/services.ts`) ya habla con el API (el pago simulado vive en el backend).
- **Autenticación**: sigue siendo Better Auth detrás del proxy `/api/auth`. Email+contraseña, verificación, recuperación, cambio de correo/contraseña y sesiones usan el cliente de Better Auth (`authClient`); requieren que el API tenga `emailAndPassword` habilitado. Google se mantiene.
- **Decisiones de negocio (defaults)**: moneda COP; prueba 14 días; cancelar = efectivo al final del periodo; reembolso 7 días desde el primer cobro; `past_due` con 7 días de gracia antes de bajar a Free; roles de equipo = los existentes (owner/manager/chef/analista/viewer); cookies: banner con "necesarias" / "analítica" (sin analítica activa por defecto).
- No se rediseña lo existente: se reutilizan `components/ui/*` y tokens de `docs/design-system.md`.

## P0 — Cuentas y confianza (bloquean venta)

| ID | Brecha | Estado |
|---|---|---|
| A1 | Login con correo y contraseña (además de Google) | done |
| A2 | Registro con nombre, correo, contraseña, aceptación de términos | done |
| A3 | Verificación de correo (pantalla + reenvío + aviso en la app) | done |
| A4 | Olvidé mi contraseña / restablecer contraseña | done |
| A5 | Cambiar contraseña y cambiar correo (Mi cuenta > Seguridad) | done |
| A6 | Sesiones activas (listar, cerrar una, cerrar otras) | done |
| L1 | Política de reembolso (`/refunds`) y revisión de términos/privacidad/cookies | done |
| L2 | Banner de cookies con preferencias persistentes | done |
| L3 | Rutas públicas nuevas en `proxy.ts`, sitemap y footer | done |

## P1 — Facturación y ciclo de vida de suscripción

| ID | Brecha | Estado |
|---|---|---|
| B1 | Capa `lib/saas` (tipos, servicios mock/real, tests) | done |
| B2 | Facturación en Configuración: plan actual, próximo cobro, estado | done |
| B3 | Upgrade/downgrade con resumen de prorrateo | done |
| B4 | Cancelar suscripción (efectiva al final del periodo) y reactivar | done |
| B5 | Método de pago simulado (ver, cambiar tarjeta) | done |
| B6 | Historial de facturas y recibo imprimible/descargable | done |
| B7 | Estado `past_due`: banner global, aviso en facturación, reintento de pago | done |
| B8 | Comparativa de planes en `/planes` (tabla de funciones) y FAQ de precios | done |
| B9 | Pantalla `/subscription` alineada con el nuevo flujo (enlaces a facturación) | done |

## P1 — Cuenta, organización y datos

| ID | Brecha | Estado |
|---|---|---|
| C1 | Exportar mis datos (JSON) desde Mi cuenta | done |
| C2 | Eliminar cuenta: hoy solo Better Auth; añadir aviso de qué se borra y de suscripción activa | done |
| C3 | Equipo/invitaciones/roles | done (ya existía en `/configuracion/equipo` y `/roles`; sin cambios) |
| C4 | Ajustes de organización (nombre/marca) | done (ya existía en `/configuracion/marca`) |
| C5 | Onboarding hasta el primer resultado (checklist) | done (ya existía: `useOnboardingChecklist`, `SidebarChecklist`) |

## P1 — Soporte y comunicación

| ID | Brecha | Estado |
|---|---|---|
| S1 | Centro de ayuda `/ayuda` con FAQ buscable por categoría | done |
| S2 | Formulario de contacto/soporte funcional (hoy `preventDefault`) en `/contacto` y dentro de la app (`/soporte`) | done |
| S3 | Notificaciones in-app (campana, lista, marcar leídas) | done |
| S4 | Enlace a ayuda/soporte en Topbar/Sidebar | done |

## P1 — Panel de plataforma (admin)

Ya existe: métricas básicas, organizaciones, usuarios, roles, membresías, banco, auditoría, impersonación.

| ID | Brecha | Estado |
|---|---|---|
| P1 | Métricas SaaS: MRR, altas, bajas, churn, ARPA, series mensuales | done |
| P2 | Suscripciones (lista, filtros por estado, detalle) | done |
| P3 | Pagos (lista, estado, reintento/reembolso simulado) | done |
| P4 | Acciones de soporte sobre una organización: extender prueba, cambiar plan, suspender, marcar pago | done |
| P5 | Bandeja de tickets de soporte | done |

## P2 — Calidad de producto

| ID | Brecha | Estado |
|---|---|---|
| Q1 | `error.tsx` global, `global-error.tsx`, `loading.tsx` de raíz y 404 coherente | todo |
| Q2 | SEO: metadata por página pública, `noindex` en app/auth/checkout, sitemap y robots correctos (`/planes`, `/ayuda`, `/refunds`; sin `/plataforma`), JSON-LD de Organization/SoftwareApplication | todo |
| Q3 | Accesibilidad: skip-link, `lang`, foco visible, `aria-live` en formularios nuevos, contraste | todo |
| Q4 | Rendimiento: `next.config` (headers de seguridad, compresión), sin fuentes duplicadas | todo |
| Q5 | Estados vacíos/carga/error coherentes en pantallas nuevas (`EmptyState`, `LoadingSpinner`, bloque de error con reintento) | todo |
| Q6 | Sentry opcional por env (`NEXT_PUBLIC_SENTRY_DSN`) sin dependencia dura | todo |

## P2 — Ingeniería y operación

| ID | Brecha | Estado |
|---|---|---|
| E1 | `.env.example` (el `.gitignore` ignora `.env*`; se añade excepción) | todo |
| E2 | CI `.github/workflows/ci.yml`: install, tsc, lint, tests, build | todo |
| E3 | `docs/RUNBOOK_WEB.md` | todo |
| E4 | Tests unitarios de la capa saas, validaciones y utilidades nuevas | todo |
| E5 | Actualizar README (rutas nuevas, variables) | todo |

## Pendiente / fuera de alcance web

| ID | Tema | Estado |
|---|---|---|
| X1 | Pasarela real (Wompi/Stripe/etc.): webhooks, tokenización, 3DS | blocked (decisión de negocio; la web solo cambia `NEXT_PUBLIC_SAAS_MODE=real` y el API implementa la pasarela) |
| X2 | Envío real de correos (verificación, recuperación, facturas, tickets) | blocked (API/proveedor SMTP) |
| X3 | Factura electrónica DIAN | blocked (requisito legal/proveedor) |
| X4 | Revisión visual y de contraste en navegador, Lighthouse | todo (usuario; no se usan herramientas de navegador) |
| X5 | Textos legales validados por abogado | blocked (los textos son plantillas razonables) |
| X6 | Analítica real (consentimiento ya gestionado por el banner) | blocked (proveedor por elegir) |

> Estado actualizado al final de cada commit; ver `git log` de la rama para el detalle.
