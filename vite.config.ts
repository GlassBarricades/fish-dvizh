import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'FishDvizh',
        short_name: 'FishDvizh',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#0b7285',
        background_color: '#ffffff',
        description: 'SPA для рыболовного спорта',
        icons: [
          // Добавьте свои PNG иконки в папку public/icons и раскомментируйте
          // {
          //   src: '/icons/pwa-192x192.png',
          //   sizes: '192x192',
          //   type: 'image/png'
          // },
          // {
          //   src: '/icons/pwa-512x512.png',
          //   sizes: '512x512',
          //   type: 'image/png'
          // }
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
