/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Performance optimizations for development and production
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-button',
      '@radix-ui/react-card',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
    ],
    // Fix for React 19 and chunk loading issues
    webpackBuildWorker: true,
    // Improve chunk loading reliability
    optimizeCss: false,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' || false,
  },
  // Enhanced webpack configuration for chunk loading fixes
  webpack: (config, { dev, isServer, webpack }) => {
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    // Only apply client-specific tweaks
    if (!isServer) {
      // Improve module resolution
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
          stream: false,
          util: false,
          buffer: false
        },
        alias: {
          ...config.resolve.alias,
          // React 19 compatibility (no-op aliases kept)
          'react': 'react',
          'react-dom': 'react-dom',
        },
      }

      // Fix chunk loading and module loading
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Create more stable chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      }

      // Improve chunk loading with retry mechanism
      config.output = {
        ...config.output,
        chunkLoadingGlobal: 'webpackChunkTCF_TEF',
        globalObject: 'self',
      }
    }

    return config
  },
  // Prevent port conflicts
  serverRuntimeConfig: {
    port: process.env.PORT || 3000,
  },
  // Public runtime config
  publicRuntimeConfig: {
    basePath: (process.env.NODE_ENV === 'production') ? '' : '',
  },
  // Add output configuration for better chunk handling
  output: 'standalone',
}

export default nextConfig