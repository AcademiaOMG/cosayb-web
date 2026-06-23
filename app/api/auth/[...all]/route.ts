import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
): Promise<NextResponse> {
  const { all } = await params
  return proxyToBackend(request, `/${all.join("/")}`)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
): Promise<NextResponse> {
  const { all } = await params
  return proxyToBackend(request, `/${all.join("/")}`)
}

async function proxyToBackend(request: NextRequest, path: string): Promise<NextResponse> {
  const url = new URL(request.url)
  const queryString = url.search.toString()
  const fullPath = queryString ? `${path}${queryString}` : path

  const headers = new Headers()
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (lower !== "host" && lower !== "accept-encoding") {
      headers.set(key, value)
    }
  })
  headers.set("accept-encoding", "identity")

  console.log(`[proxy] ${request.method} ${API_URL}/auth${fullPath}`)
  console.log(`[proxy] accept-encoding enviado:`, headers.get("accept-encoding"))

  try {
    const response = await fetch(`${API_URL}/auth${fullPath}`, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined,
      redirect: "manual",
    })

    console.log(`[proxy] respuesta: ${response.status}`)
    console.log(`[proxy] content-encoding:`, response.headers.get("content-encoding"))
    console.log(`[proxy] transfer-encoding:`, response.headers.get("transfer-encoding"))

    const responseHeaders = new Headers()
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase()
      // set-cookie se maneja por separado vía getSetCookie() para evitar duplicados
      if (lower === "set-cookie" || lower === "transfer-encoding" || lower === "content-encoding") return
      responseHeaders.set(key, value)
    })

    const setCookies = response.headers.getSetCookie?.() ?? []
    console.log(`[proxy] set-cookie headers:`, setCookies.map(c => c.slice(0, 100)))
    for (const cookie of setCookies) {
      responseHeaders.append("set-cookie", cookie)
    }

    const body = await response.text()
    console.log(`[proxy] body (primeros 200 chars):`, body.slice(0, 200))

    return new NextResponse(body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error(`[Auth Proxy] Error en ${path}:`, error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor de autenticación" },
      { status: 502 }
    )
  }
}
