import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/myfi-icon.svg"],
      manifest: {
        name: "MyFi",
        short_name: "MyFi",
        description: "Controla tus ingresos, gastos y metas de ahorro.",
        theme_color: "#0B0D12",
        background_color: "#0B0D12",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/myfi-icon-48.png", sizes: "48x48", type: "image/png" },
          { src: "/icons/myfi-icon-72.png", sizes: "72x72", type: "image/png" },
          { src: "/icons/myfi-icon-96.png", sizes: "96x96", type: "image/png" },
          { src: "/icons/myfi-icon-144.png", sizes: "144x144", type: "image/png" },
          { src: "/icons/myfi-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icons/myfi-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ],
});
