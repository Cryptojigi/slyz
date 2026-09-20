/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
      crypto: false,
      "pino-pretty": false,
    };
    config.externals = [...(config.externals || []), "pino-pretty", "lokijs", "encoding"];
    return config;
  },
};

export default nextConfig;
