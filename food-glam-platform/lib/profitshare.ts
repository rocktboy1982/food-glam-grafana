import crypto from 'crypto'

const PS_API_USER = process.env.PROFITSHARE_API_USER || ''
const PS_API_KEY = process.env.PROFITSHARE_API_KEY || ''
const API_BASE = 'https://api.profitshare.ro'

function buildAuthHeaders(method: string, route: string, queryString: string = ''): Record<string, string> {
  const date = new Date().toUTCString()
  const signatureString = `${method}${route}?${queryString}/${PS_API_USER}${date}`
  const auth = crypto.createHmac('sha1', PS_API_KEY).update(signatureString).digest('hex')

  return {
    'Date': date,
    'X-PS-Client': PS_API_USER,
    'X-PS-Accept': 'json',
    'X-PS-Auth': auth,
  }
}

// ── Generate affiliate links ─────────────────────────────────────────────────
// POST /affiliate-links/
// Accepts array of { name, url } → returns array with ps_url (tracked link)

export interface LinkInput {
  name: string
  url: string
}

export interface LinkResult {
  name: string
  url: string
  ps_url: string
}

export async function generateAffiliateLinks(links: LinkInput[]): Promise<LinkResult[]> {
  if (!PS_API_USER || !PS_API_KEY) {
    throw new Error('Profitshare API credentials not configured')
  }

  const route = 'affiliate-links/'
  const queryString = ''
  const headers = buildAuthHeaders('POST', route, queryString)

  // Build form data — Profitshare expects array format: 0[name]=x&0[url]=y&1[name]=z...
  const params = new URLSearchParams()
  links.forEach((link, i) => {
    params.append(`${i}[name]`, link.name)
    params.append(`${i}[url]`, link.url)
  })

  const res = await fetch(`${API_BASE}/${route}?${queryString}`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Profitshare API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return (data.result || []) as LinkResult[]
}

// ── Search products ──────────────────────────────────────────────────────────
// GET /affiliate-products/?filters[advertiser]=35&page=1
// eMAG advertiser ID = 35

export interface ProductResult {
  link: string
  name: string
  image: string
  price_vat: number
  price: number
  advertiser_id: number
  advertiser_name: string
  category_name: string
}

export async function searchProducts(advertiserIds: string = '35', page: number = 1): Promise<{
  products: ProductResult[]
  currentPage: number
  totalPages: number
}> {
  if (!PS_API_USER || !PS_API_KEY) {
    throw new Error('Profitshare API credentials not configured')
  }

  const route = 'affiliate-products/'
  const queryString = `page=${page}&filters[advertiser]=${advertiserIds}`
  const headers = buildAuthHeaders('GET', route, queryString)

  const res = await fetch(`${API_BASE}/${route}?${queryString}`, {
    method: 'GET',
    headers,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Profitshare API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return {
    products: (data.result?.products || []) as ProductResult[],
    currentPage: data.result?.current_page || 1,
    totalPages: data.result?.total_pages || 1,
  }
}

// ── Check if configured ──────────────────────────────────────────────────────

export function isProfitshareConfigured(): boolean {
  return Boolean(PS_API_USER && PS_API_KEY)
}
