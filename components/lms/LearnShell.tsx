"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import useSWR from "swr"
import { Award, Bell, BookOpen, ChevronsLeft, ChevronsRight, ClipboardCheck, Compass, GraduationCap, HelpCircle, Home, LogOut, PenSquare, Search, ShieldCheck, Store } from "lucide-react"
import { authClient } from "@/lib/auth"
import { buildLoginUrl } from "@/lib/authRedirect"
import { fetchAPI } from "@/lib/api"
import { useSummary } from "@/lib/lms/hooks"
import { Avatar } from "./ui"

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

function useActive(pathname: string) {
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`)
}

/** Cabecera y navegación común del aprendizaje. No exige organización: basta una cuenta y una matrícula. */
export default function LearnShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = authClient.useSession()
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
  const isActive = useActive(pathname)
  const cinema = pathname.startsWith("/aprender/")

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de localStorage tras hidratar (evita desajuste SSR)
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1")
    } catch {
      /* sin almacenamiento: queda expandido */
    }
  }, [])

  const { data: ctx } = useSWR(session && ready ? "lms/shell/ctx" : null, () => fetchAPI<{ data?: { memberships?: unknown[]; platformPermissions?: string[] } }>("/api/v1/me/context"), { revalidateOnFocus: false, shouldRetryOnError: false })
  const { data: summary } = useSummary(Boolean(session) && ready)
  const hasBusiness = Array.isArray(ctx?.data?.memberships) && ctx.data.memberships.length > 0
  const mini = collapsed || cinema
  // El instructor gestiona sus cursos desde aquí, no desde la consola de plataforma
  const canTeach = Boolean(ctx?.data?.platformPermissions?.includes("list:platform_courses"))
  const items = NAV.filter((n) => !n.auth || session)
  const teach: Item = { href: "/instructor", label: "Estudio del instructor", short: "Instructor", icon: PenSquare, auth: true }
  const mobileItems = canTeach ? [...items.slice(0, 4), teach] : [...items, ...(session ? [] : EXTRA)].slice(0, 5)
  const name = session?.user?.name ?? ""
  const pending = summary?.upcoming.length ?? 0

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
      <Link key={n.href} href={n.href} className="l-nav-item" aria-current={isActive(n.href) ? "page" : undefined} title={compact ? n.label : undefined} aria-label={compact ? n.label : undefined} style={compact ? { justifyContent: "center", padding: 0 } : undefined}>
        <Icon size={20} aria-hidden="true" />
        {!compact && <span>{n.label}</span>}
      </Link>
    )
  }

  return (
    <div className="lms-root">
      <a href="#lms-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:font-bold">
        Saltar al contenido
      </a>

      {/* Sidebar (escritorio) */}
      <aside className="l-no-print fixed inset-y-0 left-0 z-30 hidden flex-col gap-1 border-r bg-white p-4 lg:flex" style={{ width: mini ? 84 : 264, borderColor: "var(--l-line)", transition: "width .3s cubic-bezier(.22,1,.36,1)" }} aria-label="Navegación del aprendizaje">
        <Link href={session ? "/inicio" : "/cursos"} className="mb-4 flex items-center gap-3 px-1" aria-label="Academia OMG">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}>
            <BookOpen size={20} aria-hidden="true" />
          </span>
          {!mini && <span className="text-lg font-extrabold">Academia OMG</span>}
        </Link>
        <nav className="flex flex-col gap-1" aria-label="Principal">
          {items.map((n) => navLink(n, mini))}
        </nav>
        {canTeach && (
          <div className="mt-3 flex flex-col gap-1 border-t pt-3" style={{ borderColor: "var(--l-line)" }}>
            {!mini && <p className="px-3 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--l-muted)" }}>Instructor</p>}
            navLink(teach, mini)
          </div>
        )}
        <div className="mt-auto flex flex-col gap-1">
          {hasBusiness && (
            <Link href="/dashboard" className="l-nav-item" title="Ir a mi negocio" style={mini ? { justifyContent: "center", padding: 0 } : { background: "var(--l-amber-bg)", color: "var(--l-amber-ink)" }}>
              <Store size={20} aria-hidden="true" />
              {!mini && <span>Mi negocio (costeo)</span>}
            </Link>
          )}
          {EXTRA.map((n) => navLink(n, mini))}
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
            <Link href={session ? "/inicio" : "/cursos"} className="flex items-center gap-2 font-extrabold lg:hidden" aria-label="Academia OMG">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}>
                <BookOpen size={18} aria-hidden="true" />
              </span>
            </Link>
            <form onSubmit={search} role="search" className="relative min-w-0 max-w-xl flex-1">
              <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--l-muted)" }} />
              <input className="l-input" style={{ paddingLeft: 40, background: "var(--l-bg)", border: "1px solid transparent" }} type="search" placeholder="Buscar cursos…" aria-label="Buscar cursos" value={q} onChange={(e) => setQ(e.target.value)} />
            </form>
            <div className="ml-auto flex items-center gap-2">
              {session ? (
                <>
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
                  <div className="flex items-center gap-2 pl-1">
                    <Avatar name={name || "U"} size={38} />
                    <span className="hidden max-w-[140px] truncate text-sm font-bold sm:inline">{name}</span>
                    <button type="button" className="l-btn l-btn-ghost !min-h-10 !w-10 !px-0" aria-label="Cerrar sesión" onClick={() => void authClient.signOut().then(() => router.push("/login"))}>
                      <LogOut size={17} aria-hidden="true" />
                    </button>
                  </div>
                </>
              ) : (
                <Link href={buildLoginUrl(pathname)} className="l-btn l-btn-primary l-btn-sm">Ingresar</Link>
              )}
            </div>
          </div>
        </header>

        <main id="lms-main" className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 lg:pb-10" tabIndex={-1}>
          <div key={pathname} className="l-page">{ready ? children : null}</div>
        </main>
      </div>

      {/* Barra inferior (móvil) */}
      <nav className="l-no-print fixed inset-x-0 bottom-0 z-30 flex border-t bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden" style={{ borderColor: "var(--l-line)" }} aria-label="Principal (móvil)">
        {mobileItems.map((n) => {
          const Icon = n.icon
          const on = isActive(n.href)
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
  )
}
