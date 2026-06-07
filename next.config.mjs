/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/vecernik', destination: 'https://vecernik.vercel.app/vecernik' },
      { source: '/vecernik/:path*', destination: 'https://vecernik.vercel.app/vecernik/:path*' },
      { source: '/kompas', destination: 'https://kompas-one.vercel.app/kompas' },
      { source: '/kompas/:path*', destination: 'https://kompas-one.vercel.app/kompas/:path*' },
    ]
  },
}

export default nextConfig
