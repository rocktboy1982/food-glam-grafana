import { NextResponse } from 'next/server'
import { VENDORS } from '@/lib/grocery/vendors'

/** GET /api/grocery/vendors — all active vendors */
export async function GET() {
  return NextResponse.json(VENDORS)
}
