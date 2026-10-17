import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Discord-ის preview-ს სრული მისამართი სჭირდება. Vercel build-ისას თავისი დომენი
// VERCEL_PROJECT_PRODUCTION_URL-შია; საკუთარი დომენისთვის SITE_URL ცვლადი დააყენე.
function siteUrl(): Plugin {
  const raw = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "";
  const url = raw ? (raw.startsWith("http") ? raw : `https://${raw}`).replace(/\/$/, "") : "";
  return {
    name: "site-url",
    transformIndexHtml: (html) => html.replaceAll("%SITE_URL%", url),
  };
}

// ლოკალურად /api/* მიდის Python სერვერზე (npm run api), Vercel-ზე — api/*.py ფუნქციებზე.
export default defineConfig({
  plugins: [react(), siteUrl()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    proxy: { "/api": `http://127.0.0.1:${process.env.API_PORT || 3001}` },
  },
});
