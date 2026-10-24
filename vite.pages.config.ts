import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const base = process.env.GITHUB_PAGES_BASE_PATH || "/invitacion-revelacion/";

export default defineConfig({
  base: base.endsWith("/") ? base : `${base}/`,
  plugins: [react()],
  build: {
    outDir: "pages-out",
    emptyOutDir: true,
  },
});
