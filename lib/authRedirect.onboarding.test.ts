import { describe, it, expect, vi } from "vitest"
import {
  buildOnboardingUrl,
  needsOnboarding,
  resolveAuthenticatedDestination,
  decideOnboardingPage,
  resolveOnboardingFinishPath,
  fetchOrgState,
  fetchLmsHome,
  lmsHomeFor,
  isLearnPath,
  type OrgState,
} from "./authRedirect"

const noOrg: OrgState = { identityType: "tenant", hasOrganization: false, impersonationActive: false }
const withOrg: OrgState = { identityType: "tenant", hasOrganization: true, impersonationActive: false }
const platform: OrgState = { identityType: "platform", hasOrganization: false, impersonationActive: false }
const impersonating: OrgState = { identityType: "platform", hasOrganization: true, impersonationActive: true }

describe("buildOnboardingUrl", () => {
  it("conserva returnTo interno y descarta el resto", () => {
    expect(buildOnboardingUrl("/recetas?a=1")).toBe("/onboarding?returnTo=%2Frecetas%3Fa%3D1")
    expect(buildOnboardingUrl("/dashboard")).toBe("/onboarding?returnTo=%2Fdashboard")
    expect(buildOnboardingUrl(null)).toBe("/onboarding")
    expect(buildOnboardingUrl("//evil.com")).toBe("/onboarding")
    expect(buildOnboardingUrl("/onboarding?new=1")).toBe("/onboarding")
    expect(buildOnboardingUrl("/login")).toBe("/onboarding")
  })
})

describe("needsOnboarding", () => {
  it("fuerza solo a tenants sin organización", () => {
    expect(needsOnboarding(noOrg)).toBe(true)
    expect(needsOnboarding(withOrg)).toBe(false)
    expect(needsOnboarding(platform)).toBe(false)
    expect(needsOnboarding(impersonating)).toBe(false)
    expect(needsOnboarding({ ...noOrg, impersonationActive: true })).toBe(false)
  })
})

describe("resolveAuthenticatedDestination", () => {
  it("con una invitación pendiente no manda al onboarding (el negocio es al que lo invitaron)", () => {
    const dest = "/accept-invitation/e67f72dc-b17d-42aa-af51-d508049be43e?auto=1"
    expect(resolveAuthenticatedDestination(noOrg, dest)).toBe(dest)
  })

  it("sin org → onboarding con returnTo (compra pendiente incluida)", () => {
    expect(resolveAuthenticatedDestination(noOrg, "/dashboard")).toBe("/onboarding?returnTo=%2Fdashboard")
    expect(resolveAuthenticatedDestination(noOrg, "/checkout?plan=pro")).toBe(
      "/onboarding?returnTo=%2Fcheckout%3Fplan%3Dpro",
    )
  })
  it("las rutas de aprendizaje no exigen negocio (cursos independientes)", () => {
    for (const dest of ["/mis-cursos", "/aprender/costeo", "/aprender/costeo?l=2", "/evaluacion/abc", "/certificados/xyz", "/cursos/costeo"]) {
      expect(resolveAuthenticatedDestination(noOrg, dest)).toBe(dest)
    }
  })

  it("no confunde rutas parecidas con rutas de aprendizaje", () => {
    expect(resolveAuthenticatedDestination(noOrg, "/mis-cursos-falso")).toBe("/onboarding?returnTo=%2Fmis-cursos-falso")
  })

  it("quien tiene cursos activos y no negocio, sin destino propio, va a mis cursos", () => {
    expect(resolveAuthenticatedDestination(noOrg, "/dashboard", { hasActiveCourses: true })).toBe("/inicio")
    // un destino explícito distinto del dashboard por defecto se respeta (pasa por onboarding)
    expect(resolveAuthenticatedDestination(noOrg, "/checkout?plan=pro", { hasActiveCourses: true })).toBe(
      "/onboarding?returnTo=%2Fcheckout%3Fplan%3Dpro",
    )
    // con negocio no cambia nada
    expect(resolveAuthenticatedDestination(withOrg, "/dashboard", { hasActiveCourses: true })).toBe("/dashboard")
  })

  it("instructores y administradores del LMS sin negocio entran a su zona, no al onboarding", () => {
    expect(resolveAuthenticatedDestination(noOrg, "/dashboard", { lmsHome: "/instructor" })).toBe("/instructor")
    expect(resolveAuthenticatedDestination(noOrg, "/dashboard", { lmsHome: "/administracion", hasActiveCourses: true })).toBe("/administracion")
    // un destino propio distinto del dashboard por defecto se respeta (como con los cursos)
    expect(resolveAuthenticatedDestination(noOrg, "/checkout?plan=pro", { lmsHome: "/instructor" })).toBe("/onboarding?returnTo=%2Fcheckout%3Fplan%3Dpro")
    // con negocio no cambia nada
    expect(resolveAuthenticatedDestination(withOrg, "/dashboard", { lmsHome: "/instructor" })).toBe("/dashboard")
    // y las rutas del LMS nunca pasan por onboarding
    for (const d of ["/instructor", "/instructor/abc?tab=students", "/administracion", "/administracion/auditoria"]) {
      expect(isLearnPath(d), d).toBe(true)
      expect(resolveAuthenticatedDestination(noOrg, d)).toBe(d)
    }
    expect(isLearnPath("/administracionx")).toBe(false)
  })

  it("lmsHomeFor: administrador > instructor > nada", () => {
    expect(lmsHomeFor({ isAdmin: true, isInstructor: true })).toBe("/administracion")
    expect(lmsHomeFor({ isAdmin: false, isInstructor: true })).toBe("/instructor")
    expect(lmsHomeFor({ isAdmin: false, isInstructor: false })).toBeNull()
    expect(lmsHomeFor(undefined)).toBeNull()
  })

  it("con membresías pero sin organización activa no se fuerza a crear otro negocio", () => {
    const suspended: OrgState = { ...noOrg, hasMemberships: true }
    expect(needsOnboarding(suspended)).toBe(false)
    expect(resolveAuthenticatedDestination(suspended, "/dashboard")).toBe("/dashboard")
  })

  it("con org o plataforma → destino intacto", () => {
    expect(resolveAuthenticatedDestination(withOrg, "/recetas")).toBe("/recetas")
    expect(resolveAuthenticatedDestination(platform, "/plataforma")).toBe("/plataforma")
  })
})

