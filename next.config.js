/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    config.cache = false;
    config.parallelism = 1;
    // @supabase/realtime-js uses a dynamic require() for an optional
    // WebSocket dependency. Webpack reports it as "Critical dependency", but
    // it is harmless, so silence it to keep build logs clean.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /@supabase\/realtime-js/ },
    ];
    return config;
  },
};

module.exports = nextConfig;
