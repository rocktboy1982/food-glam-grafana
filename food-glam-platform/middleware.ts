// /middleware.ts
// SSO auth temporarily disabled for local exploration
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Auth gate disabled — allow all routes through for local dev/exploration
  return NextResponse.next()
}

export const config = {
  matcher: ['/me/:path*']
}
