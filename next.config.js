/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const marketingCache = [
      {
        key: "Cache-Control",
        value: "public, s-maxage=300, stale-while-revalidate=86400",
      },
    ];

    const privateCache = [
      {
        key: "Cache-Control",
        value: "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    ];

    const immutableAssetCache = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];

    return [
      {
        source: "/",
        headers: marketingCache,
      },
      {
        source:
          "/:path(about|api|blog|browser|careers|contact|developers|enterprise|features|models|pricing|privacy|research|security|teaser|terms)",
        headers: marketingCache,
      },
      {
        source: "/blog/:path*",
        headers: marketingCache,
      },
      {
        source: "/media/:path*",
        headers: immutableAssetCache,
      },
      {
        source: "/voices/:path*",
        headers: immutableAssetCache,
      },
      {
        source: "/icons/:path*",
        headers: immutableAssetCache,
      },
      {
        source:
          "/:path(arrow|close|database|magnifying-glass|new-message|nexa-icon|nexa-logo|next|settings|sidebar|thinking).png",
        headers: immutableAssetCache,
      },
      {
        source: "/:path(icon|apple-icon).png",
        headers: immutableAssetCache,
      },
      {
        source: "/favicon.ico",
        headers: immutableAssetCache,
      },
      {
        source: "/generated/:path*",
        headers: privateCache,
      },
      {
        source: "/api/:path*",
        headers: privateCache,
      },
      {
        source: "/admin/:path*",
        headers: privateCache,
      },
      {
        source: "/chat/:path*",
        headers: privateCache,
      },
      {
        source: "/images/:path*",
        headers: privateCache,
      },
      {
        source: "/settings/:path*",
        headers: privateCache,
      },
      {
        source: "/login",
        headers: privateCache,
      },
      {
        source: "/signup",
        headers: privateCache,
      },
      {
        source: "/checkout/:path*",
        headers: privateCache,
      },
    ];
  },
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
