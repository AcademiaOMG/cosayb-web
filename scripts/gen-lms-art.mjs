// Genera los diagramas SVG originales de los cursos reales (public/lms-art/<curso>/<nombre>.svg).
// Uso: node scripts/gen-lms-art.mjs
// Todo es dibujo propio (sin fotos ni material de terceros), accesible (<title>/<desc>, role="img") y en el azul
// de la marca. Las lecciones los referencian con ![texto alternativo](/lms-art/<curso>/<nombre>.svg).
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "lms-art")
const C = {
  blue: "#1B4FD8", dark: "#1434A4", light: "#DEEAFF", pale: "#EEF4FF", ink: "#12213A", muted: "#566176", line: "#C9D6EE",
  amber: "#F59E0B", amberBg: "#FFF1D4", amberInk: "#7A4700", mint: "#22B573", mintBg: "#D9F6E6", mintInk: "#0F6B43",
  rose: "#F0527E", roseBg: "#FFE2EA", roseInk: "#A31D46", sky: "#3B8BF5", skyBg: "#DCECFF", white: "#FFFFFF",
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const rect = (x, y, w, h, { fill = C.white, stroke = C.line, r = 12, sw = 1.5 } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`
const text = (x, y, s, { size = 15, weight = 600, fill = C.ink, anchor = "start" } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`
const multi = (x, y, arr, o = {}) => arr.map((s, i) => text(x, y + i * ((o.size ?? 15) + 5), s, o)).join("")
/** Caja con texto centrado en varias líneas. */
const box = (x, y, w, h, arr, { fill = C.pale, stroke = C.line, tfill = C.ink, size = 15, weight = 700, r = 14 } = {}) => {
  const lh = size + 5
  const top = y + h / 2 - ((arr.length - 1) * lh) / 2 + size / 3
  return rect(x, y, w, h, { fill, stroke, r }) + arr.map((s, i) => text(x + w / 2, top + i * lh, s, { size, weight, fill: tfill, anchor: "middle" })).join("")
}
const arrow = (x1, y1, x2, y2, col = C.blue) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="3" stroke-linecap="round" marker-end="url(#ah)"/>`
const line = (x1, y1, x2, y2, col = C.line, sw = 2, dash = "") =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${sw}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`
const circle = (x, y, r, fill = C.blue) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`

function svg({ dir, name, w = 720, h = 360, title, desc, body }) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.blue}"/></marker></defs>
<rect width="${w}" height="${h}" rx="18" fill="${C.white}"/>
${body}
</svg>
`
  mkdirSync(join(OUT, dir), { recursive: true })
  writeFileSync(join(OUT, dir, `${name}.svg`), doc)
}
const head = (s, sub) => text(32, 44, s, { size: 22, weight: 800, fill: C.dark }) + (sub ? text(32, 68, sub, { size: 14, weight: 500, fill: C.muted }) : "")

// ───────────────────────── CURSO 1 · COSTEO ─────────────────────────
const D1 = "costeo"
svg({ dir: D1, name: "flujo-costeo", title: "Del ingrediente al precio de venta", desc: "Cinco pasos encadenados: ingredientes con su costo, rendimiento real, costo de la receta, costo por porción y precio de venta.",
  body: head("Del ingrediente al precio de venta", "Cada paso alimenta al siguiente: un error al inicio se arrastra hasta el precio.") +
    [["1", "Ingredientes", "y su costo de compra"], ["2", "Rendimiento", "merma y factor"], ["3", "Costo de la", "receta completa"], ["4", "Costo por", "porción"], ["5", "Precio de", "venta"]]
      .map((s, i) => box(24 + i * 138, 120, 120, 120, [s[1], s[2]], { fill: i === 4 ? C.blue : C.pale, tfill: i === 4 ? C.white : C.ink, size: 14 }) + circle(84 + i * 138, 120, 16, i === 4 ? C.dark : C.blue) + text(84 + i * 138, 126, s[0], { size: 16, weight: 800, fill: C.white, anchor: "middle" }) + (i < 4 ? arrow(146 + i * 138, 180, 160 + i * 138, 180) : "")).join("") +
    box(24, 270, 672, 56, ["Fórmula guía:  precio sin impuestos = costo por porción ÷ food cost objetivo"], { fill: C.amberBg, stroke: C.amber, tfill: C.amberInk, size: 15 }) })

svg({ dir: D1, name: "ficha-receta-estandar", title: "Anatomía de una ficha de receta estándar", desc: "Una ficha con encabezado, tabla de ingredientes con cantidad neta, merma y costo, método de preparación, rendimiento y costo por porción.",
  body: head("Anatomía de una ficha de receta estándar") +
    rect(32, 84, 656, 250, { fill: C.white, stroke: C.blue, sw: 2 }) +
    box(44, 96, 632, 34, ["ENCABEZADO · nombre, código, categoría, versión, fecha, responsable"], { fill: C.blue, tfill: C.white, size: 13, r: 8 }) +
    box(44, 138, 400, 112, ["TABLA DE INGREDIENTES", "ingrediente · cantidad neta · unidad · % merma", "cantidad bruta · costo unitario · costo total"], { fill: C.pale, size: 13, weight: 600, r: 8 }) +
    box(454, 138, 222, 112, ["RENDIMIENTO", "total de la receta", "número y peso de porciones"], { fill: C.mintBg, stroke: C.mint, tfill: C.mintInk, size: 13, weight: 600, r: 8 }) +
    box(44, 258, 400, 64, ["MÉTODO · pasos, tiempos, temperaturas, equipo", "puntos de control de calidad e inocuidad"], { fill: C.skyBg, tfill: C.ink, size: 13, weight: 600, r: 8 }) +
    box(454, 258, 222, 64, ["COSTO POR PORCIÓN", "y food cost del plato"], { fill: C.amberBg, stroke: C.amber, tfill: C.amberInk, size: 13, weight: 700, r: 8 }) })

svg({ dir: D1, name: "factor-rendimiento", title: "Peso bruto, merma y peso neto", desc: "Una barra de 1.000 g de peso bruto se divide en 780 g de peso neto aprovechable y 220 g de merma. El factor de rendimiento es 0,78.",
  body: head("Peso bruto, merma y peso neto", "Ejemplo: 1.000 g de pechuga con hueso y piel.") +
    rect(60, 110, 600, 54, { fill: C.line, stroke: C.line, r: 8 }) + `<rect x="60" y="110" width="468" height="54" rx="8" fill="${C.blue}"/>` + `<rect x="528" y="110" width="132" height="54" rx="8" fill="${C.rose}"/>` +
    text(294, 144, "Peso neto 780 g (aprovechable)", { size: 16, weight: 800, fill: C.white, anchor: "middle" }) + text(594, 144, "Merma 220 g", { size: 15, weight: 800, fill: C.white, anchor: "middle" }) +
    text(60, 100, "Peso bruto (PB) = 1.000 g", { size: 14, weight: 700, fill: C.muted }) +
    box(60, 196, 290, 74, ["Factor de rendimiento (FR)", "FR = PN ÷ PB = 780 ÷ 1.000 = 0,78"], { fill: C.pale, size: 15 }) +
    box(370, 196, 290, 74, ["% de merma", "= 1 − FR = 22 %"], { fill: C.roseBg, stroke: C.rose, tfill: C.roseInk, size: 15 }) +
    box(60, 286, 600, 46, ["Costo por kg neto = costo por kg bruto ÷ FR   (si el bruto cuesta $12.000/kg → $15.385/kg neto)"], { fill: C.amberBg, stroke: C.amber, tfill: C.amberInk, size: 14 }) })

svg({ dir: D1, name: "costo-total-plato", title: "Qué compone el costo de un plato", desc: "Barra apilada: materia prima 62 %, mano de obra directa 25 %, costos indirectos 13 %.",
  body: head("Qué compone el costo de un plato", "Ejemplo ilustrativo de un plato con costo total de $10.000.") +
    `<rect x="60" y="100" width="403" height="64" fill="${C.blue}"/><rect x="463" y="100" width="162" height="64" fill="${C.sky}"/><rect x="625" y="100" width="35" height="64" fill="${C.amber}"/>` +
    text(262, 138, "Materia prima  $6.200", { size: 16, weight: 800, fill: C.white, anchor: "middle" }) + text(544, 138, "Mano de obra $2.500", { size: 14, weight: 800, fill: C.white, anchor: "middle" }) +
    box(60, 190, 190, 78, ["Materia prima (MP)", "Ingredientes con merma", "62 %"], { fill: C.pale, size: 14 }) + box(265, 190, 190, 78, ["Mano de obra directa", "Tiempo de preparación", "25 %"], { fill: C.skyBg, size: 14 }) + box(470, 190, 190, 78, ["Costos indirectos", "Gas, energía, empaque…", "13 %  ($1.300)"], { fill: C.amberBg, stroke: C.amber, tfill: C.amberInk, size: 14 }) +
    box(60, 286, 600, 44, ["Costo total = MP + MOD + CIF = $6.200 + $2.500 + $1.300 = $10.000"], { fill: C.blue, tfill: C.white, size: 15 }) })

svg({ dir: D1, name: "precio-de-venta", title: "De costo por porción a precio de venta", desc: "Cálculo en tres pasos: precio sin impuesto igual al costo dividido entre el food cost objetivo, luego se suma el impuesto al consumo del 8 por ciento y se redondea.",
  body: head("De costo por porción a precio de venta", "Ejemplo: costo de ingredientes por porción $6.200 con food cost objetivo 31 %.") +
    box(32, 100, 200, 110, ["Paso 1", "Precio sin impuesto", "= $6.200 ÷ 0,31", "= $20.000"], { fill: C.pale, size: 15 }) + arrow(236, 155, 262, 155) +
    box(266, 100, 200, 110, ["Paso 2", "Impoconsumo 8 %", "= $20.000 × 0,08", "= $1.600"], { fill: C.amberBg, stroke: C.amber, tfill: C.amberInk, size: 15 }) + arrow(470, 155, 496, 155) +
    box(500, 100, 188, 110, ["Paso 3", "Precio en carta", "= $21.600", "→ redondea a $21.500"], { fill: C.blue, tfill: C.white, size: 15 }) +
    box(32, 240, 656, 82, ["Comprobación: $21.500 ÷ 1,08 = $19.907 sin impuesto → food cost real = 6.200 ÷ 19.907 = 31,1 %", "La propina voluntaria no hace parte de la base del impuesto (concepto DIAN)."], { fill: C.white, stroke: C.line, size: 14, weight: 600 }) })

svg({ dir: D1, name: "merma-pollo", title: "Del pollo entero al aprovechable", desc: "Cascada: 1.800 g de pollo entero, menos hueso y piel 612 g, menos grasa y recortes 90 g, igual 1.098 g de carne aprovechable, rendimiento 61 por ciento.",
  body: head("Prueba de rendimiento: pollo entero", "Se pesa en cada etapa; el factor de rendimiento sale de datos propios, no de tablas ajenas.") +
    [["Pollo entero", 1800, C.blue], ["Hueso y piel", -612, C.rose], ["Grasa y recortes", -90, C.amber], ["Carne aprovechable", 1098, C.mint]]
      .map((s, i) => { const x = 50 + i * 165; const hgt = Math.abs(s[1]) / 1800 * 190; const y = s[1] > 0 ? 290 - hgt : (i === 1 ? 100 : 100 + 612 / 1800 * 190); const y2 = s[1] > 0 ? 290 - hgt : (i === 1 ? 100 : 100 + 612 / 1800 * 190);
        return `<rect x="${x}" y="${y2}" width="120" height="${hgt}" rx="8" fill="${s[2]}"/>` + text(x + 60, y2 - 8, `${s[1] > 0 ? "" : "−"}${Math.abs(s[1]).toLocaleString("es-CO")} g`, { size: 15, weight: 800, anchor: "middle" }) + text(x + 60, 312, s[0], { size: 13, weight: 700, fill: C.muted, anchor: "middle" }) }).join("") +
    text(32, 340, "FR = 1.098 ÷ 1.800 = 0,61  →  merma 39 %", { size: 15, weight: 800, fill: C.dark }) })

// ───────────────────────── CURSO 2 · INVENTARIOS ─────────────────────────
const D2 = "inventarios"
svg({ dir: D2, name: "flujo-recepcion-produccion", title: "Flujo de los insumos en la cocina", desc: "Recepción, almacenamiento, requisición, producción y servicio, con los controles de cada etapa: verificar contra orden de compra, rotar PEPS, firmar vales de salida y registrar mermas.",
  body: head("Flujo de los insumos en la cocina", "Cada traspaso tiene un responsable y un registro.") +
    [["Recepción", "Pesar, verificar\ntemperatura y fecha"], ["Almacenamiento", "Ubicar y rotar\n(PEPS)"], ["Requisición", "Vale de salida\nfirmado"], ["Producción", "Receta estándar\ny porcionado"], ["Servicio", "Venta y\nregistro"]]
      .map((s, i) => box(20 + i * 140, 100, 124, 96, [s[0], ...s[1].split("\n")], { fill: i % 2 ? C.pale : C.skyBg, size: 13 }) + (i < 4 ? arrow(146 + i * 140, 148, 158 + i * 140, 148) : "")).join("") +
    box(32, 228, 656, 96, ["Controles clave", "Recepción: factura vs. orden de compra · Almacén: fecha y etiqueta · Cocina: vale de salida · Cierre: conteo físico", "Todo faltante se explica con un registro: venta, merma, devolución o consumo de personal"], { fill: C.amberBg, stroke: C.amber, tfill: C.amberInk, size: 13, weight: 600 }) })

svg({ dir: D2, name: "peps-estanteria", title: "PEPS en la estantería", desc: "Tres lotes de leche ordenados por fecha de ingreso y vencimiento; el más antiguo queda al frente y sale primero.",
  body: head("PEPS: primero en entrar, primero en salir", "El lote que llegó antes (y vence antes) queda al frente.") +
    rect(40, 100, 640, 150, { fill: C.pale, stroke: C.blue, sw: 2 }) + line(40, 175, 680, 175, C.blue, 3) +
    [["Lote A", "Ingresó 02/11", "Vence 12/11", C.mint], ["Lote B", "Ingresó 05/11", "Vence 15/11", C.sky], ["Lote C", "Ingresó 09/11", "Vence 19/11", C.blue]]
      .map((s, i) => box(70 + i * 200, 112, 170, 56, [s[0] + " · " + s[1], s[2]], { fill: s[3], stroke: s[3], tfill: C.white, size: 13 })).join("") +
    text(70, 200, "FRENTE → sale primero", { size: 14, weight: 800, fill: C.mintInk }) + text(610, 200, "FONDO", { size: 14, weight: 800, fill: C.muted, anchor: "end" }) +
    arrow(150, 225, 150, 260, C.mint) + box(40, 276, 640, 56, ["Regla práctica: etiqueta con fecha de ingreso y vencimiento; reponer SIEMPRE por detrás."], { fill: C.mintBg, stroke: C.mint, tfill: C.mintInk, size: 14 }) })

svg({ dir: D2, name: "kardex-ejemplo", title: "Tarjeta kardex con método PEPS", desc: "Tabla con entradas y salidas de harina de trigo en kilos y valores, mostrando cómo el saldo se valora por capas de costo.",
  body: head("Kardex PEPS · Harina de trigo (kg)") +
    rect(32, 76, 656, 250, { stroke: C.blue, sw: 2, r: 10 }) + rect(32, 76, 656, 36, { fill: C.blue, stroke: C.blue, r: 10 }) +
    ["Fecha", "Detalle", "Entra", "Sale", "Saldo (kg)", "Valor saldo"].map((h, i) => text([44, 112, 260, 330, 400, 540][i] + 0, 100, h, { size: 13, weight: 800, fill: C.white })).join("") +
    [["01/11", "Saldo inicial", "—", "—", "40", "$ 96.000"], ["04/11", "Compra a $2.600", "100", "—", "140", "$ 356.000"], ["06/11", "Requisición", "—", "60", "80", "$ 208.000"], ["10/11", "Requisición", "—", "50", "30", "$ 78.000"]]
      .map((r, ri) => r.map((c, i) => text([44, 112, 260, 330, 400, 540][i], 138 + ri * 36, c, { size: 13, weight: i === 5 ? 800 : 600 })).join("") + line(32, 148 + ri * 36, 688, 148 + ri * 36, C.line, 1)).join("") +
    box(44, 286, 632, 30, ["Salida del 06/11: 40 kg × $2.400 + 20 kg × $2.600 = $148.000 (≈ $2.467/kg) · Saldo: 80 kg × $2.600 = $208.000"], { fill: C.amberBg, stroke: C.amber, tfill: C.amberInk, size: 12, r: 8 }) })

svg({ dir: D2, name: "rotacion-inventario", title: "Rotación y días de inventario", desc: "Dos fórmulas: rotación igual a costo de ventas dividido por inventario promedio; días de inventario igual a 30 dividido por la rotación mensual.",
  body: head("Rotación y días de inventario", "¿Cuántas veces se renueva el stock y cuántos días dura?") +
    box(32, 96, 320, 120, ["Rotación (veces al mes)", "= Costo de ventas del mes", "÷ Inventario promedio", "$18.000.000 ÷ $4.500.000 = 4,0"], { fill: C.pale, size: 14 }) +
    box(368, 96, 320, 120, ["Días de inventario", "= 30 días ÷ rotación", "30 ÷ 4,0 = 7,5 días", "Meta típica en perecederos: pocos días"], { fill: C.skyBg, size: 14 }) +
    box(32, 236, 656, 88, ["Lectura: rotación baja = dinero parado, riesgo de vencimiento.", "Rotación muy alta = riesgo de quiebres de stock y compras de urgencia (más caras)."], { fill: C.amberBg, stroke: C.amber, tfill: C.amberInk, size: 14, weight: 600 }) })

svg({ dir: D2, name: "punto-de-pedido", title: "Punto de pedido y stock de seguridad", desc: "Gráfica en dientes de sierra: el inventario baja con el consumo; al llegar al punto de pedido se ordena y el pedido llega después del plazo de entrega, sin tocar el stock de seguridad.",
  body: head("Punto de pedido", "Se ordena cuando el saldo toca el punto de pedido, no cuando se acaba.") +
    line(60, 90, 60, 300, C.ink, 2) + line(60, 300, 680, 300, C.ink, 2) +
    `<polyline points="60,110 250,230 250,110 440,230 440,110 630,230" fill="none" stroke="${C.blue}" stroke-width="3.5"/>` +
    line(60, 230, 680, 230, C.amber, 2, "8 6") + line(60, 270, 680, 270, C.rose, 2, "8 6") +
    text(684, 234, "Punto de pedido", { size: 12, weight: 800, fill: C.amberInk }) + text(684, 274, "Stock de seguridad", { size: 12, weight: 800, fill: C.roseInk }) +
    text(66, 106, "Máximo", { size: 12, weight: 700, fill: C.muted }) + text(200, 324, "plazo de entrega", { size: 12, weight: 700, fill: C.muted }) + text(520, 324, "tiempo →", { size: 12, weight: 700, fill: C.muted }) +
    box(32, 330, 656, 24, ["PP = consumo diario × plazo de entrega + stock de seguridad"], { fill: C.pale, size: 12, r: 8 }) })

svg({ dir: D2, name: "causas-mermas", title: "Causas de las mermas en una cocina", desc: "Gráfico de barras horizontales con las causas típicas de pérdida: vencimiento, sobreproducción, errores de preparación, porcionado, devoluciones, robo y errores de registro.",
  body: head("¿Dónde se pierde el dinero?", "Distribución ilustrativa de pérdidas medidas en una cocina de 12 mesas (datos de ejemplo).") +
    [["Productos vencidos", 28], ["Sobreproducción", 22], ["Errores de preparación", 16], ["Porcionado sin control", 14], ["Devoluciones y reclamos", 9], ["Faltantes sin explicar", 7], ["Errores de registro", 4]]
      .map((s, i) => text(32, 112 + i * 34, s[0], { size: 13, weight: 700 }) + `<rect x="230" y="${96 + i * 34}" width="${s[1] * 15}" height="20" rx="6" fill="${i === 0 ? C.blue : i < 4 ? C.sky : C.line}"/>` + text(236 + s[1] * 15, 112 + i * 34, `${s[1]} %`, { size: 13, weight: 800, fill: C.dark })).join("") +
    text(32, 346, "Lo que no se mide no se gestiona: registra cada merma con causa, cantidad y valor.", { size: 13, weight: 700, fill: C.muted }) })

console.log("SVG generados en", OUT)
