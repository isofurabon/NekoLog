import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from "node:path"

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['nekolog.svg', 'THIRD-PARTY-NOTICES.txt'],
      manifest: {
        name: 'NekoLog',
        short_name: 'NekoLog',
        description: 'A modern, browser-based Android Logcat viewer.',
        theme_color: '#1e1e2e',
        background_color: '#1e1e2e',
        display: 'standalone',
        icons: [
          {
            src: 'nekolog.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'nekolog.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // @ts-expect-error Deno global is not typed in standard Vite config
  base: Deno.env.get("BASE_PATH") ?? "/",
})
