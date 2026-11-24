import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // keep the Postgres driver (and the optional local test DB) out of the bundle
  serverExternalPackages: ["pg", "@electric-sql/pglite", "web-push"],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
