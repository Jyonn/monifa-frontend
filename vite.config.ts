import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/logo-192.png", "icons/logo-512.png"],
      manifest: {
        name: "Monifa",
        short_name: "Monifa",
        description: "A multi-SSO TOTP authenticator",
        theme_color: "#173f3a",
        background_color: "#f4f7f3",
        display: "standalone",
        start_url: "/#/tokens",
        icons: [
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "icons/logo-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "icons/logo-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        navigateFallback: "index.html",
        runtimeCaching: []
      }
    })
  ]
});
