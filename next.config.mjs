/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Turbopack (default in Next.js 16)
  turbopack: {},
  // Disable source maps in production for smaller bundles
  productionBrowserSourceMaps: false,
  // Set build timestamp at build time (captured when deployed)
  env: {
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
  },
};

export default nextConfig;
