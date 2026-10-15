import { describe, expect, it } from "vitest"
import {
  AUDIT_ACTIONS, AUDIT_RESOURCE_TYPES, FEATURE_INFO, PERMISSION_ACTIONS, PERMISSION_RESOURCES, ROLE_INFO,
  auditActionLabel, auditSentence, featureLabel, formatFeatureValue, humanize, parseLimitInput,
  permissionDescription, permissionLabel, platformStatusLabel, roleDescription, roleLabel,
} from "./labels"

// Listas de códigos reales del API (authz.constants.ts, base de datos y logAudit).
// Cuando el API agregue un código nuevo hay que agregarlo aquí Y en labels.ts.
const ROLES = [
  "platform_owner", "platform_admin", "platform_support", "platform_billing", "platform_auditor", "platform_readonly",
  "platform_chef", "org_owner", "org_manager", "org_chef", "org_cost_analyst", "org_viewer", "basic_user",
  "academic_teacher", "academic_assistant", "academic_student",
]
const RESOURCES = [
  "ingredients", "recipes", "menus", "yieldFactors", "valuations", "breakEven", "marketPrices", "reports",
  "publicRecipes", "publicIngredients", "organization", "organizationActivity", "organizationRoles", "members",
  "invitations", "billing", "platform_organizations", "platform_users", "platform_roles", "platform_permissions",
  "platform_memberships", "platform_audit", "platform_metrics", "platform_impersonation", "platform_billing",
  "platform_support",
]
const ACTIONS = ["list", "read", "create", "update", "delete", "import", "publish", "export", "suspend", "remove", "revoke"]
const FEATURES = [
  "max_users", "max_ingredients", "max_recipes", "max_menus", "max_custom_roles", "public_banks", "reports", "exports",
  "analytics", "custom_roles", "academic_roles", "api_access", "multi_location", "module_ingredients", "module_recipes",
  "module_menus", "module_yieldFactors", "module_valuations", "module_breakEven", "module_marketPrices", "activity_log",
]
const AUDIT = [
  "account.delete", "account.export", "billing.book_order.create", "billing.enrollment.create",
  "billing.payment_method.update", "billing.payment.failed", "billing.subscription.activate",
  "billing.subscription.renew", "billing.subscription.cancel", "billing.subscription.cancel_nonpayment",
  "billing.subscription.resume", "billing.subscription.expire", "impersonation.start", "impersonation.elevate",
  "impersonation.end", "invitation.accept", "invitation.create", "invitation.resend", "member.leave", "member.remove",
  "member.role_change", "organization.create", "organization.delete", "organization.transfer_ownership",
  "platform.banco.ingredient_create", "platform.banco.ingredient_update", "platform.banco.ingredient_delete",
  "platform.banco.recipe_create", "platform.banco.recipe_update", "platform.banco.recipe_delete",
  "platform.billing.payment_view", "platform.billing.subscription_view", "platform.organization.activity_view", "platform.organization.extend_trial", "platform.organization.note_add", "platform.organization.note_delete", "platform.organization.overview_view", "platform.organization.reactivate", "platform.organization.resend_invitation", "platform.organization.suspend", "platform.organization.team_view", "platform.organizations.export", "platform.users.export", "platform.support.ticket_reply", "platform.user.activity_view", "platform.user.revoke_sessions", "platform.user.send_password_reset", "platform.user.sessions_view", "platform.membership.set_roles", "platform.membership.update_feature", "platform.organization.billing_view",
  "platform.organization.change_plan", "platform.organization.read", "platform.organization.update",
  "platform.organizationRole.delete", "platform.role.create", "platform.role.set_permissions",
  "platform.support.ticket_update", "platform.user.add_org_membership", "platform.user.read",
  "platform.user.remove_org_membership", "platform.user.resend_verification", "platform.user.set_org_role",
  "platform.user.set_platform_roles", "security.email_change_requested", "security.email_verified", "security.login",
  "security.password_changed", "security.password_reset", "security.session_revoked", "security.sessions_revoked",
  "support.ticket.create",
]
const AUDIT_RESOURCES = [
  "book_order", "enrollment", "invitations", "members", "organization", "platform_billing", "platform_memberships",
  "platform_organizations", "platform_roles", "platform_support", "platform_users", "publicIngredients",
  "publicRecipes", "session", "subscription", "support_ticket", "tenant_data", "user",
]
// Permisos reales de la tabla `permissions` (acción:recurso)
const PERMISSIONS = [
  "read:billing", "update:billing", "create:breakEven", "delete:breakEven", "list:breakEven", "read:breakEven",
  "update:breakEven", "create:ingredients", "delete:ingredients", "list:ingredients", "read:ingredients",
  "update:ingredients", "create:invitations", "list:invitations", "revoke:invitations", "list:marketPrices",
  "read:marketPrices", "list:members", "remove:members", "update:members", "create:menus", "delete:menus", "list:menus",
  "read:menus", "update:menus", "delete:organization", "read:organization", "update:organization",
  "read:organizationActivity", "create:organizationRoles", "delete:organizationRoles", "list:organizationRoles",
  "update:organizationRoles", "list:platform_audit", "list:platform_billing", "read:platform_billing",
  "update:platform_billing", "create:platform_impersonation", "delete:platform_impersonation",
  "update:platform_impersonation", "list:platform_memberships", "update:platform_memberships",
  "read:platform_metrics", "list:platform_organizations", "read:platform_organizations",
  "suspend:platform_organizations", "update:platform_organizations", "list:platform_permissions",
  "update:platform_permissions", "create:platform_roles", "delete:platform_roles", "list:platform_roles",
  "read:platform_roles", "update:platform_roles", "list:platform_support", "update:platform_support",
  "list:platform_users", "read:platform_users", "suspend:platform_users", "update:platform_users",
  "create:publicIngredients", "delete:publicIngredients", "import:publicIngredients", "list:publicIngredients",
  "read:publicIngredients", "update:publicIngredients", "create:publicRecipes", "delete:publicRecipes",
  "import:publicRecipes", "list:publicRecipes", "read:publicRecipes", "update:publicRecipes", "create:recipes",
  "delete:recipes", "list:recipes", "publish:recipes", "read:recipes", "update:recipes", "export:reports",
  "read:reports", "create:valuations", "delete:valuations", "list:valuations", "read:valuations", "update:valuations",
  "create:yieldFactors", "delete:yieldFactors", "list:yieldFactors", "read:yieldFactors", "update:yieldFactors",
]

