// Mini-markdown PROPIO y seguro para el cuerpo de las lecciones.
// No produce HTML: devuelve un árbol de nodos que React renderiza como elementos (texto siempre escapado).
// Soporta: ## / ### títulos, listas con - / * y 1., citas >, **negrita**, `código`. Todo lo demás es texto literal.

export type Inline = { t: "text"; v: string } | { t: "strong"; v: string } | { t: "code"; v: string }
export type Block =
  | { t: "h2" | "h3" | "p" | "quote"; c: Inline[] }
  | { t: "ul" | "ol"; items: Inline[][] }

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

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n")
  const blocks: Block[] = []
  let para: string[] = []
  let list: { kind: "ul" | "ol"; items: Inline[][] } | null = null
  const flushPara = () => {
    if (para.length) blocks.push({ t: "p", c: parseInline(para.join(" ")) })
    para = []
  }
  const flushList = () => {
    if (list) blocks.push({ t: list.kind, items: list.items })
    list = null
  }
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      flushPara()
      flushList()
      continue
    }
    let m: RegExpMatchArray | null
    if ((m = line.match(/^###\s+(.+)$/))) {
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
  return blocks
}
