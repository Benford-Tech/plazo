import path from "node:path";
import type { NextConfig } from "next";

// The repository root holds product.json (the single source of the product name),
// so the bundler and output tracing must be allowed to read one level up.
const repoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
};

export default nextConfig;
