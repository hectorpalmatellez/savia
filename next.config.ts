import type { NextConfig } from 'next';

const BLOB_HOST =
  process.env.NEXT_PUBLIC_BLOB_BASE_URL?.replace(/^https?:\/\//, '').replace(
    /\/.*$/,
    '',
  ) ?? 'bfvid4lplyqsxghx.public.blob.vercel-storage.com';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: BLOB_HOST,
        pathname: '/plants/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
