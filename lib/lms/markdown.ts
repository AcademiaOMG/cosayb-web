// Mini-markdown PROPIO y seguro para el cuerpo de las lecciones.
// No produce HTML: devuelve un árbol de nodos que React renderiza como elementos (texto siempre escapado).
// Soporta: ## / ### títulos, listas con - / * y 1., citas >, **negrita**, `código`, tablas con | y separador |---|,
// línea horizontal (---) e imágenes ![texto alternativo](/lms-art/ruta.svg) SOLO de la carpeta propia /lms-art/.
// Todo lo demás es texto literal: nunca se interpreta HTML ni se carga una imagen de un origen externo.

export type Inline = { t: "text"; v: string } | { t: "strong"; v: string } | { t: "code"; v: string }
export type Block =
  | { t: "h2" | "h3" | "p" | "quote"; c: Inline[] }
  | { t: "ul" | "ol"; items: Inline[][] }
  | { t: "table"; head: Inline[][]; rows: Inline[][][]; align: ("left" | "right" | "center")[] }
  | { t: "img"; alt: string; src: string }
  | { t: "hr" }

/** Solo imágenes propias, servidas desde /public/lms-art/: sin protocolo, sin "..", sin parámetros. */
export const SAFE_IMG = /^\/lms-art\/[a-z0-9][a-z0-9/_-]*\.(svg|png|webp)$/

export function parseInline(src: string): Inline[] {
  const out: Inline[] = []
  const re = /\*\*([^*\n]+)\*\*|`([^`\n]+)`/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ t: "text", v: src.slice(last, m.index) })
    if (m[1] !== undefined) out.push({ t: "strong", v: m[1] })
    else out.push({ t: "code", v: m[2] })
    last = m.index + m[0].length
  }
  if (last < src.length) out.push({ t: "text", v: src.slice(last) })
  return out
}

function splitRow(line: string): string[] {
  let t = line.trim()
  if (t.startsWith("|")) t = t.slice(1)
  if (t.endsWith("|")) t = t.slice(0, -1)
  return t.split("|").map((c) => c.trim())
}

function buildTable(rows: string[]): Block | null {
  if (rows.length < 2) return null
  const sep = splitRow(rows[1])
  if (!sep.length || !sep.every((c) => /^:?-{3,}:?$/.test(c))) return null
  const head = splitRow(rows[0])
  const align = sep.map((c) => (c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : "left") as "left" | "right" | "center")
  const body = rows.slice(2).map((r) => {
    const cells = splitRow(r)
    while (cells.length < head.length) cells.push("")
    return cells.slice(0, head.length).map(parseInline)
  })
  return { t: "table", head: head.map(parseInline), rows: body, align: align.slice(0, head.length) }
}

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n")
  const blocks: Block[] = []
  let para: string[] = []
  let list: { kind: "ul" | "ol"; items: Inline[][] } | null = null
  const flushPara = () => {
    if (para.length) blocks.push({ t: "p", c: parseInline(para.join(" ")) })
    para = []
  }
  let tableBuf: string[] = []
  const flushTable = () => {
    if (!tableBuf.length) return
    const t = buildTable(tableBuf)
    if (t) blocks.push(t)
    else for (const l of tableBuf) blocks.push({ t: "p", c: parseInline(l) })
    tableBuf = []
  }
  const flushList = () => {
    if (list) blocks.push({ t: list.kind, items: list.items })
    list = null
  }
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.trimStart().startsWith("|")) {
      flushPara(); flushList(); tableBuf.push(line)
      continue
    }
    flushTable()
    if (!line.trim()) {
      flushPara()
      flushList()
      continue
    }
    let m: RegExpMatchArray | null
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushPara(); flushList(); blocks.push({ t: "hr" })
    } else if ((m = line.trim().match(/^!\[([^\]\n]{0,200})\]\(([^)\s]+)\)$/))) {
      flushPara(); flushList()
      if (SAFE_IMG.test(m[2])) blocks.push({ t: "img", alt: m[1], src: m[2] })
      else blocks.push({ t: "p", c: parseInline(line.trim()) }) // ruta no permitida: queda como texto literal
    } else if ((m = line.match(/^###\s+(.+)$/))) {
      flushPara(); flushList(); blocks.push({ t: "h3", c: parseInline(m[1]) })
    } else if ((m = line.match(/^#{1,2}\s+(.+)$/))) {
      flushPara(); flushList(); blocks.push({ t: "h2", c: parseInline(m[1]) })
    } else if ((m = line.match(/^\s*[-*]\s+(.+)$/))) {
      flushPara()
      if (list?.kind !== "ul") { flushList(); list = { kind: "ul", items: [] } }
      list.items.push(parseInline(m[1]))
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.+)$/))) {
      flushPara()
      if (list?.kind !== "ol") { flushList(); list = { kind: "ol", items: [] } }
      list.items.push(parseInline(m[1]))
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      flushPara(); flushList(); blocks.push({ t: "quote", c: parseInline(m[1]) })
    } else {
      flushList()
      para.push(line.trim())
    }
  }
  flushPara()
  flushList()
  flushTable()
  return blocks
}
