/**
 * URL Validator with Allowlist Checks
 * Prevents SSRF and enforces content policy
 */

const VIDEO_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'tiktok.com',
  'www.tiktok.com',
  'facebook.com',
  'www.facebook.com',
  'fb.watch',
  'drive.google.com',
  'docs.google.com',
]

const IMAGE_HOSTS = [
  'photos.google.com',
  'icloud.com',
  'www.icloud.com',
  'drive.google.com',
  'docs.google.com',
]

const EMBED_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
]

export interface ValidationResult {
  valid: boolean
  error?: string
  normalized?: string
}

function isLocalOrPrivate(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  
  // Localhost variants
  if (lower === 'localhost' || lower.endsWith('.local') || lower === '::1') {
    return true
  }
  
  // IPv4 check
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    const parts = hostname.split('.').map(Number)
    // Private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x
    if (parts[0] === 10 || parts[0] === 127) return true
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
    if (parts[0] === 192 && parts[1] === 168) return true
  }
  
  // IPv6 check (simple - contains colons)
  if (hostname.includes(':')) {
    return true
  }
  
  return false
}

function validateUrl(url: string, allowedHosts: string[]): ValidationResult {
  try {
    const parsed = new URL(url)
    
    // Must be HTTPS
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS URLs are allowed' }
    }
    
    // No credentials in URL
    if (parsed.username || parsed.password) {
      return { valid: false, error: 'URLs with credentials are not allowed' }
    }
    
    // Check for local/private
    if (isLocalOrPrivate(parsed.hostname)) {
      return { valid: false, error: 'Local and private URLs are not allowed' }
    }
    
    // Check allowlist
    const hostname = parsed.hostname.toLowerCase()
    const isAllowed = allowedHosts.some(host => 
      hostname === host || hostname.endsWith('.' + host)
    )
    
    if (!isAllowed) {
      return { 
        valid: false, 
        error: `URL must be from an allowed domain: ${allowedHosts.join(', ')}` 
      }
    }
    
    // Normalize URL
    const normalized = parsed.toString()
    
    return { valid: true, normalized }
  } catch (err) {
    return { valid: false, error: 'Invalid URL format' }
  }
}

export function validateVideoUrl(url: string): ValidationResult {
  return validateUrl(url, VIDEO_HOSTS)
}

export function validateImageUrl(url: string): ValidationResult {
  return validateUrl(url, IMAGE_HOSTS)
}

export function validateEmbedUrl(url: string): ValidationResult {
  return validateUrl(url, EMBED_HOSTS)
}
