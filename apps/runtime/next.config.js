const path = require("path");

// Load .env from monorepo root in local dev
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@forge/core"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

module.exports = nextConfig;
