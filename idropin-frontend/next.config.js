/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8081',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.cdn.sugarat.top',
      },
      {
        protocol: 'https',
        hostname: 'pic.imgdb.cn',
      },
      {
        protocol: 'https',
        hostname: 's3.cstcloud.cn',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 's3.cstcloud.cn',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 1080, 1920],
    imageSizes: [16, 64, 128, 384],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-slot',
      'class-variance-authority',
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
