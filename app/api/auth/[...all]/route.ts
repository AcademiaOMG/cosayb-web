import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"

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
    if (key.toLowerCase() !== "host") {
      headers.set(key, value)
    }
  })

  try {
    const response = await fetch(`${API_URL}/auth${fullPath}`, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined,
      redirect: "manual",
    })

    const responseHeaders = new Headers()
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        responseHeaders.set(key, value)
      }
    })

    const setCookies = response.headers.getSetCookie?.() || []
    setCookies.forEach((cookie) => {
      responseHeaders.append("set-cookie", cookie)
    })

    const body = await response.text()

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
