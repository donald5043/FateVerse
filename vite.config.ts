import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  // `vite preview` uses the serve command too, so command-based detection
  // makes production assets resolve from `/` and leaves a blank page.
  base: mode === 'production' ? '/FateVerse/' : '/',
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
        // 應用主程式包含完整命理計算資料，仍屬單一 chunk，放寬上限讓它進入預快取。
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
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
