/** @type {import('next').NextConfig} */
const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000'
const backendUrl = rawBackendUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')

const nextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
}

export default nextConfig
