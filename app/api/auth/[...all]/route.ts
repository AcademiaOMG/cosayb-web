import { NextRequest, NextResponse } from "next/server"

// TODO: Replace with better-auth handler when database is configured
// import { auth } from "@/lib/auth-server"
// import { toNextJsHandler } from "better-auth/next-js"
// export const { GET, POST } = toNextJsHandler(auth.handler)

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Auth handler not configured yet" },
    { status: 503 }
  )
}

export async function POST(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Auth handler not configured yet" },
    { status: 503 }
  )
}
