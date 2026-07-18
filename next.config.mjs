import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prebundled UMD build; transpiling avoids occasional dev chunk / resolution issues with Turbopack/webpack.
  transpilePackages: ["@stellar/freighter-api"],
  async redirects() {
    return [
      { source: "/docs", destination: "/doc", permanent: true },
      { source: "/docs/:path*", destination: "/doc/:path*", permanent: true },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@farcaster/mini-app-solana": path.resolve(
        __dirname,
        "src/lib/stubs/farcaster-mini-app-solana.ts"
      ),
      // npm hoists cross-fetch; WalletConnect still resolves a nested path in dev.
      "cross-fetch": path.resolve(__dirname, "node_modules/cross-fetch"),
    };
    return config;
  },
};

export default nextConfig;
