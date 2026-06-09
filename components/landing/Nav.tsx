import Link from "next/link"

export default function Nav() {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 mx-auto w-full max-w-6xl"
      style={{ background: "var(--bg-primary)" }}
    >
      <Link href="/" className="font-display text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        CO$AYB
      </Link>
      <nav className="hidden md:flex items-center gap-8" aria-label="Navegación principal">
        {["Módulos", "Precios", "Testimonios"].map((item) => (
          <Link
            key={item}
            href={`#${item.toLowerCase()}`}
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            {item}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Iniciar sesión
        </Link>
        <Link
          href="/login"
          className="h-9 px-4 rounded-xl text-sm font-semibold flex items-center"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Empieza gratis
        </Link>
      </div>
    </header>
  )
}
