import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/proposals',
        destination: '/quotations',
        permanent: true,
      },
      {
        source: '/proposals/:path*',
        destination: '/quotations/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
