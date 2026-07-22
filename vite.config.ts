import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/FateVerse/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: false,
      includeAssets: ['favicon.svg', 'og.png', 'manifest.webmanifest'],
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,json,webmanifest}'],
        // Let Workbox see the lazily emitted WebLLM runtime, then remove it from
        // the app-shell manifest. The model and the multi-megabyte runtime must
        // only be fetched after the user explicitly enables local AI.
        maximumFileSizeToCacheInBytes: 7 * 1024 * 1024,
        manifestTransforms: [
          (entries) => ({
            manifest: entries.filter((entry) => entry.size <= 2 * 1024 * 1024),
            warnings: [],
          }),
        ],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/\/data\//, /\/assets\//],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
  },
}));
