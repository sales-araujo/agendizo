/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['images.unsplash.com', 'plus.unsplash.com', 'avatars.githubusercontent.com'],
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'agendizo.vercel.app'],
    },
  },
}

export default nextConfig
