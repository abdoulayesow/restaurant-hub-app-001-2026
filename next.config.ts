import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  // Build optimizations
  typescript: {
    // Speed up builds by running type checking separately
    ignoreBuildErrors: false,
  },
  eslint: {
    // Speed up builds by running ESLint separately
    ignoreDuringBuilds: false,
  },
  // Reduce bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
  // Enable Turbopack for faster dev and production builds
  turbopack: {
    resolveAlias: {
      '@/*': './*',
    },
  },
}

export default nextConfig
