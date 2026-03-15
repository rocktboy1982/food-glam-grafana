import { NextResponse } from 'next/server'
import { searchProducts, isProfitshareConfigured } from '@/lib/profitshare'

/**
 * GET /api/profitshare/products?page=1&advertiser=35
 * Search eMAG products via Profitshare product feed
 * eMAG advertiser ID = 35
 */
export async function GET(request: Request) {
  try {
    if (!isProfitshareConfigured()) {
      return NextResponse.json(
        { error: 'Profitshare API not configured' },
        { status: 503 }
      )
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const advertiser = url.searchParams.get('advertiser') || '35' // 35 = eMAG

    const result = await searchProducts(advertiser, page)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Profitshare products error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
