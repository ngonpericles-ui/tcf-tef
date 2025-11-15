/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force port 3000 for development
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
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
  // Force dynamic rendering for all routes
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
    webpackBuildWorker: true,
    optimizeCss: false,
  },
  // Force Webpack instead of Turbopack to handle native modules properly
  // Add empty turbopack config to silence the warning about webpack config
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Any webpack config forces Next.js to use Webpack instead of Turbopack
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    // Ensure proper module resolution for CommonJS packages
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
      
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    
    return config;
  },
  // Modern routing configuration
  // Note: middleware.ts is still functional but deprecated
  // Consider migrating to route handlers or server components for auth logic
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  trailingSlash: false,
  // Skip static generation for 404 page
  skipTrailingSlashRedirect: true,
}

export default nextConfig