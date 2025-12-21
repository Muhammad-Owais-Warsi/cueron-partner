/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cueron/types', '@cueron/utils', '@cueron/config'],
  images: {
    domains: ['supabase.co'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  typescript: {
    // This allows production builds to complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // This allows production builds to complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