const looksTechnical = (text: string) => /_|\b[a-z]+\.[a-z]+\b|[a-z][A-Z]/.test(text)

describe("cobertura del diccionario", () => {
  it("todos los roles conocidos tienen nombre y descripción propios", () => {
    for (const slug of ROLES) {
      expect(ROLE_INFO[slug], slug).toBeDefined()
      expect(roleLabel(slug)).not.toBe(humanize(slug))
      expect(roleDescription(slug).length).toBeGreaterThan(20)
    }
  })

  it("todos los recursos y acciones de permisos tienen texto", () => {
    for (const r of RESOURCES) expect(PERMISSION_RESOURCES[r], r).toBeDefined()
    for (const a of ACTIONS) expect(PERMISSION_ACTIONS[a], a).toBeDefined()
  })

  it("todos los permisos reales dan etiqueta y descripción legibles", () => {
    for (const slug of PERMISSIONS) {
      const [action, resource] = slug.split(":")
      expect(RESOURCES, slug).toContain(resource)
      expect(ACTIONS, slug).toContain(action)
      expect(looksTechnical(permissionLabel(resource, action)), permissionLabel(resource, action)).toBe(false)
      expect(looksTechnical(permissionDescription(resource, action)), slug).toBe(false)
    }
  })

  it("todas las funciones de membresía tienen nombre y descripción", () => {
    for (const key of FEATURES) {
      expect(FEATURE_INFO[key], key).toBeDefined()
      expect(looksTechnical(featureLabel(key)), key).toBe(false)
      if (key.startsWith("max_")) expect(FEATURE_INFO[key].unit, key).toBeTruthy()
    }
  })

  it("todas las acciones y recursos de auditoría tienen texto", () => {
    for (const a of AUDIT) {
      expect(AUDIT_ACTIONS[a], a).toBeDefined()
      expect(looksTechnical(auditActionLabel(a)), a).toBe(false)
    }
    for (const r of AUDIT_RESOURCES) expect(AUDIT_RESOURCE_TYPES[r], r).toBeDefined()
  })

  it("el diccionario y las listas conocidas están sincronizados", () => {
    expect(Object.keys(ROLE_INFO).sort()).toEqual([...ROLES].sort())
    expect(Object.keys(PERMISSION_RESOURCES).sort()).toEqual([...RESOURCES].sort())
    expect(Object.keys(FEATURE_INFO).sort()).toEqual([...FEATURES].sort())
    expect(Object.keys(AUDIT_ACTIONS).sort()).toEqual([...AUDIT].sort())
  })
})

