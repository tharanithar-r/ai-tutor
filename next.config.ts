import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  },
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
