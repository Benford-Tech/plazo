import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

// The API answers under /api on the same origin (see the repository's vercel.json); in
// development the Vite server forwards those calls to the local backend.
const apiProxy = { "/api": { target: process.env.API_PROXY_TARGET ?? "http://localhost:3005", changeOrigin: true } };

export default defineConfig({
  // The pro space is served under /pro on the Plazo domain. The files are written under dist/pro
  // so that their path in the output matches the public URL (Vercel does not strip the prefix).
  base: "/pro/",
  build: { outDir: "dist/pro", emptyOutDir: true },
  server: {
    host: true,
    port: 8080,
    // product.json (the single source of the product name) lives at the repository root.
    fs: { allow: [".."] },
    proxy: apiProxy,
  },
  preview: { proxy: apiProxy },
  plugins: [react()],
  // Module workers (layout search, MapLibre).
  worker: { format: "es" },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
