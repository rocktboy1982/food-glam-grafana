/**
 * Vendor Adapter Registry — Module 39
 * Implements deeplink / clipboard handoff for each supported grocery vendor.
 */

import type { CartItem, CartResult, BudgetTier, VendorProduct } from '@/lib/ai-provider'

export type DeliveryModel = 'warehouse' | 'personal-shopper' | 'courier' | 'pickup'
export type IntegrationMode = 'api' | 'deeplink' | 'manual'

export interface GroceryVendor {
  id: string
  name: string
  logoEmoji: string
  countryCode: string
  deliveryModel: DeliveryModel
  integrationMode: IntegrationMode
  supportsMultiStore: boolean
  estimatedDeliveryMinutes: number | null
  tierRank: Record<BudgetTier, number>  // lower = preferred for that tier
  description: string
  websiteUrl: string
}

export interface VendorUserConfig {
  vendorId: string
  isDefault: boolean
  preferredStore?: string   // for Bringo: 'carrefour' | 'kaufland' | etc.
  preferredCity?: string    // for Glovo/Bringo: 'bucharest' | 'cluj-napoca'
}

/* ─── Vendor catalogue (seeded, not user-created) ────────────────────────── */

export const VENDORS: GroceryVendor[] = [
  {
    id: 'freshful',
    name: 'Freshful by eMAG',
    logoEmoji: '🟢',
    countryCode: 'RO',
    deliveryModel: 'warehouse',
    integrationMode: 'deeplink',
    supportsMultiStore: false,
    estimatedDeliveryMinutes: 120,
    tierRank: { budget: 4, normal: 2, premium: 1 },
    description: 'Online hypermarket. 20,000+ products, same-day delivery.',
    websiteUrl: 'https://www.freshful.ro',
  },
  {
    id: 'bringo',
    name: 'Bringo',
    logoEmoji: '🟡',
    countryCode: 'RO',
    deliveryModel: 'personal-shopper',
    integrationMode: 'deeplink',
    supportsMultiStore: true,
    estimatedDeliveryMinutes: 90,
    tierRank: { budget: 2, normal: 1, premium: 3 },
    description: 'Personal shopper. Shops Carrefour, Kaufland, Mega Image & more.',
    websiteUrl: 'https://www.bringo.ro',
  },
  {
    id: 'glovo',
    name: 'Glovo',
    logoEmoji: '🟠',
    countryCode: 'RO',
    deliveryModel: 'courier',
    integrationMode: 'deeplink',
    supportsMultiStore: true,
    estimatedDeliveryMinutes: 45,
    tierRank: { budget: 3, normal: 3, premium: 4 },
    description: '~45 min delivery. Mega Image, Carrefour, Kaufland, Penny.',
    websiteUrl: 'https://glovoapp.com/ro/en/',
  },
  {
    id: 'kaufland-ro',
    name: 'Kaufland',
    logoEmoji: '🔴',
    countryCode: 'RO',
    deliveryModel: 'pickup',
    integrationMode: 'deeplink',
    supportsMultiStore: false,
    estimatedDeliveryMinutes: null,
    tierRank: { budget: 1, normal: 2, premium: 5 },
    description: 'Click & collect or home delivery. Best for Budget tier.',
    websiteUrl: 'https://www.kaufland.ro',
  },
  {
    id: 'carrefour-ro',
    name: 'Carrefour',
    logoEmoji: '🔵',
    countryCode: 'RO',
    deliveryModel: 'warehouse',
    integrationMode: 'deeplink',
    supportsMultiStore: false,
    estimatedDeliveryMinutes: 120,
    tierRank: { budget: 3, normal: 2, premium: 2 },
    description: 'Home delivery or click & collect.',
    websiteUrl: 'https://www.carrefour.ro',
  },
]

export function getVendor(id: string): GroceryVendor | undefined {
  return VENDORS.find(v => v.id === id)
}

export function getVendorsSortedByTier(
  vendorIds: string[],
  tier: BudgetTier
): GroceryVendor[] {
  return vendorIds
    .map(id => getVendor(id))
    .filter((v): v is GroceryVendor => v !== undefined)
    .sort((a, b) => (a.tierRank[tier] ?? 99) - (b.tierRank[tier] ?? 99))
}

