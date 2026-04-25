import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  basePath: "/investmentQuotes",
  assetPrefix: "/investmentQuotes",
};

export default nextConfig;
