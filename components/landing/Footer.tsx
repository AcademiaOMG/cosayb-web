import Link from "next/link"

export default function Footer() {
  return (
    <footer
      className="px-6 py-10"
      style={{ borderTop: "1px solid var(--border-light)" }}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span
          className="font-display text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          CO$AYB
        </span>
        <div className="flex items-center gap-6">
          {[
            { label: "Términos", href: "/terminos" },
            { label: "Privacidad", href: "/privacidad" },
            { label: "Contacto", href: "mailto:hola@academiaomg.com" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
            </Link>
          ))}
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} Academia OMG
        </p>
      </div>
    </footer>
  )
}
