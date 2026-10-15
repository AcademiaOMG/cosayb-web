# Runbook — cosayb-web

Guía de operación del frontend (Next.js 16, App Router). El API vive en `cosayb-api`
(ver su `docs/RUNBOOK.md`). Estado del producto y brechas: `docs/SAAS_BACKLOG_WEB.md`.

## 1. Arquitectura en una página

- **Next.js** sirve marketing (`/`, `/planes`, `/ayuda`, legales), auth (`/login`, `/register`, …), la app
  autenticada (`app/(app)`) y la consola de plataforma (`/plataforma`).
- **Auth**: Better Auth. El navegador habla con `/api/auth/*` del propio dominio; `app/api/auth/[...all]/route.ts`
  lo reenvía al API (`API_URL`). Así las cookies de sesión quedan en el dominio del frontend.
- **Datos**: `lib/api/*` llama al API con `credentials: "include"` y la cabecera `X-Organization-Id`.
- **Frontera mock/real SaaS**: `lib/saas/services.ts`. `NEXT_PUBLIC_SAAS_MODE=mock|real`.
  El checkout/suscripción inicial (`lib/commerce/services.ts`) siempre habla con el API.
- **Protección de rutas**: `proxy.ts` (cookie de sesión) + `SessionGuard` (valida contra el API).

## 2. Variables de entorno

Ver `.env.example`. Las `NEXT_PUBLIC_*` se incrustan **en el build**: cambiarlas exige volver a desplegar.

| Variable | Obligatoria | Notas |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | sí | URL pública del API |
| `API_URL` | no | URL del API vista desde el servidor de Next (proxy de auth) |
| `NEXT_PUBLIC_FRONTEND_URL` | sí en prod | sitemap, robots, canónicos |
| `NEXT_PUBLIC_SESSION_IDLE_MINUTES` | no | debe coincidir con el API |
| `NEXT_PUBLIC_SAAS_MODE` | no | `mock` (demo) o `real`. Si falta: desarrollo = mock, **producción = real** |
| `NEXT_PUBLIC_SENTRY_DSN` | no | activa el reporte de errores |
| `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_RELEASE` | no | etiquetas del reporte |

## 3. Despliegue

1. CI (`.github/workflows/ci.yml`) debe estar verde: `tsc`, `lint`, `test`, `build`.
2. Despliegue en Vercel (o cualquier host Node): variables de la tabla anterior, comando `pnpm build`, `pnpm start`.
3. El API debe aceptar el origen del frontend (`FRONTEND_ORIGINS`/CORS) y el callback de Google debe apuntar al dominio del frontend.
4. Verificación posterior (humana, en navegador):
   - `/` carga, banner de cookies aparece una vez y recuerda la elección.
   - Registro con correo → llega el correo de verificación → el enlace deja `/verify-email?verified=1`.
   - Login con correo/contraseña y con Google; `¿Olvidaste tu contraseña?` envía el enlace y `/reset-password` lo acepta.
   - `/planes` muestra comparativa; el CTA lleva a login → checkout.
   - `/configuracion/facturacion`: plan, método de pago, factura/recibo.
   - `/ayuda` busca; `/contacto` envía y devuelve número de solicitud.
   - `/plataforma` (usuario de plataforma): métricas, suscripciones, pagos, soporte.
   - `/robots.txt`, `/sitemap.xml` y una URL privada con `X-Robots-Tag: noindex`.

## 4. Pasar de mock a real (y conectar la pasarela)

1. En el API: migraciones aplicadas (billing, facturas, notificaciones, soporte), `EMAIL_PROVIDER` configurado,
   `PAYMENT_PROVIDER` (`simulated` o `real` con credenciales). Ver `docs/SAAS_API_CONTRATO.md` y `PASARELA_REAL.md` del API.
2. Los endpoints del modo real están en el bloque `realServices` de `lib/saas/services.ts` y sus adaptadores en `lib/saas/adapters.ts`
   (según `SAAS_API_CONTRATO.md` del repo del API). Si el contrato cambia, se ajusta solo ahí.
   En modo real la UI de Facturación se adapta (`capabilities`): subir de plan va al checkout, no hay cambio directo ni actualización de método de pago.
3. Poner `NEXT_PUBLIC_SAAS_MODE=real` y volver a desplegar.
4. Con la pasarela real, el formulario de método de pago (`components/saas/PaymentMethodModal.tsx`) y el checkout
   (`components/commerce/PaymentStep.tsx`) deben sustituir la captura de tarjeta por el widget/tokenización del proveedor:
   solo se envía un token y se reciben marca/últimos 4. Nada más cambia en la web.
5. Quitar el texto «Pago simulado» de `PaymentMethodModal`, `PlanChangeModal`, `app/subscription/page.tsx` y `/planes`.

## 5. Incidentes frecuentes

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| Bucle `/login` ↔ `/dashboard` | cookie de sesión vieja y sesión borrada en el API | `/login` ya limpia la cookie huérfana; revisar `checkServerSession` y CORS/cookies del API |
| «Esta función aún no está disponible en el servidor» al registrarse o recuperar contraseña | el API no tiene `emailAndPassword` activo | habilitarlo en el API (`auth.ts`) |
| No llegan correos de verificación/recuperación | `EMAIL_PROVIDER=console` o SMTP/Resend mal configurado | revisar variables y logs del API |
| Facturación vacía o con error en modo real | endpoints distintos al contrato / migraciones sin aplicar | revisar `realServices` y la respuesta del API (cada error 5xx muestra su `X-Request-Id`); mientras tanto `NEXT_PUBLIC_SAAS_MODE=mock` |
| Aviso «pago pendiente» persistente | suscripción en `past_due` | el cliente reintenta en Facturación; soporte puede «Marcar pago recibido» en `/plataforma/organizaciones/:id` |
| Estilos o datos de otra organización tras cambiar de negocio | caché SWR | el cambio de organización recarga la página; si persiste, limpiar `localStorage` (`activeOrg`) |

## 6. Datos de demostración (modo mock)

El estado mock vive en `localStorage` (`cosayb.saas.mock.v1`, `cosayb.saas.mock.platform.v1`). En Facturación hay
una caja «Modo demostración» para simular un pago fallido o reiniciar. No se usa en producción.

## 7. Monitoreo

- Errores no controlados → Sentry si hay `NEXT_PUBLIC_SENTRY_DSN` (`lib/monitoring.ts`, sin dependencias).
  Para tracing y source maps, instalar `@sentry/nextjs` y reemplazar `reportError` por su captura.
- Los errores de ruta muestran un código (`digest`) que se puede buscar en los logs del servidor.

## 8. Rollback

Redeploy de la versión anterior en el host. No hay migraciones en el frontend. Si el problema es solo de la capa
SaaS nueva, cambiar `NEXT_PUBLIC_SAAS_MODE=mock` y redeployar es un mitigante rápido (los datos reales no se tocan).

## 9. Comandos locales

```bash
pnpm install
pnpm dev                       # http://localhost:3002
pnpm exec tsc --noEmit         # tipos
pnpm lint
pnpm test                      # vitest (lib/**/*.test.ts)
pnpm build
```

En un worktree con `node_modules` enlazado: `node node_modules/typescript/bin/tsc --noEmit`,
`node node_modules/vitest/vitest.mjs run`, `node node_modules/eslint/bin/eslint.js .`.
