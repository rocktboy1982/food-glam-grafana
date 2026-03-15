import { NextResponse } from 'next/server'
import { generateAffiliateLinks, isProfitshareConfigured } from '@/lib/profitshare'

/**
 * POST /api/profitshare/links
 * Generate Profitshare affiliate links for eMAG URLs
 *
 * Body: { links: [{ name: "usturoi", url: "https://www.emag.ro/search/usturoi" }] }
 * Returns: { links: [{ name, url, ps_url }] }
 */
export async function POST(request: Request) {
  try {
    if (!isProfitshareConfigured()) {
      return NextResponse.json(
        { error: 'Profitshare API not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const links = body.links

    if (!Array.isArray(links) || links.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty links array' },
        { status: 400 }
      )
    }

    // Cap at 50 links per request to stay within rate limits
    const batch = links.slice(0, 50)
    const result = await generateAffiliateLinks(batch)

    return NextResponse.json({ links: result })
  } catch (err) {
    console.error('Profitshare links error:', err)
    return NextResponse.json(
      { error: 'Failed to generate affiliate links' },
      { status: 500 }
    )
  }
}
