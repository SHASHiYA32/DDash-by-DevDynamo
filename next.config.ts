import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // keep the Postgres driver (and the optional local test DB) out of the bundle
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
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