/* ─── Checkout URL builders ──────────────────────────────────────────────── */

function encodeQuery(s: string) { return encodeURIComponent(s) }

function buildFreshfulUrl(items: CartItem[]): string {
  // Freshful: one search per first item (no multi-cart URL format)
  const first = items[0]?.product.name ?? items[0]?.ingredientRef ?? ''
  return `https://www.freshful.ro/search?q=${encodeQuery(first)}`
}

function buildBringoClipboard(items: CartItem[], preferredStore?: string): string {
  const storeLabel = preferredStore
    ? `(${preferredStore.charAt(0).toUpperCase() + preferredStore.slice(1)})`
    : ''
  const header = `🛒 Lista mea de cumpărături Bringo ${storeLabel}\n${'─'.repeat(35)}`
  const lines = items.map(item => {
    const qty = item.quantity > 1 ? `×${item.quantity} ` : ''
    return `• ${qty}${item.product.name} (${item.product.unit})`
  })
  return `${header}\n${lines.join('\n')}\n${'─'.repeat(35)}`
}

function buildGlovoUrl(items: CartItem[], city = 'bucharest'): string {
  // Glovo deep-link to Mega Image as default store
  const storeSlug = 'mega-image-buc'
  const baseUrl = `https://glovoapp.com/ro/en/${city}/${storeSlug}/`
  // Glovo doesn't support URL cart-fill publicly; send to store page
  // with first product search as query hint
  const first = encodeQuery(items[0]?.product.name ?? '')
  return first ? `${baseUrl}?search=${first}` : baseUrl
}

function buildKauflandUrl(items: CartItem[]): string {
  const first = encodeQuery(items[0]?.product.name ?? items[0]?.ingredientRef ?? '')
  return `https://www.kaufland.ro/products.html?search_value=${first}`
}

function buildCarrefourUrl(items: CartItem[]): string {
  const first = encodeQuery(items[0]?.product.name ?? items[0]?.ingredientRef ?? '')
  return `https://www.carrefour.ro/s?q=${first}`
}

/* ─── Main checkout dispatcher ───────────────────────────────────────────── */

export function buildCheckoutResult(
  vendorId: string,
  items: CartItem[],
  config?: VendorUserConfig
): CartResult {
  const estimatedTotal = items.reduce((sum, item) => {
    return sum + item.product.pricePerUnit * item.quantity
  }, 0)

  switch (vendorId) {
    case 'freshful':
      return {
        checkoutUrl: buildFreshfulUrl(items),
        estimatedTotal: Math.round(estimatedTotal * 100) / 100,
        currency: 'RON',
      }

    case 'bringo': {
      const clipboard = buildBringoClipboard(items, config?.preferredStore)
      return {
        checkoutUrl: 'https://www.bringo.ro',
        requiresAppHandoff: true,
        handoffMessage: clipboard,
        estimatedTotal: Math.round(estimatedTotal * 100) / 100,
        currency: 'RON',
      }
    }

    case 'glovo':
      return {
        checkoutUrl: buildGlovoUrl(items, config?.preferredCity),
        estimatedTotal: Math.round(estimatedTotal * 100) / 100,
        currency: 'RON',
      }

    case 'kaufland-ro':
      return {
        checkoutUrl: buildKauflandUrl(items),
        estimatedTotal: Math.round(estimatedTotal * 100) / 100,
        currency: 'RON',
      }

    case 'carrefour-ro':
      return {
        checkoutUrl: buildCarrefourUrl(items),
        estimatedTotal: Math.round(estimatedTotal * 100) / 100,
        currency: 'RON',
      }

    default:
      return {
        checkoutUrl: `https://www.google.com/search?q=${encodeQuery(
          items.map(i => i.product.name).join(' ')
        )}`,
        estimatedTotal: Math.round(estimatedTotal * 100) / 100,
        currency: 'RON',
      }
  }
}

/* ─── Mock product search (until real vendor APIs are wired) ─────────────── */

