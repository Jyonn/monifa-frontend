import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Monifa",
        short_name: "Monifa",
        description: "A multi-SSO TOTP authenticator",
        theme_color: "#173f3a",
        background_color: "#f4f7f3",
        display: "standalone",
        start_url: "/#/tokens",
        icons: [{ src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }]
      },
      workbox: {
        navigateFallback: "index.html",
        runtimeCaching: []
      }
    })
  ]
});
