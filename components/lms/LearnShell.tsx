"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import useSWR from "swr"
import { Award, BarChart3, Bell, BookOpen, ChevronsLeft, ChevronsRight, ClipboardCheck, Compass, GraduationCap, HelpCircle, Home, LayoutDashboard, Library, ScrollText, Search, Settings2, ShieldCheck, Store, UserCog, Users } from "lucide-react"
import { authClient } from "@/lib/auth"
import { buildLoginUrl } from "@/lib/authRedirect"
import { fetchAPI } from "@/lib/api"
import { useLmsAccess, useSummary } from "@/lib/lms/hooks"
import { ADMIN_NAV, INSTRUCTOR_NAV, areaRedirect, isNavActive, type Area, type NavEntry } from "@/lib/lms/roles"
import { AreaProvider } from "./shell/area"
import UserMenu from "./shell/UserMenu"
import DisabledNotice from "./shell/DisabledNotice"
import SignInRequired from "./SignInRequired"
import { Skeleton } from "./ui"

type Item = { href: string; label: string; short?: string; icon: typeof Home; auth?: boolean }

const NAV: Item[] = [
  { href: "/inicio", label: "Inicio", icon: Home, auth: true },
  { href: "/mis-cursos", label: "Mis cursos", short: "Cursos", icon: GraduationCap, auth: true },
  { href: "/cursos", label: "Catálogo", icon: Compass },
  { href: "/evaluaciones", label: "Evaluaciones", short: "Quizzes", icon: ClipboardCheck, auth: true },
  { href: "/certificados", label: "Certificados", short: "Diplomas", icon: Award, auth: true },
]
const EXTRA: Item[] = [
  { href: "/verificar", label: "Verificar certificado", icon: ShieldCheck },
  { href: "/ayuda-cursos", label: "Ayuda", icon: HelpCircle },
]

const COLLAPSE_KEY = "lms.sidebar.collapsed"

const ICON: Record<string, typeof Home> = {
  "/instructor": LayoutDashboard,
  "/instructor/cursos": Library,
  "/instructor/estudiantes": Users,
  "/instructor/evaluaciones": ClipboardCheck,
  "/instructor/analitica": BarChart3,
  "/administracion": LayoutDashboard,
  "/administracion/cursos": Library,
  "/administracion/usuarios": UserCog,
  "/administracion/matriculas": Users,
  "/administracion/certificados": Award,
  "/administracion/reportes": BarChart3,
  "/administracion/auditoria": ScrollText,
  "/administracion/ajustes": Settings2,
}
const toItem = (n: NavEntry): Item => ({ href: n.href, label: n.label, short: n.short, icon: ICON[n.href] ?? Home })

const AREA_TITLE: Record<Area, string> = { student: "Academia OMG", instructor: "Academia OMG", admin: "Academia OMG" }
const AREA_BADGE: Record<Area, string | null> = { student: null, instructor: "Instructor", admin: "Administración" }

/**
 * Shell de UN área del LMS. Cada área (estudiante, instructor, administrador) monta su propio shell con su menú y
 * su portada: no hay menús mezclados ni selector de «ver como». Quien entra a un área que no es la suya es
 * redirigido a la portada de su rol (el servidor además responde 403 a sus endpoints).
 */
