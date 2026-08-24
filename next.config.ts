import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hypertron/prover"],
  // WASM is loaded from /public/prover via init({ module_or_path }) — no bundler WASM needed.
  turbopack: {},
};

export default nextConfig;
