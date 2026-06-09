import Link from "next/link"

export default function CTAFinal() {
  return (
    <section
      className="px-6 py-24 flex flex-col items-center text-center"
      style={{ background: "var(--bg-inverse)" }}
    >
      <h2
        className="font-display text-5xl font-bold mb-4 max-w-2xl"
        style={{ color: "#fff" }}
      >
        Tu cocina merece números exactos
      </h2>
      <p
        className="text-lg mb-10 max-w-xl"
        style={{ color: "#8FA0BC" }}
      >
        Empieza gratis hoy. Sin tarjeta de crédito. Sin letra chica.
      </p>
      <Link
        href="/login"
        className="h-14 px-10 rounded-xl text-base font-semibold flex items-center"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        Empezar ahora — es gratis
      </Link>
    </section>
  )
}
