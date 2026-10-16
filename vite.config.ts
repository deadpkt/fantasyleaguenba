import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ლოკალურად /api/data მიდის Python სერვერზე (npm run api), Vercel-ზე — api/data.py ფუნქციაზე.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/api": "http://127.0.0.1:3001" },
  },
});
