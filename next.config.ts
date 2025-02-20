import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        port: '',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/solana-labs/token-list/main/assets/mainnet/**',
      },
      {
        protocol: 'https',
        hostname: 'cf-ipfs.com',
        port: '',
        pathname: '/ipfs/**',
      },
    ],
  },
};

export default nextConfig;