describe("decideOnboardingPage", () => {
  it("?new=1 siempre muestra el formulario", () => {
    expect(decideOnboardingPage(withOrg, true)).toBe("show")
  })
  it("con org y sin ?new=1 va al destino", () => {
    expect(decideOnboardingPage(withOrg, false)).toBe("dashboard")
  })
  it("sin org muestra el formulario", () => {
    expect(decideOnboardingPage(noOrg, false)).toBe("show")
  })
  it("plataforma va a la consola salvo impersonación", () => {
    expect(decideOnboardingPage(platform, false)).toBe("platform")
    expect(decideOnboardingPage(impersonating, false)).toBe("dashboard")
  })
})

describe("resolveOnboardingFinishPath", () => {
  it("returnTo seguro o dashboard", () => {
    expect(resolveOnboardingFinishPath("/recetas")).toBe("/recetas")
    expect(resolveOnboardingFinishPath(null)).toBe("/dashboard")
    expect(resolveOnboardingFinishPath("https://evil.com")).toBe("/dashboard")
    expect(resolveOnboardingFinishPath("/onboarding")).toBe("/dashboard")
  })
})

describe("fetchLmsHome", () => {
  const mk = (status: number, body?: unknown) =>
    vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as typeof fetch
  it("devuelve la portada según el rol y null ante cualquier fallo (nunca bloquea el login)", async () => {
    expect(await fetchLmsHome("http://api", mk(200, { data: { isAdmin: false, isInstructor: true } }))).toBe("/instructor")
    expect(await fetchLmsHome("http://api", mk(200, { data: { isAdmin: true, isInstructor: true } }))).toBe("/administracion")
    expect(await fetchLmsHome("http://api", mk(200, { data: { isAdmin: false, isInstructor: false } }))).toBeNull()
    expect(await fetchLmsHome("http://api", mk(401))).toBeNull()
    expect(await fetchLmsHome("http://api", vi.fn().mockRejectedValue(new Error("x")) as unknown as typeof fetch)).toBeNull()
  })
})

describe("fetchOrgState", () => {
  const mk = (status: number, body?: unknown) =>
    vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as typeof fetch
  it("interpreta el contexto", async () => {
    const r = await fetchOrgState("http://api", mk(200, { data: { identityType: "tenant", organization: null, impersonation: null } }))
    expect(r).toEqual({ status: "ok", state: { identityType: "tenant", hasOrganization: false, impersonationActive: false, hasMemberships: false } })
    // organización no activa pero con pertenencias: no es un usuario "sin negocio"
    const r3 = await fetchOrgState("http://api", mk(200, { data: { identityType: "tenant", organization: null, memberships: [{ id: "m" }], impersonation: null } }))
    expect(r3).toMatchObject({ status: "ok", state: { hasOrganization: false, hasMemberships: true } })
    const r2 = await fetchOrgState("http://api", mk(200, { data: { identityType: "tenant", organization: { id: "1" }, impersonation: { active: true } } }))
    expect(r2).toMatchObject({ status: "ok", state: { hasOrganization: true, impersonationActive: true } })
  })
  it("401 → invalid; 500/red → unknown", async () => {
    expect(await fetchOrgState("http://api", mk(401))).toEqual({ status: "invalid" })
    expect(await fetchOrgState("http://api", mk(500))).toEqual({ status: "unknown" })
    const boom = vi.fn().mockRejectedValue(new Error("x")) as unknown as typeof fetch
    expect(await fetchOrgState("http://api", boom)).toEqual({ status: "unknown" })
  })
})
