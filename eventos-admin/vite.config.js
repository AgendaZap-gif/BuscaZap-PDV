import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:3002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  preview: {
    // Railway injeta PORT via variável de ambiente
    port: parseInt(process.env.PORT || "3000", 10),
    host: "0.0.0.0",
    allowedHosts: "all",
  },
});
