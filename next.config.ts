import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    clientSegmentCache: true
  },
  allowedDevOrigins: ['172.16.26.178', 'aibooker.jimani.ai'],
};

export default nextConfig;
