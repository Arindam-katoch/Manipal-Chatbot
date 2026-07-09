import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pdf-parse (and its pdfjs-dist worker) out of the bundler so its
  // runtime dynamic requires resolve against node_modules. Without this,
  // parsing throws "Setting up fake worker failed" under Turbopack/webpack.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
