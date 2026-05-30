import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.jpeg', 'robots.txt', 'sitemap.xml', 'offline.html'],
      manifestFilename: 'manifest.json',
      manifest: {
        name: 'InfermieriWeb',
        short_name: 'InfermieriWeb',
        description: 'Assistenza infermieristica a domicilio a Lucca e provincia.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#00897b',
        icons: [
          {
            src: '/logo.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
          {
            src: '/logo.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/offline.html',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,json}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
