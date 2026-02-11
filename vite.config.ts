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
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    }),
    cspPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // @ts-expect-error Deno global is not typed in standard Vite config
  base: Deno.env.get("BASE_PATH") ?? "/",
});

// Simple Vite plugin to inject CSP meta tag
function cspPlugin() {
  return {
    name: 'html-inject-csp',
    transformIndexHtml(html: string, { server }: { server?: unknown }) {
      // If server exists, we are in dev mode (npm run dev / deno task dev)
      // We need to allow 'ws:' and 'wss:' for HMR
      const isDev = !!server;

      const cspDirectives = [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'", // Allow WS in dev
        "img-src 'self' data:",
        isDev ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'",
        isDev ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'",
        "object-src 'none'"
      ];

      const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${cspDirectives.join('; ')}">`;

      return html.replace('</head>', `${cspMeta}</head>`);
    }
  }
}
