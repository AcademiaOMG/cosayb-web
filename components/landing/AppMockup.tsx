import { CheckCircle } from "lucide-react"

const features = [
  "Costo de materia prima calculado automáticamente",
  "Indicadores MUY BUENO / ACEPTABLE / REVISAR",
  "Exporta el análisis completo a PDF",
]

export default function AppMockup() {
  return (
    <section id="demo" className="bg-[#12213A] py-20 sm:py-28 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Left column */}
        <div>
          <span className="inline-block text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-6 text-[#8FA0BC]"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            Así se ve en acción
          </span>
          <h2
            className="font-display font-bold text-[#F5F0E8] mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Del costo real al precio correcto en segundos
          </h2>
          <p className="font-body text-[#8FA0BC] mb-8">
            Ingresa tus ingredientes, construye tu receta y CO$AYB te entrega el precio de venta
            sugerido al instante.
          </p>
          <ul className="flex flex-col gap-4">
            {features.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle size={18} className="text-[#1B4FD8] shrink-0 mt-0.5" />
                <span className="font-body text-sm text-[#8FA0BC]">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column — App UI mock */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "#1E2A3A",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <span className="font-body font-semibold text-[#F5F0E8] text-sm">
              Valoración — Pollo Roll
            </span>
            <span className="bg-[#1B4FD8] text-white text-xs px-2 py-0.5 rounded font-body font-semibold">
              Pro
            </span>
          </div>

          {/* Data row 1 */}
          <div
            className="flex justify-between items-center py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="font-body text-sm text-[#8FA0BC]">Costo materia prima</span>
            <span className="font-mono font-bold text-[#F5F0E8]">$ 954</span>
          </div>

          {/* Data row 2 */}
          <div
            className="flex justify-between items-center py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="font-body text-sm text-[#8FA0BC]">% Materia prima</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#4CAF82]">28.6%</span>
              <span className="bg-[#E6F5ED] text-[#1A7A4A] text-[10px] font-semibold px-2 py-0.5 rounded">
                MUY BUENO
              </span>
            </div>
          </div>

          {/* Data row 3 */}
          <div className="flex justify-between items-center py-3">
            <span className="font-body text-sm text-[#8FA0BC]">% Costos fijos</span>
            <span className="font-mono font-bold text-[#F5F0E8]">15%</span>
          </div>

          {/* Bottom */}
          <div
            className="flex justify-between items-center mt-3 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div>
              <div className="font-body text-xs text-[#8FA0BC]">Precio sugerido de venta</div>
              <div className="font-mono font-bold text-[#F5F0E8] text-2xl">$ 3.339</div>
            </div>
            <button className="bg-[#1B4FD8] text-white text-xs px-4 py-2 rounded-lg font-body font-semibold hover:bg-[#1540B0] transition-colors">
              Exportar PDF
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
