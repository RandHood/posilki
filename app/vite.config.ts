import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pkg from './package.json' with { type: 'json' };

// meals.json and products.json stay at the repo root, where the daily store job and the weekly meals task write them.
const DATA = ['meals.json', 'products.json'];
const fromRoot = (name: string) => fileURLToPath(new URL(`../${name}`, import.meta.url));
function rootData(): Plugin {
  return {
    name: 'posilki-root-data',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = DATA.find((n) => req.url?.split('?')[0].endsWith(`/${n}`));
        if (!name) return next();
        res.setHeader('Content-Type', 'application/json');
        res.end(readFileSync(fromRoot(name)));
      });
    },
    generateBundle() {
      for (const name of DATA) this.emitFile({ type: 'asset', fileName: name, source: readFileSync(fromRoot(name)) });
    },
  };
}

// GitHub Pages serves the app from /posilki/. A preview build (PREVIEW=1) goes to /posilki/next/
// and keeps its data under its own storage key, so it never touches the real app's data.
const preview = process.env.PREVIEW === '1';
const base = preview ? '/posilki/next/' : '/posilki/';

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __PREVIEW__: JSON.stringify(preview),
  },
  plugins: [
    preact(),
    rootData(),
    VitePWA({
      registerType: 'prompt',
      // Same file name as the old hand-written service worker, so phones swap one for the other.
      filename: 'sw.js',
      includeAssets: ['apple-touch-icon.png', 'icon-192.png'],
      manifest: {
        name: preview ? 'Posiłki preview' : 'Posiłki',
        short_name: preview ? 'Posiłki next' : 'Posiłki',
        description: 'Meal suggestions, meal prep and shopping lists for stores in Poland and Iceland.',
        lang: 'en',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#EDF0EA',
        theme_color: '#EDF0EA',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // meals.json and products.json change every day, so they are not baked into the app.
        globPatterns: ['**/*.{js,css,html,png,woff2}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Network first so new meals and prices arrive on the next open; the last copy offline.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /\/(meals|products)\.json$/.test(url.pathname),
            handler: 'NetworkFirst',
            options: { cacheName: preview ? 'posilki-next-data' : 'posilki-data', networkTimeoutSeconds: 6 },
          },
        ],
      },
    }),
  ],
});
