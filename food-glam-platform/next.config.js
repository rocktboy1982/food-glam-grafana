/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // unoptimized removed — Vercel now serves images as WebP automatically (better LCP/CWV)
    formats: ['image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    minimumCacheTTL: 86400, // 24h CDN cache for optimized images
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // CSP removed — was blocking Google OAuth, Analytics, and AdSense.
          // TODO: re-add with proper allowlist once auth flow is stable.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
