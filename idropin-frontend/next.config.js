/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    domains: ['localhost', 'img.cdn.sugarat.top', 'pic.imgdb.cn'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.cdn.sugarat.top',
      },
      {
        protocol: 'https',
        hostname: 'pic.imgdb.cn',
      }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'lucide-react',
      'recharts',
    ],
  },
  headers: async () => {
    const securityHeaders = {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    };

    // Dev must not aggressively cache Next.js chunks; otherwise SW/HMR can serve stale JS and trigger hydration mismatches.
    if (process.env.NODE_ENV !== 'production') {
      return [securityHeaders];
    }

    const immutableStaticHeaders = {
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    };

    return [
      securityHeaders,
      {
        source: '/static/:path*',
        headers: [immutableStaticHeaders],
      },
      {
        source: '/_next/static/:path*',
        headers: [immutableStaticHeaders],
      },
    ];
  },
  redirects: async () => {
    return [];
  },
  rewrites: async () => {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
}

module.exports = nextConfig
