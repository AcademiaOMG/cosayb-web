import {
  LayoutDashboard, Building2, Users, Drama, ChefHat, Carrot, ScrollText,
  Repeat, Wallet, LifeBuoy, CreditCard, History, BarChart3, ShieldAlert, GraduationCap,
  type LucideIcon,
} from "lucide-react"

/**
 * Navegación del panel de la plataforma: fuente única para la barra lateral, el menú móvil
 * y las migas de pan. Lógica pura (sin React) para poder probarla.
 */

export interface NavSection {
  href: string
  label: string
  icon: LucideIcon
  /** Roles de plataforma que ven esta sección (misma regla de visibilidad de siempre). */
  roles: string[]
}

export interface NavGroup {
  label: string
  items: NavSection[]
}

const ROOT = "/plataforma"

/** Grupos por área, en el orden en que se muestran. Los roles NO cambian respecto a la versión anterior. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      {
        href: ROOT, label: "Resumen", icon: LayoutDashboard,
        roles: ["platform_owner", "platform_admin", "platform_auditor", "platform_readonly"],
      },
    ],
  },
  {
    label: "Clientes",
    items: [
      {
        href: "/plataforma/organizaciones", label: "Organizaciones", icon: Building2,
        roles: ["platform_owner", "platform_admin", "platform_support", "platform_billing", "platform_readonly"],
      },
      {
        href: "/plataforma/usuarios", label: "Usuarios", icon: Users,
        roles: ["platform_owner", "platform_admin", "platform_support", "platform_readonly"],
      },
    ],
  },
  {
    label: "Ingresos",
    items: [
      {
        href: "/plataforma/suscripciones", label: "Suscripciones", icon: Repeat,
        roles: ["platform_owner", "platform_admin", "platform_billing", "platform_readonly"],
      },
      {
        href: "/plataforma/pagos", label: "Pagos", icon: Wallet,
        roles: ["platform_owner", "platform_admin", "platform_billing", "platform_readonly"],
      },
      {
        href: "/plataforma/membresias", label: "Membresías", icon: CreditCard,
        roles: ["platform_owner", "platform_admin", "platform_billing", "platform_readonly"],
      },
    ],
  },
  {
    label: "Actividad",
    items: [
      {
        href: "/plataforma/accesos", label: "Accesos", icon: History,
        roles: ["platform_owner", "platform_admin", "platform_auditor", "platform_readonly"],
      },
      {
        href: "/plataforma/analitica", label: "Analítica de uso", icon: BarChart3,
        roles: ["platform_owner", "platform_admin", "platform_readonly"],
      },
      {
        href: "/plataforma/vigilancia", label: "Vigilancia", icon: ShieldAlert,
        roles: ["platform_owner", "platform_admin", "platform_auditor"],
      },
    ],
  },
  {
    label: "Atención",
    items: [
      {
        href: "/plataforma/soporte", label: "Soporte", icon: LifeBuoy,
        roles: ["platform_owner", "platform_admin", "platform_support"],
      },
    ],
  },
  {
    label: "Catálogo",
    items: [
      {
        href: "/plataforma/banco/recetas", label: "Banco de recetas", icon: ChefHat,
        roles: ["platform_owner", "platform_admin", "platform_chef"],
      },
      {
        href: "/plataforma/banco/ingredientes", label: "Banco de ingredientes", icon: Carrot,
        roles: ["platform_owner", "platform_admin", "platform_chef"],
      },
    ],
  },
  {
    label: "Academia",
    items: [
      {
        href: "/plataforma/academia", label: "Academia", icon: GraduationCap,
        roles: ["platform_owner", "platform_admin", "platform_auditor", "platform_readonly"],
      },
    ],
  },
  {
    label: "Seguridad",
    items: [
      {
        href: "/plataforma/roles", label: "Roles y permisos", icon: Drama,
        roles: ["platform_owner"],
      },
      {
        href: "/plataforma/auditoria", label: "Auditoría", icon: ScrollText,
        roles: ["platform_owner", "platform_admin", "platform_auditor", "platform_readonly"],
      },
    ],
  },
]

/** Todas las secciones en orden plano. */
export const SECTIONS: NavSection[] = NAV_GROUPS.flatMap((g) => g.items)

/** ¿Alguno de los roles del usuario ve esta sección? */
export function canSee(section: NavSection, platformRoles: string[]): boolean {
  return section.roles.some((r) => platformRoles.includes(r))
}

/** Grupos con solo las secciones visibles para esos roles (los grupos vacíos se omiten). */
export function visibleGroups(platformRoles: string[]): NavGroup[] {
  return NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((s) => canSee(s, platformRoles)) }))
    .filter((g) => g.items.length > 0)
}

/** Primera sección visible para un conjunto de roles (landing de la consola). */
export function firstSectionFor(roles: string[]): string {
  const section = SECTIONS.find((s) => canSee(s, roles))
  return section?.href ?? ROOT
}

/** ¿La ruta actual pertenece a la sección? (el resumen solo coincide exacto). */
export function isSectionActive(pathname: string, href: string): boolean {
  return href === ROOT ? pathname === ROOT : pathname.startsWith(href)
}

/** Sección a la que pertenece una ruta (la más específica). */
export function sectionForPath(pathname: string): NavSection | undefined {
  return [...SECTIONS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((s) => isSectionActive(pathname, s.href))
}

/**
 * ¿Hay que redirigir al landing propio del rol? Solo cuando entra a /plataforma y su rol no ve el resumen.
 * Devuelve el destino o null.
 */
export function landingRedirect(pathname: string, platformRoles: string[]): string | null {
  if (platformRoles.length === 0) return null
  const current = SECTIONS.find(
    (s) => pathname === s.href || (s.href !== ROOT && pathname.startsWith(s.href)),
  )
  if (pathname === ROOT && current && !canSee(current, platformRoles)) {
    return firstSectionFor(platformRoles)
  }
  return null
}

export interface Crumb {
  label: string
  /** Sin href = página actual. */
  href?: string
}

const SUB_LABELS: Record<string, string> = { nuevo: "Nuevo", nueva: "Nueva", editar: "Editar", usuarios: "Usuarios" }

/** Migas de pan: Plataforma › [Área] › Sección › (Detalle). Los identificadores se muestran como «Detalle». */
export function breadcrumbsFor(pathname: string): Crumb[] {
  const clean = pathname.replace(/\/+$/, "") || ROOT
  const crumbs: Crumb[] = [{ label: "Plataforma", href: ROOT }]
  const section = sectionForPath(clean)
  if (!section) return [...crumbs, { label: "Página no encontrada" }]
  // «Plataforma › Resumen» sería redundante: se deja solo «Resumen»
  if (section.href === ROOT) return [{ label: "Resumen" }]
  const group = NAV_GROUPS.find((g) => g.items.includes(section))
  if (group && group.label !== "General") crumbs.push({ label: group.label })
  const rest = clean.slice(section.href.length).split("/").filter(Boolean)
  if (rest.length === 0) {
    crumbs.push({ label: section.label })
    return crumbs
  }
  crumbs.push({ label: section.label, href: section.href })
  crumbs.push({ label: SUB_LABELS[rest[0]] ?? "Detalle" })
  return crumbs
}
