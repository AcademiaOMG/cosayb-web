import { fmtDate } from "@/lib/saas/format"

/**
 * Certificado imprimible (HTML/CSS + SVG, A4 horizontal). Todo el texto del usuario se renderiza escapado.
 * Colores: tokens del proyecto (--accent*) y neutros; sin dependencias externas.
 */
export default function CertificateArt({ name, course, issuedAt, code, verifyUrl }: { name: string; course: string; issuedAt: string; code: string; verifyUrl: string }) {
  return (
    <article className="l-cert relative mx-auto w-full max-w-[1000px] overflow-hidden bg-white p-3 shadow-[0_30px_70px_rgba(18,33,58,.18)] sm:p-5" style={{ aspectRatio: "297 / 210", borderRadius: 24 }} aria-label={`Certificado de ${name}`}>
      <div className="relative flex h-full flex-col items-center justify-between overflow-hidden rounded-[16px] px-5 py-6 text-center sm:px-14 sm:py-10" style={{ border: "2px solid var(--accent)", background: "linear-gradient(180deg, #fff 0%, color-mix(in srgb, var(--accent) 5%, white) 100%)" }}>
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 700" preserveAspectRatio="none">
          <g fill="none" stroke="var(--accent)" strokeOpacity=".18">
            {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx="0" cy="0" r={90 + i * 26} />)}
            {[0, 1, 2, 3, 4, 5].map((i) => <circle key={`b${i}`} cx="1000" cy="700" r={90 + i * 26} />)}
          </g>
          <path d="M40 40h70M40 40v70M960 40h-70M960 40v70M40 660h70M40 660v-70M960 660h-70M960 660v-70" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>

        <div className="relative flex flex-col items-center gap-1">
          <span className="text-[10px] font-extrabold tracking-[0.4em] sm:text-xs" style={{ color: "var(--accent)" }}>ACADEMIA OMG</span>
          <h1 className="text-xl font-extrabold sm:text-4xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif", color: "var(--text-primary)", letterSpacing: "0.02em" }}>Certificado de aprobación</h1>
        </div>

        <div className="relative flex flex-col items-center gap-1 sm:gap-2">
          <p className="text-xs sm:text-sm" style={{ color: "var(--l-muted)" }}>Se otorga a</p>
          <p className="break-words text-2xl font-extrabold italic sm:text-5xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif", color: "var(--text-primary)" }}>{name}</p>
          <span aria-hidden="true" className="my-1 h-[3px] w-24 rounded-full" style={{ background: "var(--accent)" }} />
          <p className="text-xs sm:text-sm" style={{ color: "var(--l-muted)" }}>por completar y aprobar el curso</p>
          <p className="max-w-[90%] break-words text-base font-extrabold sm:text-2xl" style={{ color: "var(--accent-text)" }}>{course}</p>
        </div>

        <div className="relative grid w-full grid-cols-3 items-end gap-2 text-[10px] sm:text-xs">
          <div className="flex flex-col items-center gap-1">
            <span className="text-base italic sm:text-2xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif", color: "var(--text-primary)" }}>Academia OMG</span>
            <span className="h-px w-full max-w-[160px]" style={{ background: "var(--text-primary)" }} />
            <span style={{ color: "var(--l-muted)" }}>Dirección académica</span>
          </div>
          <div className="flex flex-col items-center">
            <svg aria-hidden="true" viewBox="0 0 100 100" className="h-14 w-14 sm:h-24 sm:w-24">
              <circle cx="50" cy="50" r="46" fill="var(--accent)" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" strokeOpacity=".7" strokeDasharray="2 4" strokeWidth="2" />
              <path d="M34 52l12 12 22-26" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>Emitido el {fmtDate(issuedAt)}</span>
            <span className="h-px w-full max-w-[160px]" style={{ background: "var(--text-primary)" }} />
            <span style={{ color: "var(--l-muted)" }}>Fecha de emisión</span>
          </div>
        </div>

        <p className="relative mt-2 break-all text-[9px] sm:text-xs" style={{ color: "var(--l-muted)" }}>
          Código de verificación <strong className="font-mono" style={{ color: "var(--text-primary)" }}>{code}</strong> · {verifyUrl}
        </p>
      </div>
    </article>
  )
}
