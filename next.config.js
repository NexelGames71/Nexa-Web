/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/auth", destination: "/login", permanent: false },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid corrupted filesystem cache entries on Windows that cause
      // missing generated chunk/module errors during hot reload.
      config.cache = false;
    }

    return config;
  },
};

module.exports = nextConfig;
