/**
 * Sanitizes text by stripping all HTML tags.
 * Works in both server and client environments (no DOM dependency).
 * Returns plain text safe for rendering.
 */
export function sanitizeText(input: string): string {
  if (!input) return ''
  // Strip all HTML tags, decode common entities, return plain text
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/**
 * Validates if a URL uses http:// or https:// protocol.
 * Returns true only for safe protocols, false otherwise.
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Sanitizes a URL by validating its protocol.
 * Returns the URL if valid (http/https), '#' otherwise.
 * Safe to use in href and src attributes.
 */
export function sanitizeUrl(url: string): string {
  if (isValidUrl(url)) return url
  return '#'
}