describe("textos de ejemplo", () => {
  it("usa la redacción acordada", () => {
    expect(permissionLabel("platform_billing", "list")).toBe("Ver listado de facturación")
    expect(permissionLabel("ingredients", "create")).toBe("Crear ingredientes")
    expect(featureLabel("max_recipes")).toBe("Recetas que puede crear")
    expect(auditActionLabel("billing.subscription.cancel")).toBe("Canceló la suscripción")
    expect(platformStatusLabel("past_due")).toBe("Pago pendiente")
  })

  it("códigos desconocidos salen legibles, nunca crudos", () => {
    expect(roleLabel("some_new_role")).toBe("Some new role")
    expect(auditActionLabel("foo.bar_baz")).toBe("Foo bar baz")
  })

  it("sesiones de soporte con método HTTP", () => {
    expect(auditActionLabel("impersonation.write.patch")).toBe("Durante una sesión de soporte modificó información")
  })
})

describe("auditSentence", () => {
  it("arma la frase con quién, qué y sobre qué", () => {
    expect(auditSentence({ action: "billing.subscription.cancel", actorName: "Ana Pérez", targetName: "Panadería La Esquina" }))
      .toBe("Ana Pérez canceló la suscripción de Panadería La Esquina")
  })
  it("omite el objetivo si falta o la acción no lo admite", () => {
    expect(auditSentence({ action: "billing.subscription.cancel", actorName: "Ana" })).toBe("Ana canceló la suscripción")
    expect(auditSentence({ action: "security.login", actorName: "Ana", targetName: "X" })).toBe("Ana inició sesión")
  })
  it("sin nombre de quien actúa usa «Un usuario»", () => {
    expect(auditSentence({ action: "security.login" })).toBe("Un usuario inició sesión")
  })
})

describe("límites de membresía", () => {
  it("formatea valores", () => {
    expect(formatFeatureValue("max_users", true, null)).toBe("Ilimitado")
    expect(formatFeatureValue("max_recipes", true, 50)).toBe("50 recetas")
    expect(formatFeatureValue("exports", true, null)).toBe("Incluido")
    expect(formatFeatureValue("max_menus", false, 3)).toBe("No incluido")
  })
  it("valida lo escrito", () => {
    expect(parseLimitInput("")).toEqual({ ok: true, value: null })
    expect(parseLimitInput(" 12 ")).toEqual({ ok: true, value: 12 })
    expect(parseLimitInput("-3").ok).toBe(false)
    expect(parseLimitInput("2.5").ok).toBe(false)
    expect(parseLimitInput("abc").ok).toBe(false)
    expect(parseLimitInput("99999999").ok).toBe(false)
  })
})
