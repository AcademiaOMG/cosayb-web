/**
 * Textos del panel de plataforma en español claro. FUENTE ÚNICA: ningún código técnico
 * (slug de rol, recurso o acción de permiso, clave de función, acción de auditoría)
 * debe llegar a la pantalla; se muestra siempre a través de estas funciones.
 *
 * Las funciones devuelven una versión legible aunque el código no esté en el diccionario
 * (nunca el código crudo), pero cada código conocido debe tener su texto propio:
 * `labels.test.ts` falla si aparece un código nuevo sin traducción.
 */

/** «platform_billing» → «Platform billing». Último recurso para códigos que aún no están en el diccionario. */
export function humanize(code: string): string {
  const text = code.replace(/[_.:-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim().toLowerCase()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ""
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

// ─── Roles ───────────────────────────────────────────────────────────────────

export const ROLE_INFO: Record<string, { label: string; description: string }> = {
  platform_owner: {
    label: "Dueño de la plataforma",
    description: "Control total de CO$AYB: negocios, usuarios, planes, roles y facturación. Es la cuenta de mayor confianza.",
  },
  platform_admin: {
    label: "Administrador de la plataforma",
    description: "Gestiona negocios, usuarios, planes y roles del día a día, sin los permisos más sensibles del dueño.",
  },
  platform_support: {
    label: "Soporte",
    description: "Atiende a los clientes: consulta sus datos, responde solicitudes y puede entrar a un negocio para ayudarle.",
  },
  platform_billing: {
    label: "Facturación",
    description: "Revisa y ajusta los planes y cobros de los negocios.",
  },
  platform_auditor: {
    label: "Auditor",
    description: "Solo consulta el registro de auditoría para revisar quién hizo qué.",
  },
  platform_readonly: {
    label: "Solo lectura",
    description: "Puede mirar la información de la plataforma, pero no cambiar nada.",
  },
  platform_chef: {
    label: "Chef de contenido",
    description: "Mantiene los bancos públicos de recetas e ingredientes que ven todos los negocios.",
  },
  org_owner: {
    label: "Propietario del negocio",
    description: "Dueño del negocio: administra el equipo, la suscripción y todos los datos.",
  },
  org_manager: {
    label: "Gerente",
    description: "Trabaja con recetas, menús e ingredientes y administra parte del equipo del negocio.",
  },
  org_chef: {
    label: "Chef",
    description: "Crea y ajusta recetas, ingredientes y menús del negocio.",
  },
  org_cost_analyst: {
    label: "Analista de costos",
    description: "Revisa costos, punto de equilibrio y reportes del negocio.",
  },
  org_viewer: {
    label: "Observador",
    description: "Solo puede consultar la información del negocio, sin modificarla.",
  },
  basic_user: {
    label: "Usuario básico",
    description: "Persona con cuenta que todavía no pertenece a ningún negocio.",
  },
  academic_teacher: {
    label: "Docente (academia)",
    description: "En un negocio con plan Academia, guía a los estudiantes y revisa su trabajo.",
  },
  academic_assistant: {
    label: "Asistente (academia)",
    description: "En un negocio con plan Academia, apoya al docente en la gestión del grupo.",
  },
  academic_student: {
    label: "Estudiante (academia)",
    description: "En un negocio con plan Academia, practica costeo con recetas y menús propios.",
  },
}

/** Rol (de plataforma o de negocio) → nombre para mostrar. Ej. `platform_support` → «Soporte». */
export function roleLabel(slug: string): string {
  return ROLE_INFO[slug]?.label ?? humanize(slug)
}

/** Qué puede hacer un rol, en lenguaje de negocio. */
export function roleDescription(slug: string): string {
  return ROLE_INFO[slug]?.description ?? "Rol sin descripción disponible."
}

export const SCOPE_LABELS: Record<string, string> = {
  platform: "Equipo de la plataforma",
  organization: "Dentro de un negocio",
  user: "Cuenta sin negocio",
  academic: "Academia",
}

/** Alcance de un rol → texto. Ej. `organization` → «Dentro de un negocio». */
export function scopeLabel(scope: string): string {
  return SCOPE_LABELS[scope] ?? humanize(scope)
}

// ─── Permisos ────────────────────────────────────────────────────────────────

/** Área de un permiso: nombre corto, cómo se nombra en una frase y a qué grupo pertenece. */
export const PERMISSION_RESOURCES: Record<string, { label: string; object: string; group: string }> = {
  ingredients: { label: "Ingredientes", object: "los ingredientes del negocio", group: "Trabajo diario del negocio" },
  recipes: { label: "Recetas", object: "las recetas del negocio", group: "Trabajo diario del negocio" },
  menus: { label: "Menús", object: "los menús del negocio", group: "Trabajo diario del negocio" },
  yieldFactors: { label: "Factores de rendimiento", object: "los factores de rendimiento", group: "Trabajo diario del negocio" },
  valuations: { label: "Valoraciones de alimentos y bebidas", object: "las valoraciones de alimentos y bebidas", group: "Trabajo diario del negocio" },
  breakEven: { label: "Punto de equilibrio", object: "el punto de equilibrio", group: "Trabajo diario del negocio" },
  marketPrices: { label: "Precios de mercado", object: "los precios de mercado", group: "Trabajo diario del negocio" },
  reports: { label: "Reportes", object: "los reportes", group: "Trabajo diario del negocio" },
  publicRecipes: { label: "Banco público de recetas", object: "las recetas del banco público", group: "Bancos públicos" },
  publicIngredients: { label: "Banco público de ingredientes", object: "los ingredientes del banco público", group: "Bancos públicos" },
  organization: { label: "Datos del negocio", object: "los datos del negocio", group: "Administración del negocio" },
  organizationActivity: { label: "Actividad del negocio", object: "el registro de actividad del negocio", group: "Administración del negocio" },
  organizationRoles: { label: "Roles personalizados del negocio", object: "los roles personalizados del negocio", group: "Administración del negocio" },
  members: { label: "Equipo del negocio", object: "los miembros del equipo", group: "Administración del negocio" },
  invitations: { label: "Invitaciones", object: "las invitaciones al equipo", group: "Administración del negocio" },
  billing: { label: "Suscripción y pagos del negocio", object: "la suscripción y los pagos del negocio", group: "Administración del negocio" },
  platform_organizations: { label: "Negocios clientes", object: "los negocios clientes", group: "Administración de la plataforma" },
  platform_users: { label: "Usuarios de la plataforma", object: "los usuarios de la plataforma", group: "Administración de la plataforma" },
  platform_roles: { label: "Roles", object: "los roles del sistema", group: "Administración de la plataforma" },
  platform_permissions: { label: "Permisos de los roles", object: "los permisos de cada rol", group: "Administración de la plataforma" },
  platform_memberships: { label: "Membresías (planes)", object: "los planes y sus límites", group: "Administración de la plataforma" },
  platform_audit: { label: "Auditoría", object: "el registro de auditoría", group: "Administración de la plataforma" },
  platform_metrics: { label: "Métricas generales", object: "las métricas generales de la plataforma", group: "Administración de la plataforma" },
  platform_impersonation: { label: "Entrar como un negocio", object: "las sesiones de soporte dentro de un negocio", group: "Administración de la plataforma" },
  platform_billing: { label: "Facturación", object: "la facturación", group: "Administración de la plataforma" },
  platform_support: { label: "Soporte al cliente", object: "las solicitudes de soporte", group: "Administración de la plataforma" },
}

/** Acción de un permiso: etiqueta suelta, prefijo de frase y verbo para la descripción. */
export const PERMISSION_ACTIONS: Record<string, { label: string; phrase: string; verb: string }> = {
  list: { label: "Ver listado", phrase: "Ver listado de", verb: "ver el listado de" },
  read: { label: "Ver detalle", phrase: "Ver el detalle de", verb: "ver el detalle de" },
  create: { label: "Crear", phrase: "Crear", verb: "crear" },
  update: { label: "Modificar", phrase: "Modificar", verb: "modificar" },
  delete: { label: "Eliminar", phrase: "Eliminar", verb: "eliminar" },
  import: { label: "Importar", phrase: "Importar", verb: "importar" },
  publish: { label: "Publicar", phrase: "Publicar", verb: "publicar" },
  export: { label: "Exportar", phrase: "Exportar", verb: "exportar" },
  suspend: { label: "Suspender", phrase: "Suspender", verb: "suspender" },
  remove: { label: "Quitar", phrase: "Quitar", verb: "quitar" },
  revoke: { label: "Revocar", phrase: "Revocar", verb: "revocar" },
}

/** Permisos cuya frase no sale de combinar acción y área. Clave: `acción:recurso`. */
const PERMISSION_OVERRIDES: Record<string, { label: string; description: string }> = {
  "update:members": { label: "Cambiar el rol de los miembros", description: "Permite cambiar el rol que tiene cada miembro del equipo." },
  "remove:members": { label: "Sacar miembros del equipo", description: "Permite sacar a una persona del equipo del negocio." },
  "update:billing": { label: "Cambiar el método de pago y la suscripción", description: "Permite modificar el método de pago y cancelar o reanudar la suscripción del negocio." },
  "read:billing": { label: "Ver la suscripción y los pagos", description: "Permite ver el plan actual, las facturas y los pagos del negocio." },
  "publish:recipes": { label: "Publicar recetas en el banco público", description: "Permite compartir una receta en el banco público para que otros negocios la vean." },
  "update:platform_billing": { label: "Cambiar planes y facturación", description: "Permite cambiar el plan de un negocio y ajustar su facturación." },
  "read:platform_billing": { label: "Ver la facturación de un negocio", description: "Permite ver los pagos y la suscripción de un negocio cliente." },
  "list:platform_billing": { label: "Ver listado de facturación", description: "Permite ver el listado de suscripciones y pagos de todos los negocios." },
  "list:platform_audit": { label: "Ver el registro de auditoría", description: "Permite ver quién hizo qué y cuándo en la plataforma." },
  "read:platform_metrics": { label: "Ver las métricas generales", description: "Permite ver los números generales de la plataforma: negocios, usuarios y planes." },
  "create:platform_impersonation": { label: "Entrar a un negocio para dar soporte", description: "Permite iniciar una sesión de soporte dentro de un negocio, con justificación." },
  "update:platform_impersonation": { label: "Ampliar una sesión de soporte", description: "Permite pedir más permisos durante una sesión de soporte dentro de un negocio." },
  "delete:platform_impersonation": { label: "Terminar una sesión de soporte", description: "Permite cerrar una sesión de soporte dentro de un negocio." },
  "list:platform_support": { label: "Ver las solicitudes de soporte", description: "Permite ver el listado de solicitudes que envían los clientes." },
  "update:platform_support": { label: "Responder y cerrar solicitudes de soporte", description: "Permite cambiar el estado de las solicitudes de soporte y responderlas." },
  "update:platform_permissions": { label: "Cambiar los permisos de cada rol", description: "Permite decidir qué puede hacer cada rol. Es un permiso muy sensible." },
  "list:platform_permissions": { label: "Ver los permisos de cada rol", description: "Permite ver qué puede hacer cada rol del sistema." },
  "suspend:platform_organizations": { label: "Suspender o reactivar negocios", description: "Permite bloquear el acceso de un negocio o volver a activarlo." },
  "suspend:platform_users": { label: "Suspender usuarios", description: "Permite bloquear el acceso de un usuario a la plataforma." },
  "update:platform_users": { label: "Modificar usuarios y sus roles", description: "Permite cambiar los datos de un usuario y los roles que tiene." },
  "update:platform_memberships": { label: "Modificar los planes y sus límites", description: "Permite cambiar qué incluye y qué límites tiene cada plan." },
  "list:platform_memberships": { label: "Ver los planes y sus límites", description: "Permite consultar qué incluye cada plan." },
  "read:organizationActivity": { label: "Ver la actividad del negocio", description: "Permite ver el registro de lo que ha hecho el equipo en el negocio." },
  "update:organization": { label: "Modificar los datos del negocio", description: "Permite cambiar el nombre y los datos del negocio." },
  "delete:organization": { label: "Eliminar el negocio", description: "Permite borrar el negocio completo. Es un permiso muy sensible." },
  "export:reports": { label: "Exportar reportes", description: "Permite descargar los reportes del negocio." },
  "read:reports": { label: "Ver reportes", description: "Permite consultar los reportes del negocio." },
  "create:invitations": { label: "Invitar personas al equipo", description: "Permite enviar invitaciones para unirse al negocio." },
  "revoke:invitations": { label: "Cancelar invitaciones", description: "Permite cancelar invitaciones que todavía no se han aceptado." },
  "list:invitations": { label: "Ver las invitaciones enviadas", description: "Permite ver las invitaciones pendientes del negocio." },
}

/** Área de un permiso → nombre. Ej. `platform_billing` → «Facturación». */
export function permissionResourceLabel(resource: string): string {
  return PERMISSION_RESOURCES[resource]?.label ?? humanize(resource)
}

/** Grupo grande al que pertenece un área (para agrupar casillas). */
export function permissionGroupLabel(resource: string): string {
  return PERMISSION_RESOURCES[resource]?.group ?? "Otros permisos"
}

/** Acción de un permiso → verbo. Ej. `update` → «Modificar». */
export function permissionActionLabel(action: string): string {
  return PERMISSION_ACTIONS[action]?.label ?? humanize(action)
}

/** Permiso completo → frase corta. Ej. (`platform_billing`, `list`) → «Ver listado de facturación». */
export function permissionLabel(resource: string, action: string): string {
  const special = PERMISSION_OVERRIDES[`${action}:${resource}`]
  if (special) return special.label
  const res = PERMISSION_RESOURCES[resource]
  const act = PERMISSION_ACTIONS[action]
  if (!res || !act) return `${permissionActionLabel(action)} · ${permissionResourceLabel(resource)}`
  return `${act.phrase} ${lowerFirst(res.label)}`
}

/** Explicación corta de un permiso, en lenguaje de negocio. */
export function permissionDescription(resource: string, action: string): string {
  const special = PERMISSION_OVERRIDES[`${action}:${resource}`]
  if (special) return special.description
  const res = PERMISSION_RESOURCES[resource]
  const act = PERMISSION_ACTIONS[action]
  if (!res || !act) return "Permiso sin descripción disponible."
  return `Permite ${act.verb} ${res.object}.`
}

/** Permisos que, si el administrador se los quita a su propio rol, lo dejan sin poder corregirlo. */
export const CRITICAL_PERMISSIONS = [
  "list:platform_roles",
  "list:platform_permissions",
  "update:platform_permissions",
] as const

export function isCriticalPermission(slug: string): boolean {
  return (CRITICAL_PERMISSIONS as readonly string[]).includes(slug)
}

// ─── Membresías ──────────────────────────────────────────────────────────────

export const FEATURE_INFO: Record<string, { label: string; description: string; unit?: string }> = {
  max_users: { label: "Usuarios del equipo", description: "Cuántas personas pueden trabajar en el mismo negocio.", unit: "usuarios" },
  max_ingredients: { label: "Ingredientes que puede crear", description: "Cuántos ingredientes propios puede registrar el negocio.", unit: "ingredientes" },
  max_recipes: { label: "Recetas que puede crear", description: "Cuántas recetas propias puede registrar el negocio.", unit: "recetas" },
  max_menus: { label: "Menús que puede crear", description: "Cuántos menús propios puede armar el negocio.", unit: "menús" },
  max_custom_roles: { label: "Roles personalizados que puede crear", description: "Cuántos roles propios puede definir el negocio para su equipo.", unit: "roles" },
  public_banks: { label: "Bancos públicos de recetas e ingredientes", description: "Acceso a las recetas e ingredientes compartidos por la plataforma." },
  reports: { label: "Reportes avanzados", description: "Reportes detallados de costos y rentabilidad." },
  exports: { label: "Exportar datos", description: "Descargar la información del negocio en archivos." },
  analytics: { label: "Analítica del negocio", description: "Gráficos e indicadores para entender cómo va el negocio." },
  custom_roles: { label: "Roles personalizados", description: "Crear roles propios con permisos a la medida del equipo." },
  academic_roles: { label: "Roles de academia", description: "Roles de docente, asistente y estudiante para escuelas gastronómicas." },
  api_access: { label: "Conexión con otros sistemas (API)", description: "Permite conectar CO$AYB con otros programas del negocio." },
  multi_location: { label: "Varias sucursales", description: "Manejar más de un local dentro del mismo negocio." },
  module_ingredients: { label: "Módulo de inventario", description: "Pantalla para administrar los ingredientes y su costo." },
  module_recipes: { label: "Módulo de recetas", description: "Pantalla para crear y costear recetas." },
  module_menus: { label: "Módulo de menús", description: "Pantalla para armar menús y calcular su rentabilidad." },
  module_yieldFactors: { label: "Módulo de factor de rendimiento", description: "Pantalla para calcular cuánto rinde cada ingrediente tras limpiarlo." },
  module_valuations: { label: "Módulo de valoración de alimentos y bebidas", description: "Pantalla para valorar alimentos y bebidas." },
  module_breakEven: { label: "Módulo de punto de equilibrio", description: "Pantalla para calcular cuánto hay que vender para no perder." },
  module_marketPrices: { label: "Módulo de precios de mercado", description: "Pantalla para comparar los precios de los ingredientes con el mercado." },
  activity_log: { label: "Registro de actividad del negocio", description: "Historial de lo que hace cada persona del equipo." },
}

/** Función/límite de una membresía → nombre. Ej. `max_recipes` → «Recetas que puede crear». */
export function featureLabel(key: string): string {
  return FEATURE_INFO[key]?.label ?? humanize(key)
}

/** Qué controla la función, en una frase. */
export function featureDescription(key: string): string {
  return FEATURE_INFO[key]?.description ?? "Función sin descripción disponible."
}

/** ¿Es un límite numérico (se edita con un número) o solo se activa/desactiva? */
export function featureIsLimit(key: string): boolean {
  return key.startsWith("max_")
}

/** Unidad de un límite. Ej. `max_users` → «usuarios». */
export function featureUnit(key: string): string {
  return FEATURE_INFO[key]?.unit ?? ""
}

/**
 * Valor de una función en una membresía como texto.
 * Límite: «Ilimitado» (null) o «50 recetas». Interruptor: «Incluido» o «No incluido».
 */
export function formatFeatureValue(key: string, enabled: boolean, limitValue: number | null): string {
  if (!enabled) return "No incluido"
  if (!featureIsLimit(key)) return "Incluido"
  if (limitValue === null) return "Ilimitado"
  const unit = featureUnit(key)
  return unit ? `${limitValue.toLocaleString("es-CO")} ${unit}` : limitValue.toLocaleString("es-CO")
}

/**
 * Valida el texto escrito en un campo de límite. Vacío = ilimitado.
 * Devuelve el valor o un mensaje de error en español.
 */
export function parseLimitInput(raw: string): { ok: true; value: number | null } | { ok: false; error: string } {
  const text = raw.trim()
  if (text === "") return { ok: true, value: null }
  if (!/^\d+$/.test(text)) return { ok: false, error: "Escribe un número entero, sin decimales ni signos." }
  const value = Number(text)
  if (!Number.isSafeInteger(value) || value > 1_000_000) return { ok: false, error: "El límite no puede pasar de 1.000.000." }
  return { ok: true, value }
}

/** Nombre de la membresía. Ej. `pro` → «Pro». */
export function membershipLabel(tier: string): string {
  const known: Record<string, string> = { free: "Free", pro: "Pro", academia: "Academia" }
  return known[tier] ?? humanize(tier)
}

// ─── Estados ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  suspended: "Suspendido",
  trialing: "En prueba",
  trial: "En prueba",
  past_due: "Pago pendiente",
  pending: "Pendiente",
  approved: "Aprobado",
  declined: "Rechazado",
  failed: "Fallido",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
  canceled: "Cancelado",
  expired: "Vencido",
  open: "Abierta",
  in_progress: "En atención",
  resolved: "Resuelta",
  closed: "Cerrada",
}

/** Estado de un negocio, suscripción, pago o solicitud → texto. Ej. `past_due` → «Pago pendiente». */
export function platformStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? humanize(status)
}

// ─── Auditoría ───────────────────────────────────────────────────────────────

/** `label`: lo que se hizo (pasado). `prep`: preposición para añadir sobre qué («de», «a»…). */
export const AUDIT_ACTIONS: Record<string, { label: string; prep?: string }> = {
  "account.delete": { label: "Eliminó su cuenta" },
  "account.export": { label: "Descargó sus datos personales" },
  "billing.book_order.create": { label: "Pidió un libro", prep: "en" },
  "billing.enrollment.create": { label: "Se inscribió a un curso", prep: "en" },
  "billing.payment_method.update": { label: "Cambió el método de pago", prep: "de" },
  "billing.payment.failed": { label: "Tuvo un pago fallido", prep: "en" },
  "billing.subscription.activate": { label: "Activó la suscripción", prep: "de" },
  "billing.subscription.renew": { label: "Renovó la suscripción", prep: "de" },
  "billing.subscription.cancel": { label: "Canceló la suscripción", prep: "de" },
  "billing.subscription.cancel_nonpayment": { label: "Canceló la suscripción por falta de pago", prep: "de" },
  "billing.subscription.resume": { label: "Reanudó la suscripción", prep: "de" },
  "billing.subscription.expire": { label: "Dejó vencer la suscripción", prep: "de" },
  "impersonation.start": { label: "Entró como soporte", prep: "a" },
  "impersonation.elevate": { label: "Pidió más permisos durante una sesión de soporte", prep: "en" },
  "impersonation.end": { label: "Terminó la sesión de soporte", prep: "en" },
  "invitation.accept": { label: "Aceptó la invitación", prep: "a" },
  "invitation.create": { label: "Invitó a una persona", prep: "a" },
  "invitation.resend": { label: "Reenvió una invitación", prep: "de" },
  "member.leave": { label: "Salió del equipo", prep: "de" },
  "member.remove": { label: "Sacó a un miembro del equipo", prep: "de" },
  "member.role_change": { label: "Cambió el rol de un miembro", prep: "en" },
  "organization.create": { label: "Creó el negocio" },
  "organization.delete": { label: "Eliminó el negocio" },
  "organization.transfer_ownership": { label: "Traspasó la propiedad del negocio" },
  "platform.banco.ingredient_create": { label: "Agregó un ingrediente al banco público" },
  "platform.banco.ingredient_update": { label: "Modificó un ingrediente del banco público" },
  "platform.banco.ingredient_delete": { label: "Eliminó un ingrediente del banco público" },
  "platform.banco.recipe_create": { label: "Agregó una receta al banco público" },
  "platform.banco.recipe_update": { label: "Modificó una receta del banco público" },
  "platform.banco.recipe_delete": { label: "Eliminó una receta del banco público" },
  "platform.billing.payment_view": { label: "Consultó los pagos", prep: "de" },
  "platform.billing.subscription_view": { label: "Consultó las suscripciones" },
  "platform.organization.activity_view": { label: "Consultó la actividad", prep: "de" },
  "platform.organization.extend_trial": { label: "Extendió la prueba gratuita", prep: "de" },
  "platform.organization.note_add": { label: "Agregó una nota interna", prep: "a" },
  "platform.organization.note_delete": { label: "Eliminó una nota interna", prep: "de" },
  "platform.organization.overview_view": { label: "Consultó el resumen", prep: "de" },
  "platform.organization.reactivate": { label: "Reactivó el negocio" },
  "platform.organization.resend_invitation": { label: "Reenvió una invitación", prep: "de" },
  "platform.organization.suspend": { label: "Suspendió el negocio" },
  "platform.organization.team_view": { label: "Consultó el equipo", prep: "de" },
  "platform.organizations.export": { label: "Descargó el listado de negocios" },
  "platform.users.export": { label: "Descargó el listado de usuarios" },
  "platform.support.ticket_reply": { label: "Respondió una solicitud de soporte" },
  "platform.user.activity_view": { label: "Consultó la actividad", prep: "de" },
  "platform.user.revoke_sessions": { label: "Cerró las sesiones", prep: "de" },
  "platform.user.send_password_reset": { label: "Envió un enlace para cambiar la contraseña", prep: "a" },
  "platform.user.sessions_view": { label: "Consultó las sesiones", prep: "de" },
  "platform.membership.set_roles": { label: "Cambió los roles que incluye un plan" },
  "platform.membership.update_feature": { label: "Cambió una función o límite de un plan" },
  "platform.organization.billing_view": { label: "Consultó la facturación", prep: "de" },
  "platform.organization.change_plan": { label: "Cambió el plan", prep: "de" },
  "platform.organization.read": { label: "Consultó los datos", prep: "de" },
  "platform.organization.update": { label: "Modificó los datos", prep: "de" },
  "platform.organizationRole.delete": { label: "Eliminó un rol personalizado", prep: "de" },
  "platform.role.create": { label: "Creó un rol del sistema" },
  "platform.role.set_permissions": { label: "Cambió los permisos de un rol" },
  "platform.support.ticket_update": { label: "Actualizó una solicitud de soporte" },
  "platform.user.add_org_membership": { label: "Agregó a un usuario a un negocio" },
  "platform.user.read": { label: "Consultó los datos", prep: "de" },
  "platform.user.remove_org_membership": { label: "Sacó a un usuario de un negocio" },
  "platform.user.resend_verification": { label: "Reenvió el correo de verificación", prep: "a" },
  "platform.user.set_org_role": { label: "Cambió el rol de un usuario en un negocio" },
  "platform.user.set_platform_roles": { label: "Cambió los roles de plataforma", prep: "de" },
  "security.email_change_requested": { label: "Pidió cambiar su correo" },
  "security.email_verified": { label: "Verificó su correo" },
  "security.login": { label: "Inició sesión" },
  "security.password_changed": { label: "Cambió su contraseña" },
  "security.password_reset": { label: "Restableció su contraseña" },
  "security.session_revoked": { label: "Cerró una de sus sesiones" },
  "security.sessions_revoked": { label: "Cerró todas sus sesiones" },
  "support.ticket.create": { label: "Envió una solicitud de soporte" },
}

const HTTP_METHOD_VERB: Record<string, string> = {
  post: "creó información",
  put: "modificó información",
  patch: "modificó información",
  delete: "eliminó información",
}

/** Acción de auditoría → frase en pasado. Ej. `billing.subscription.cancel` → «Canceló la suscripción». */
export function auditActionLabel(action: string): string {
  const known = AUDIT_ACTIONS[action]
  if (known) return known.label
  // Cambios hechos durante una sesión de soporte: `impersonation.write.<método>`
  const write = /^impersonation\.write\.(\w+)$/.exec(action)
  if (write) {
    const verb = HTTP_METHOD_VERB[write[1]] ?? "hizo un cambio"
    return `Durante una sesión de soporte ${verb}`
  }
  return humanize(action)
}

/** Preposición con la que se añade sobre qué recayó la acción (vacío si no aplica). */
export function auditActionPreposition(action: string): string {
  return AUDIT_ACTIONS[action]?.prep ?? ""
}

/** Tipo de recurso de un registro de auditoría → texto. Ej. `support_ticket` → «Solicitud de soporte». */
export const AUDIT_RESOURCE_TYPES: Record<string, string> = {
  book_order: "Pedido de libro",
  enrollment: "Inscripción",
  invitations: "Invitación",
  members: "Miembro del equipo",
  organization: "Negocio",
  platform_billing: "Facturación",
  platform_memberships: "Plan",
  platform_organizations: "Negocio",
  platform_roles: "Rol",
  platform_support: "Soporte",
  platform_users: "Usuario",
  publicIngredients: "Banco público de ingredientes",
  publicRecipes: "Banco público de recetas",
  session: "Sesión",
  subscription: "Suscripción",
  support_ticket: "Solicitud de soporte",
  tenant_data: "Datos del negocio",
  user: "Usuario",
}

export function auditResourceLabel(resourceType: string): string {
  return AUDIT_RESOURCE_TYPES[resourceType] ?? humanize(resourceType)
}

/**
 * Frase completa de un registro. Ej. («Ana Pérez», `billing.subscription.cancel`, «Panadería La Esquina»)
 * → «Ana Pérez canceló la suscripción de Panadería La Esquina».
 */
export function auditSentence(input: { action: string; actorName?: string | null; targetName?: string | null }): string {
  const actor = input.actorName?.trim() || "Un usuario"
  const what = lowerFirst(auditActionLabel(input.action))
  const prep = auditActionPreposition(input.action)
  const target = input.targetName?.trim()
  return target && prep ? `${actor} ${what} ${prep} ${target}` : `${actor} ${what}`
}

// ─── Telemetría: accesos, uso por módulo y eventos de autenticación ─────────

/** Módulo del producto (`usage_events.module`) → nombre que ve el cliente en su menú. */
export const USAGE_MODULE_LABELS: Record<string, string> = {
  ingredients: "Inventario de ingredientes",
  recipes: "Recetas",
  menus: "Menús",
  yield_factors: "Factor de rendimiento",
  valuations: "Valoración A&B",
  break_even: "Punto de equilibrio",
  market_prices: "Precios de mercado",
  dashboard: "Inicio",
  billing: "Facturación",
  team: "Equipo",
  settings: "Configuración",
  exports: "Exportaciones",
  other: "Otros",
}

export function moduleLabel(module: string): string {
  return USAGE_MODULE_LABELS[module] ?? humanize(module)
}

/** Acción sobre un módulo (`usage_events.action`) en pasado: «Consultó», «Creó»… */
export const USAGE_ACTION_LABELS: Record<string, string> = {
  view: "Consultó",
  create: "Creó",
  update: "Modificó",
  delete: "Eliminó",
  export: "Exportó",
}

export function usageActionLabel(action: string): string {
  return USAGE_ACTION_LABELS[action] ?? humanize(action)
}

/** Evento de autenticación (`auth_events.type`) → frase. */
export const AUTH_EVENT_LABELS: Record<string, string> = {
  login_success: "Inició sesión",
  login_failed: "Intento fallido de inicio de sesión",
  signup: "Se registró",
  logout: "Cerró sesión",
  password_reset_requested: "Pidió restablecer la contraseña",
  password_changed: "Cambió la contraseña",
  email_verified: "Verificó su correo",
  session_revoked: "Se cerró una de sus sesiones",
  account_deleted: "Eliminó su cuenta",
  rate_limited: "Bloqueado un rato por demasiados intentos",
}

export function authEventLabel(type: string): string {
  return AUTH_EVENT_LABELS[type] ?? humanize(type)
}

export const AUTH_METHOD_LABELS: Record<string, string> = {
  password: "Correo y contraseña",
  google: "Google",
}

export function authMethodLabel(method: string | null | undefined): string {
  if (!method) return "—"
  return AUTH_METHOD_LABELS[method] ?? humanize(method)
}

/** Motivo de un intento fallido (`auth_events.reason`). */
export const AUTH_FAILURE_LABELS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Correo o contraseña incorrectos",
  EMAIL_NOT_VERIFIED: "Correo sin verificar",
  USER_NOT_FOUND: "No existe una cuenta con ese correo",
  INVALID_PASSWORD: "Contraseña incorrecta",
  TOO_MANY_REQUESTS: "Demasiados intentos",
}

export function authFailureLabel(reason: string | null | undefined): string {
  if (!reason) return "Sin motivo registrado"
  return AUTH_FAILURE_LABELS[reason] ?? humanize(reason)
}

// ─── Analítica de uso: pasos del embudo de activación ───────────────────────

/** Paso del embudo (`funnel.steps[].key`) → lo que hicieron las personas en ese paso. */
export const FUNNEL_STEP_LABELS: Record<string, string> = {
  registered: "Se registraron",
  verified: "Verificaron su correo",
  organization: "Crearon su negocio",
  content: "Cargaron su primer ingrediente o receta",
  menu: "Armaron su primer menú",
  paid: "Pasaron a un plan de pago",
}

export function funnelStepLabel(key: string): string {
  return FUNNEL_STEP_LABELS[key] ?? humanize(key)
}
