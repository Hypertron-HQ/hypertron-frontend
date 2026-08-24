import type { NextConfig } from "next";

const CORE =
  "http://hypertron-core-438173.us-west-2.elasticbeanstalk.com";
const API = "http://hypertron-api-438173.us-west-2.elasticbeanstalk.com";
const INDEXER =
  "http://hypertron-indexer-438173.us-west-2.elasticbeanstalk.com";

const nextConfig: NextConfig = {
  transpilePackages: ["@hypertron/prover"],
  // Slim image for Elastic Beanstalk / Docker. Local `next start` still works.
  output: "standalone",
  // WASM is loaded from /public/prover via init({ module_or_path }) — no bundler WASM needed.
  turbopack: {},
  // Browser stays on HTTPS (Vercel). These rewrites proxy to HTTP Beanstalk
  // so Freighter login is not blocked as mixed content.
  async rewrites() {
    return [
      { source: "/aws-core/:path*", destination: `${CORE}/:path*` },
      { source: "/aws-api/:path*", destination: `${API}/:path*` },
      { source: "/aws-indexer/:path*", destination: `${INDEXER}/:path*` },
    ];
  },
};

export default nextConfig;
