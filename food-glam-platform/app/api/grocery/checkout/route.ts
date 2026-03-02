import { NextResponse } from 'next/server'
import { buildCheckoutResult } from '@/lib/grocery/vendors'
import type { CartItem, BudgetTier } from '@/lib/ai-provider'
import type { VendorUserConfig } from '@/lib/grocery/vendors'

/** POST /api/grocery/checkout
 *  Body: { vendor_id, items: CartItem[], budget_tier?, vendor_config? }
 *  Returns: CartResult
 */
export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      vendor_id: string
      items: CartItem[]
      budget_tier?: BudgetTier
      vendor_config?: VendorUserConfig
    }

    const { vendor_id, items, vendor_config } = body

    if (!vendor_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'vendor_id and items required' }, { status: 400 })
    }

    const result = buildCheckoutResult(vendor_id, items, vendor_config)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
