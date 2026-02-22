import { NextResponse } from 'next/server'
import { fetchAndExtractJsonLd } from '@/lib/jsonld'

/**
 * POST /api/import/extract
 * 
 * Extract recipe data from a URL using JSON-LD or site-specific extractors.
 * 
 * Body:
 *   { url: string }
 * 
 * Response:
 *   { recipes: Recipe[] } or { error: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Require HTTPS
    if (parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only HTTPS URLs are allowed' }, { status: 400 })
    }

    // Block local/private URLs for security (SSRF prevention)
    const hostname = parsedUrl.hostname.toLowerCase()
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.local') ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      /^\d+\.\d+\.\d+\.\d+$/.test(hostname) || // IPv4
      hostname.includes(':') // IPv6
    ) {
      return NextResponse.json({ error: 'Cannot import from local URLs' }, { status: 400 })
    }

    // Extract recipe data
    const recipes = await fetchAndExtractJsonLd(url)

    if (!recipes || recipes.length === 0) {
      return NextResponse.json({ 
        error: 'No recipe data found at this URL. Please check the URL or try a different recipe site.' 
      }, { status: 404 })
    }

    return NextResponse.json({ recipes })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Recipe extraction error:', message)
    
    // Return user-friendly error
    if (message.includes('Fetch failed') || message.includes('timeout')) {
      return NextResponse.json({ 
        error: 'Failed to fetch the URL. The site may be down or blocking requests.' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ error: 'Failed to extract recipe data' }, { status: 500 })
  }
}
