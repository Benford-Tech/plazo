import path from "node:path";
import type { NextConfig } from "next";

// The product name lives only in the repository's product.json, one level above this app. Turbopack
// only resolves files under its root, so the root (and the output file tracing root, which must match)
// is the repository.
const repositoryRoot = path.join(__dirname, "..");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  turbopack: { root: repositoryRoot },
  outputFileTracingRoot: repositoryRoot,
  poweredByHeader: false,
  // The repository keeps its own agent instructions (CLAUDE.md at the root): no generated copies here.
  agentRules: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Booking pages carry the traveller's manage key in their URL: never send it to another site in
      // a Referer, never index them, never cache them. ("same-origin" rather than "no-referrer": with
      // no-referrer, browsers post forms with "Origin: null", which server actions reject without JavaScript.)
      {
        source: "/ma-reservation/:path*",
        headers: [
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