// Ingredient-specific mock products keyed by lowercase canonical name fragments
const MOCK_PRODUCTS_BY_NAME: Record<string, Omit<VendorProduct, 'vendor'>[]> = {
  mozzarella: [
    { id: 'moz-1', name: 'Mozzarella Freshful Bio', brand: 'Freshful', imageUrl: '', pricePerUnit: 7.49, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'dairy', pricePerBaseUnit: 1.50, baseUnitLabel: 'RON/100g' },
    { id: 'moz-2', name: 'Napolact Mozzarella', brand: 'Napolact', imageUrl: '', pricePerUnit: 9.99, currency: 'RON', unit: '250g', packageSize: '250g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'dairy', pricePerBaseUnit: 3.99, baseUnitLabel: 'RON/100g' },
    { id: 'moz-3', name: 'Bella Italia Mozzarella', brand: 'Bella Italia', imageUrl: '', pricePerUnit: 24.99, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'dairy', pricePerBaseUnit: 4.99, baseUnitLabel: 'RON/100g' },
  ],
  parmesan: [
    { id: 'parm-1', name: 'Parmezan Parmigiano Reggiano', brand: 'Gran Moravia', imageUrl: '', pricePerUnit: 12.99, currency: 'RON', unit: '200g', packageSize: '200g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'dairy', pricePerBaseUnit: 6.50, baseUnitLabel: 'RON/100g' },
    { id: 'parm-2', name: 'Parmezan Zanetti', brand: 'Zanetti', imageUrl: '', pricePerUnit: 8.49, currency: 'RON', unit: '100g', packageSize: '100g', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'dairy', pricePerBaseUnit: 8.49, baseUnitLabel: 'RON/100g' },
  ],
  butter: [
    { id: 'but-1', name: 'Unt Lurpak', brand: 'Lurpak', imageUrl: '', pricePerUnit: 11.99, currency: 'RON', unit: '200g', packageSize: '200g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'dairy', pricePerBaseUnit: 5.99, baseUnitLabel: 'RON/100g' },
    { id: 'but-2', name: 'Unt Covalact', brand: 'Covalact', imageUrl: '', pricePerUnit: 6.49, currency: 'RON', unit: '200g', packageSize: '200g', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'dairy', pricePerBaseUnit: 3.25, baseUnitLabel: 'RON/100g' },
  ],
  milk: [
    { id: 'milk-1', name: 'Lapte Zuzu 3.5%', brand: 'Zuzu', imageUrl: '', pricePerUnit: 7.99, currency: 'RON', unit: '1L', packageSize: '1L', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'dairy', pricePerBaseUnit: 0.80, baseUnitLabel: 'RON/100ml' },
    { id: 'milk-2', name: 'Lapte Napolact 1.5%', brand: 'Napolact', imageUrl: '', pricePerUnit: 5.99, currency: 'RON', unit: '1L', packageSize: '1L', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'dairy', pricePerBaseUnit: 0.60, baseUnitLabel: 'RON/100ml' },
  ],
  egg: [
    { id: 'egg-1', name: 'Ouă de țară (10 buc)', brand: '', imageUrl: '', pricePerUnit: 12.99, currency: 'RON', unit: '10 buc', packageSize: '10 buc', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'dairy', pricePerBaseUnit: 1.30, baseUnitLabel: 'RON/buc' },
    { id: 'egg-2', name: 'Ouă Cococo M (10 buc)', brand: 'Cococo', imageUrl: '', pricePerUnit: 8.99, currency: 'RON', unit: '10 buc', packageSize: '10 buc', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'dairy', pricePerBaseUnit: 0.90, baseUnitLabel: 'RON/buc' },
  ],
  cream: [
    { id: 'crm-1', name: 'Smântână Napolact 20%', brand: 'Napolact', imageUrl: '', pricePerUnit: 4.99, currency: 'RON', unit: '200g', packageSize: '200g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'dairy', pricePerBaseUnit: 2.50, baseUnitLabel: 'RON/100g' },
    { id: 'crm-2', name: 'Frișcă Hochwald', brand: 'Hochwald', imageUrl: '', pricePerUnit: 6.49, currency: 'RON', unit: '200ml', packageSize: '200ml', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'dairy', pricePerBaseUnit: 3.25, baseUnitLabel: 'RON/100ml' },
  ],
  tomato: [
    { id: 'tom-1', name: 'Roșii cherry 500g', brand: '', imageUrl: '', pricePerUnit: 5.99, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'produce', pricePerBaseUnit: 1.20, baseUnitLabel: 'RON/100g' },
    { id: 'tom-2', name: 'Roșii românești', brand: '', imageUrl: '', pricePerUnit: 4.99, currency: 'RON', unit: '1kg', packageSize: '1kg', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'produce', pricePerBaseUnit: 0.50, baseUnitLabel: 'RON/100g' },
  ],
  onion: [
    { id: 'oni-1', name: 'Ceapă galbenă', brand: '', imageUrl: '', pricePerUnit: 2.49, currency: 'RON', unit: '1kg', packageSize: '1kg', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'produce', pricePerBaseUnit: 0.25, baseUnitLabel: 'RON/100g' },
    { id: 'oni-2', name: 'Ceapă roșie', brand: '', imageUrl: '', pricePerUnit: 3.49, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'produce', pricePerBaseUnit: 0.70, baseUnitLabel: 'RON/100g' },
  ],
  garlic: [
    { id: 'gar-1', name: 'Usturoi românesc', brand: '', imageUrl: '', pricePerUnit: 1.99, currency: 'RON', unit: '100g', packageSize: '100g', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'produce', pricePerBaseUnit: 1.99, baseUnitLabel: 'RON/100g' },
  ],
  pepper: [
    { id: 'pep-1', name: 'Ardei gras roșu', brand: '', imageUrl: '', pricePerUnit: 3.99, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'produce', pricePerBaseUnit: 0.80, baseUnitLabel: 'RON/100g' },
    { id: 'pep-2', name: 'Ardei gras galben', brand: '', imageUrl: '', pricePerUnit: 4.49, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'produce', pricePerBaseUnit: 0.90, baseUnitLabel: 'RON/100g' },
  ],
  basil: [
    { id: 'bas-1', name: 'Busuioc proaspăt', brand: '', imageUrl: '', pricePerUnit: 2.99, currency: 'RON', unit: '30g', packageSize: '30g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'produce', pricePerBaseUnit: 9.97, baseUnitLabel: 'RON/100g' },
  ],
  chicken: [
    { id: 'chk-1', name: 'Piept pui Agricola', brand: 'Agricola', imageUrl: '', pricePerUnit: 18.99, currency: 'RON', unit: '1kg', packageSize: '1kg', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'meat', pricePerBaseUnit: 1.90, baseUnitLabel: 'RON/100g' },
    { id: 'chk-2', name: 'Piept pui Transavia', brand: 'Transavia', imageUrl: '', pricePerUnit: 22.99, currency: 'RON', unit: '1kg', packageSize: '1kg', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'meat', pricePerBaseUnit: 2.30, baseUnitLabel: 'RON/100g' },
  ],
  beef: [
    { id: 'bef-1', name: 'Carne vită tocată', brand: 'Angst', imageUrl: '', pricePerUnit: 29.99, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'meat', pricePerBaseUnit: 6.00, baseUnitLabel: 'RON/100g' },
  ],
  pork: [
    { id: 'por-1', name: 'Cotlet porc', brand: '', imageUrl: '', pricePerUnit: 19.99, currency: 'RON', unit: '1kg', packageSize: '1kg', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'meat', pricePerBaseUnit: 2.00, baseUnitLabel: 'RON/100g' },
  ],
  salmon: [
    { id: 'sal-1', name: 'File somon Atlantic', brand: '', imageUrl: '', pricePerUnit: 39.99, currency: 'RON', unit: '400g', packageSize: '400g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'seafood', pricePerBaseUnit: 10.00, baseUnitLabel: 'RON/100g' },
  ],
  prawn: [
    { id: 'prw-1', name: 'Creveți decorticați', brand: '', imageUrl: '', pricePerUnit: 34.99, currency: 'RON', unit: '400g', packageSize: '400g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'seafood', pricePerBaseUnit: 8.75, baseUnitLabel: 'RON/100g' },
  ],
  mussel: [
    { id: 'mus-1', name: 'Midii Black Tiger', brand: '', imageUrl: '', pricePerUnit: 19.99, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'seafood', pricePerBaseUnit: 4.00, baseUnitLabel: 'RON/100g' },
  ],
  rice: [
    { id: 'ric-1', name: 'Orez Deroni Basmati', brand: 'Deroni', imageUrl: '', pricePerUnit: 9.99, currency: 'RON', unit: '1kg', packageSize: '1kg', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'pantry', pricePerBaseUnit: 1.00, baseUnitLabel: 'RON/100g' },
    { id: 'ric-2', name: 'Orez Bob Lung', brand: '', imageUrl: '', pricePerUnit: 4.99, currency: 'RON', unit: '1kg', packageSize: '1kg', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'pantry', pricePerBaseUnit: 0.50, baseUnitLabel: 'RON/100g' },
  ],
  pasta: [
    { id: 'pas-1', name: 'Paste Barilla Spaghetti', brand: 'Barilla', imageUrl: '', pricePerUnit: 6.99, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'pantry', pricePerBaseUnit: 1.40, baseUnitLabel: 'RON/100g' },
    { id: 'pas-2', name: 'Paste De Cecco Penne', brand: 'De Cecco', imageUrl: '', pricePerUnit: 9.99, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'pantry', pricePerBaseUnit: 2.00, baseUnitLabel: 'RON/100g' },
  ],
  flour: [
    { id: 'flr-1', name: 'Făină 000 Grania', brand: 'Grania', imageUrl: '', pricePerUnit: 3.99, currency: 'RON', unit: '1kg', packageSize: '1kg', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'pantry', pricePerBaseUnit: 0.40, baseUnitLabel: 'RON/100g' },
  ],
  oil: [
    { id: 'oil-1', name: 'Ulei de măsline extravirgin Monini', brand: 'Monini', imageUrl: '', pricePerUnit: 24.99, currency: 'RON', unit: '750ml', packageSize: '750ml', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'pantry', pricePerBaseUnit: 3.33, baseUnitLabel: 'RON/100ml' },
    { id: 'oil-2', name: 'Ulei măsline store-brand', brand: '', imageUrl: '', pricePerUnit: 7.20, currency: 'RON', unit: '250ml', packageSize: '250ml', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'pantry', pricePerBaseUnit: 2.88, baseUnitLabel: 'RON/100ml' },
    { id: 'oil-3', name: 'Ulei floarea-soarelui Bunica', brand: 'Bunica', imageUrl: '', pricePerUnit: 8.49, currency: 'RON', unit: '1L', packageSize: '1L', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'pantry', pricePerBaseUnit: 0.85, baseUnitLabel: 'RON/100ml' },
  ],
  sugar: [
    { id: 'sug-1', name: 'Zahăr Mărgăritar', brand: 'Mărgăritar', imageUrl: '', pricePerUnit: 4.99, currency: 'RON', unit: '1kg', packageSize: '1kg', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'pantry', pricePerBaseUnit: 0.50, baseUnitLabel: 'RON/100g' },
  ],
  salt: [
    { id: 'slt-1', name: 'Sare de mare fină', brand: '', imageUrl: '', pricePerUnit: 2.49, currency: 'RON', unit: '1kg', packageSize: '1kg', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'pantry', pricePerBaseUnit: 0.25, baseUnitLabel: 'RON/100g' },
  ],
  saffron: [
    { id: 'saf-1', name: 'Șofran Ducros', brand: 'Ducros', imageUrl: '', pricePerUnit: 8.99, currency: 'RON', unit: '0.4g', packageSize: '0.4g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'pantry', pricePerBaseUnit: 2247.50, baseUnitLabel: 'RON/100g' },
  ],
  stock: [
    { id: 'stk-1', name: 'Supă de pui Knorr', brand: 'Knorr', imageUrl: '', pricePerUnit: 3.49, currency: 'RON', unit: '1L', packageSize: '1L', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'pantry', pricePerBaseUnit: 0.35, baseUnitLabel: 'RON/100ml' },
  ],
  bread: [
    { id: 'brd-1', name: 'Pâine integrală Vel Pitar', brand: 'Vel Pitar', imageUrl: '', pricePerUnit: 4.99, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'bakery', pricePerBaseUnit: 1.00, baseUnitLabel: 'RON/100g' },
  ],
  dough: [
    { id: 'dgh-1', name: 'Aluat pizza Kaufland', brand: 'Kaufland', imageUrl: '', pricePerUnit: 3.49, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'bakery', pricePerBaseUnit: 0.70, baseUnitLabel: 'RON/100g' },
  ],
}

// Category fallbacks — used only when no name-level match is found
const CATEGORY_FALLBACK: Record<string, Omit<VendorProduct, 'vendor'>[]> = {
  dairy: [
    { id: 'df-1', name: 'Produs lactat generic', brand: '', imageUrl: '', pricePerUnit: 6.99, currency: 'RON', unit: '250g', packageSize: '250g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'dairy', pricePerBaseUnit: 2.80, baseUnitLabel: 'RON/100g' },
  ],
  produce: [
    { id: 'pf-1', name: 'Legume proaspete', brand: '', imageUrl: '', pricePerUnit: 4.99, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'produce', pricePerBaseUnit: 1.00, baseUnitLabel: 'RON/100g' },
  ],
  bakery: [
    { id: 'bf-1', name: 'Produs panificație', brand: '', imageUrl: '', pricePerUnit: 3.99, currency: 'RON', unit: '400g', packageSize: '400g', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'bakery', pricePerBaseUnit: 1.00, baseUnitLabel: 'RON/100g' },
  ],
  meat: [
    { id: 'mf-1', name: 'Carne preparată', brand: '', imageUrl: '', pricePerUnit: 19.99, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'meat', pricePerBaseUnit: 4.00, baseUnitLabel: 'RON/100g' },
  ],
  seafood: [
    { id: 'sf-1', name: 'Pește/Fructe de mare', brand: '', imageUrl: '', pricePerUnit: 29.99, currency: 'RON', unit: '400g', packageSize: '400g', inStock: true, storeUrl: 'https://www.freshful.ro', category: 'seafood', pricePerBaseUnit: 7.50, baseUnitLabel: 'RON/100g' },
  ],
  pantry: [
    { id: 'pnf-1', name: 'Produs alimentar', brand: '', imageUrl: '', pricePerUnit: 5.99, currency: 'RON', unit: '500g', packageSize: '500g', inStock: true, storeUrl: 'https://www.kaufland.ro', category: 'pantry', pricePerBaseUnit: 1.20, baseUnitLabel: 'RON/100g' },
  ],
}

/** Find the best name-match key for a canonical ingredient name */
function findNameKey(canonical: string): string | null {
  const lower = canonical.toLowerCase()
  // Try exact key match first
  for (const key of Object.keys(MOCK_PRODUCTS_BY_NAME)) {
    if (lower.includes(key) || key.includes(lower)) return key
  }
  // Try individual words
  const words = lower.split(/[\s,_-]+/).filter(w => w.length > 2)
  for (const word of words) {
    for (const key of Object.keys(MOCK_PRODUCTS_BY_NAME)) {
      if (key.includes(word) || word.includes(key)) return key
    }
  }
  return null
}

export function mockSearchProducts(
  canonical: string,
  category: string,
  vendorId: string,
  tier: BudgetTier
): VendorProduct[] {
  // 1. Try name-based match (avoids duplicates for same-category ingredients)
  const nameKey = findNameKey(canonical)
  const pool = nameKey
    ? MOCK_PRODUCTS_BY_NAME[nameKey]
    : (CATEGORY_FALLBACK[category.toLowerCase()] ?? CATEGORY_FALLBACK['pantry'])

  const products = (pool ?? []).map(p => ({ ...p, vendor: vendorId }))

  // Sort by tier preference
  if (tier === 'budget') return products.sort((a, b) => a.pricePerUnit - b.pricePerUnit)
  if (tier === 'premium') return products.sort((a, b) => b.pricePerUnit - a.pricePerUnit)
  return products // normal: keep original order (balanced)
}
