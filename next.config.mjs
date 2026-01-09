/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Turbopack (default in Next.js 16)
  turbopack: {},
  // Disable source maps in production for smaller bundles
  productionBrowserSourceMaps: false,
};

export default nextConfig;
