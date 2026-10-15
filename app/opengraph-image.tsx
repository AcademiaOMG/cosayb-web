import { ImageResponse } from "next/og"

export const alt = "CO$AYB — Software de costos de alimentos y bebidas"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Imagen de previsualización social generada en build (no depende de un archivo estático)
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #0D1829 0%, #12213A 60%, #1B4FD8 140%)",
          color: "#F5F0E8",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -2 }}>CO$AYB</div>
        <div style={{ fontSize: 52, marginTop: 16, color: "#7AAEFF" }}>Costos de alimentos y bebidas</div>
        <div style={{ fontSize: 34, marginTop: 40, color: "#C8D5E8" }}>
          Calcula el costo real de cada receta y el precio exacto de venta.
        </div>
        <div style={{ fontSize: 28, marginTop: 56, color: "#8FA0BC" }}>Academia OMG · Colombia</div>
      </div>
    ),
    size,
  )
}
