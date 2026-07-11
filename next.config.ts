import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  basePath: "/investmentQuotes",
  assetPrefix: "/investmentQuotes",
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