export default function LearnShell({ area, children }: { area: Area; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [q, setQ] = useState("")
  const [bellAt, setBellAt] = useState<string | null>(null)
  const bell = bellAt === pathname // se cierra solo al navegar
  // El SWRProvider global cambia de caché justo tras hidratar; montar las páginas un frame después evita
  // que sus peticiones se escriban en el caché anterior (quedarían en "cargando" tras una recarga dura).
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  const student = area === "student"
  const cinema = student && pathname.startsWith("/aprender/")

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de localStorage tras hidratar (evita desajuste SSR)
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1")
    } catch {
      /* sin almacenamiento: queda expandido */
    }
  }, [])

  const { data: ctx } = useSWR(student && session && ready ? "lms/shell/ctx" : null, () => fetchAPI<{ data?: { memberships?: unknown[] } }>("/api/v1/me/context"), { revalidateOnFocus: false, shouldRetryOnError: false })
  // Roles del LMS: solo organizan la vista; el servidor vuelve a comprobarlos en cada petición
  const { data: access, error: accessError } = useLmsAccess(Boolean(session) && ready)
  const { data: summary } = useSummary(student && Boolean(session) && ready)
  const hasBusiness = Array.isArray(ctx?.data?.memberships) && ctx.data.memberships.length > 0
  const mini = collapsed || cinema

  const away = session ? areaRedirect(area, access, pathname) : null
  useEffect(() => {
    if (away) router.replace(away)
  }, [away, router])

  const items: Item[] = area === "instructor" ? INSTRUCTOR_NAV.map(toItem) : area === "admin" ? ADMIN_NAV.map(toItem) : NAV.filter((n) => !n.auth || session)
  const mobileItems = (student && !session ? [...items, ...EXTRA] : items).slice(0, 5)
  const isActiveItem = (href: string) => (student ? pathname === href || pathname.startsWith(`${href}/`) : isNavActive(pathname, href))
  const name = session?.user?.name ?? ""
  const pending = summary?.upcoming.length ?? 0
  const home = student ? (session ? "/inicio" : "/cursos") : area === "admin" ? "/administracion" : "/instructor"

  function toggle() {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1")
      } catch {
        /* ignorar */
      }
      return !c
    })
  }

  function search(e: React.FormEvent) {
    e.preventDefault()
    router.push(q.trim() ? `/cursos?q=${encodeURIComponent(q.trim())}` : "/cursos")
  }

  const navLink = (n: Item, compact?: boolean) => {
    const Icon = n.icon
    return (
      <Link key={n.href} href={n.href} className="l-nav-item" aria-current={isActiveItem(n.href) ? "page" : undefined} title={compact ? n.label : undefined} aria-label={compact ? n.label : undefined} style={compact ? { justifyContent: "center", padding: 0 } : undefined}>
        <Icon size={20} aria-hidden="true" />
        {!compact && <span>{n.label}</span>}
      </Link>
    )
  }

  // Áreas de gestión: solo para cuentas con sesión. Sin sesión, a iniciar sesión (el proxy ya lo hace por cookie).
  const gate = !student && !isPending && !session
  const blocked = Boolean(away) || gate || (!student && !!session && !access && !accessError)

  return (
    <AreaProvider value={area}>
      <div className="lms-root">
        <a href="#lms-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:font-bold">
          Saltar al contenido
        </a>

        {/* Sidebar (escritorio) */}
        <aside className="l-no-print fixed inset-y-0 left-0 z-30 hidden flex-col gap-1 border-r bg-white p-4 lg:flex" style={{ width: mini ? 84 : 264, borderColor: "var(--l-line)", transition: "width .3s cubic-bezier(.22,1,.36,1)" }} aria-label={student ? "Navegación del aprendizaje" : `Navegación de ${AREA_BADGE[area]?.toLowerCase()}`}>
          <Link href={home} className="mb-4 flex items-center gap-3 px-1" aria-label="Academia OMG">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}>
              <BookOpen size={20} aria-hidden="true" />
            </span>
            {!mini && <span className="text-lg font-extrabold">{AREA_TITLE[area]}</span>}
          </Link>
          {!student && !mini && <p className="px-3 pb-1 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--l-muted)" }}>{AREA_BADGE[area]}</p>}
          <nav className="flex flex-col gap-1" aria-label={student ? "Principal" : (AREA_BADGE[area] ?? "")}>
            {items.map((n) => navLink(n, mini))}
          </nav>
          <div className="mt-auto flex flex-col gap-1">
            {student && hasBusiness && (
              <Link href="/dashboard" className="l-nav-item" title="Ir a mi negocio" style={mini ? { justifyContent: "center", padding: 0 } : { background: "var(--l-amber-bg)", color: "var(--l-amber-ink)" }}>
                <Store size={20} aria-hidden="true" />
                {!mini && <span>Mi negocio (costeo)</span>}
              </Link>
            )}
            {student && EXTRA.map((n) => navLink(n, mini))}
            {!cinema && (
              <button type="button" onClick={toggle} className="l-nav-item" aria-label={collapsed ? "Expandir menú" : "Contraer menú"} aria-pressed={collapsed} style={{ background: "none", border: 0, cursor: "pointer", ...(mini ? { justifyContent: "center", padding: 0 } : {}) }}>
                {collapsed ? <ChevronsRight size={20} aria-hidden="true" /> : <ChevronsLeft size={20} aria-hidden="true" />}
                {!mini && <span>Contraer</span>}
              </button>
            )}
          </div>
        </aside>

        <div className={mini ? "lg:pl-[84px]" : "lg:pl-[264px]"}>
          {/* Topbar */}
          <header className="l-no-print sticky top-0 z-20 border-b backdrop-blur" style={{ background: "rgba(255,255,255,.88)", borderColor: "var(--l-line)" }}>
            <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
              <Link href={home} className="flex items-center gap-2 font-extrabold lg:hidden" aria-label="Academia OMG">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}>
                  <BookOpen size={18} aria-hidden="true" />
                </span>
              </Link>
              {student ? (
                <form onSubmit={search} role="search" className="relative min-w-0 max-w-xl flex-1">
                  <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--l-muted)" }} />
                  <input className="l-input" style={{ paddingLeft: 40, background: "var(--l-bg)", border: "1px solid transparent" }} type="search" placeholder="Buscar cursos…" aria-label="Buscar cursos" value={q} onChange={(e) => setQ(e.target.value)} />
                </form>
              ) : (
                <p className="min-w-0 flex-1 truncate text-sm font-extrabold" style={{ color: "var(--l-muted)" }}>{AREA_BADGE[area]}</p>
              )}
              <div className="ml-auto flex items-center gap-2">
                {session ? (
                  <>
                    {student && (
                      <div className="relative">
                        <button type="button" className="l-btn l-btn-ghost relative !min-h-10 !w-10 !px-0" aria-label={`Notificaciones${pending ? `, ${pending} pendientes` : ""}`} aria-expanded={bell} aria-haspopup="true" onClick={() => setBellAt(bell ? null : pathname)}>
                          <Bell size={18} aria-hidden="true" />
                          {pending > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full" style={{ background: "var(--l-rose)" }} />}
                        </button>
                        {bell && (
                          <div className="l-card l-rise absolute right-0 top-12 w-[min(92vw,340px)] p-3" role="menu" aria-label="Pendientes">
                            <p className="px-2 pb-2 text-sm font-extrabold">Pendientes</p>
                            {pending === 0 ? (
                              <p className="px-2 py-3 text-sm" style={{ color: "var(--l-muted)" }}>Estás al día. ¡Buen trabajo!</p>
                            ) : (
                              summary!.upcoming.slice(0, 5).map((u) => (
                                <Link key={`${u.kind}${u.id}`} role="menuitem" href={u.kind === "lesson" ? `/aprender/${u.courseSlug}?l=${u.id}` : `/evaluacion/${u.id}`} className="block rounded-xl px-2 py-2 text-sm hover:bg-[var(--l-bg)]">
                                  <span className="block font-bold">{u.title}</span>
                                  <span className="text-xs" style={{ color: "var(--l-muted)" }}>{u.kind === "lesson" ? "Siguiente lección" : "Evaluación pendiente"} · {u.courseTitle}</span>
                                </Link>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <UserMenu area={area} name={name} email={session.user?.email} access={access} />
                  </>
                ) : (
                  <Link href={buildLoginUrl(pathname)} className="l-btn l-btn-primary l-btn-sm">Ingresar</Link>
                )}
              </div>
            </div>
          </header>

          <main id="lms-main" className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 lg:pb-10" tabIndex={-1}>
            <div key={pathname} className="l-page">{gate ? <SignInRequired message="Inicia sesión para continuar." /> : ready && !blocked ? (access?.disabled ? <DisabledNotice hasBusiness={hasBusiness} /> : children) : <Skeleton className="h-96 !rounded-[22px]" />}</div>
          </main>
        </div>

        {/* Barra inferior (móvil) */}
        <nav className="l-no-print fixed inset-x-0 bottom-0 z-30 flex border-t bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden" style={{ borderColor: "var(--l-line)" }} aria-label={student ? "Principal (móvil)" : `${AREA_BADGE[area]} (móvil)`}>
          {mobileItems.map((n) => {
            const Icon = n.icon
            const on = isActiveItem(n.href)
            return (
              <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className="flex min-h-[58px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold" style={{ color: on ? "var(--l-brand)" : "var(--l-muted)" }}>
                <span className="inline-flex h-7 w-12 items-center justify-center rounded-full transition-colors" style={{ background: on ? "var(--l-brand-50)" : "transparent" }}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                {n.short ?? n.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </AreaProvider>
  )
}
