import path from "node:path";
import type { NextConfig } from "next";
import { DEFAULT_AIRPORT, OPERATORS_PREFIX, PRO_HOST, PRO_SITE_URL } from "./src/lib/site";

// The product name lives only in the repository's product.json, one level above this app. Turbopack
// only resolves files under its root, so the root (and the output file tracing root, which must match)
// is the repository.
const repositoryRoot = path.join(__dirname, "..");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  turbopack: { root: repositoryRoot },
  outputFileTracingRoot: repositoryRoot,
  // Vercel optimises images itself: sharp and its native libraries (about 45 MB) never run in our functions.
  outputFileTracingExcludes: {
    "*": ["node_modules/sharp/**", "node_modules/@img/**"],
  },
  poweredByHeader: false,
  // The repository keeps its own agent instructions (CLAUDE.md at the root): no generated copies here.
  agentRules: false,
  // C (09/10/2026): the home page is the default airport's page, cached like any airport page (ISR); that page
  // has one address, "/" (a permanent redirect from its own, which the internal rewrite does not go through).
  async redirects() {
    return [
      { source: `/${DEFAULT_AIRPORT}`, destination: "/", permanent: true },
      // Plazo Pro on its own address (27/10/2026), once NEXT_PUBLIC_PRO_SITE_URL is set: /loueurs leads there.
      ...(PRO_SITE_URL
        ? [
            { source: OPERATORS_PREFIX, destination: `${PRO_SITE_URL}/`, permanent: true },
            { source: `${OPERATORS_PREFIX}/tarifs`, destination: `${PRO_SITE_URL}/tarifs`, permanent: true },
          ]
        : []),
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        // pro.plazo.fr (27/10/2026): Plazo Pro's pages at the root of its host; /pro and /api stay the other services.
        { source: "/", has: [{ type: "host", value: PRO_HOST }], destination: OPERATORS_PREFIX },
        { source: "/tarifs", has: [{ type: "host", value: PRO_HOST }], destination: `${OPERATORS_PREFIX}/tarifs` },
        // Plazo Pro's lime favicon (28/10/2026): the root favicon.ico link and the browsers' own request get it there.
        { source: "/favicon.ico", has: [{ type: "host", value: PRO_HOST }], destination: "/brand/favicon-pro.ico" },
        { source: "/", destination: `/${DEFAULT_AIRPORT}` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Universal links of the Plazo app (11/10/2026): Apple reads this file, served from public/, as JSON
      // (a file without extension is otherwise served as application/octet-stream).
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      // Booking pages carry the traveller's manage key in their URL: never send it to another site in
      // a Referer, never index them, never cache them. ("same-origin" rather than "no-referrer": with
      // no-referrer, browsers post forms with "Origin: null", which server actions reject without JavaScript.)
      // The short link of the SMS and emails (27/10/2026): the code behind /a/ opens a booking, same care.
      {
        source: "/a/:path*",
        headers: [
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
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
