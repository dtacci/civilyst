if (!self.define) {
  let e,
    s = {};
  const c = (c, a) => (
    (c = new URL(c + '.js', a).href),
    s[c] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = c), (e.onload = s), document.head.appendChild(e));
        } else ((e = c), importScripts(c), s());
      }).then(() => {
        let e = s[c];
        if (!e) throw new Error(`Module ${c} didn’t register its module`);
        return e;
      })
  );
  self.define = (a, i) => {
    const n =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (s[n]) return;
    let t = {};
    const r = (e) => c(e, n),
      f = { module: { uri: n }, exports: t, require: r };
    s[n] = Promise.all(a.map((e) => f[e] || r(e))).then((e) => (i(...e), t));
  };
}
define(['./workbox-b8918663'], function (e) {
  'use strict';
  (importScripts('fallback-YlFZPhpfRPYSVE9p5Jx6c.js'),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: '9ea4ebde7fbd3baa0b7b9d2367d8eed7',
        },
        {
          url: '/_next/dynamic-css-manifest.json',
          revision: 'fe98ca6effd7235d56f644a56c027db5',
        },
        {
          url: '/_next/static/YlFZPhpfRPYSVE9p5Jx6c/_buildManifest.js',
          revision: '50121b72fbd71a9a1546e4db46d79ca5',
        },
        {
          url: '/_next/static/YlFZPhpfRPYSVE9p5Jx6c/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/16-28a3ec81468851f6.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/4bd1b696-921580ef234ad610.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/501-ec69e90715690a77.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/514-61974bd2ed5dead1.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/642.bee4794bd13fe730.js',
          revision: 'bee4794bd13fe730',
        },
        {
          url: '/_next/static/chunks/684-1dcf0117d5b8d093.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/693.00bfe48bf2822819.js',
          revision: '00bfe48bf2822819',
        },
        {
          url: '/_next/static/chunks/778-3cc80d769d67307e.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/807-e3e5e39982851435.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/849-da2a562a5a7a9b75.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/874-6cd6e2ad4bfc24c4.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/948-781c1bf2733c2223.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/956.294cd105076f1b1a.js',
          revision: '294cd105076f1b1a',
        },
        {
          url: '/_next/static/chunks/981.477c33b4c46a9108.js',
          revision: '477c33b4c46a9108',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-7366c63bd823144a.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/app/api/uploadthing/route-836b2bc38fb0eeaf.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/app/campaigns/%5Bid%5D/page-af8d7379fcf54a7b.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/app/campaigns/create/page-fa7f405f76520134.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/app/campaigns/page-d6095e452068a51f.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-60348c0e82b13e01.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/app/layout-feea938784504c1e.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/app/offline/page-dbecebdab946f53b.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/app/page-f6c56c21a8670b75.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/app/sign-in/%5B%5B...sign-in%5D%5D/page-63652d9a0f7cbbbb.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/app/sign-up/%5B%5B...sign-up%5D%5D/page-b7e0d604a9a69df8.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/c36f3faa-a21efcfdbd85d7e1.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/d0deef33.d8e4dae5397587ae.js',
          revision: 'd8e4dae5397587ae',
        },
        {
          url: '/_next/static/chunks/framework-f593a28cde54158e.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/main-1ded44660d56e319.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/main-app-74ed7925eb71e762.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/pages/_app-da15c11dea942c36.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/pages/_error-cc3f077a18ea1793.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-c0cd94a13807db6e.js',
          revision: 'YlFZPhpfRPYSVE9p5Jx6c',
        },
        {
          url: '/_next/static/css/1de76be520b4de19.css',
          revision: '1de76be520b4de19',
        },
        {
          url: '/_next/static/css/67d4b77f280caf97.css',
          revision: '67d4b77f280caf97',
        },
        {
          url: '/_next/static/css/7d849d9c579d48cb.css',
          revision: '7d849d9c579d48cb',
        },
        {
          url: '/_next/static/media/569ce4b8f30dc480-s.p.woff2',
          revision: 'ef6cefb32024deac234e82f932a95cbd',
        },
        {
          url: '/_next/static/media/747892c23ea88013-s.woff2',
          revision: 'a0761690ccf4441ace5cec893b82d4ab',
        },
        {
          url: '/_next/static/media/8d697b304b401681-s.woff2',
          revision: 'cc728f6c0adb04da0dfcb0fc436a8ae5',
        },
        {
          url: '/_next/static/media/93f479601ee12b01-s.p.woff2',
          revision: 'da83d5f06d825c5ae65b7cca706cb312',
        },
        {
          url: '/_next/static/media/9610d9e46709d722-s.woff2',
          revision: '7b7c0ef93df188a852344fc272fc096b',
        },
        {
          url: '/_next/static/media/ba015fad6dcf6784-s.woff2',
          revision: '8ea4f719af3312a055caf09f34c89a77',
        },
        {
          url: '/_next/static/media/layers-2x.9859cd12.png',
          revision: '9859cd12',
        },
        {
          url: '/_next/static/media/layers.ef6db872.png',
          revision: 'ef6db872',
        },
        {
          url: '/_next/static/media/marker-icon.d577052a.png',
          revision: 'd577052a',
        },
        { url: '/file.svg', revision: 'd09f95206c3fa0bb9bd9fefabfd0ea71' },
        { url: '/globe.svg', revision: '2aaafa6a49b6563925fe440891e32717' },
        { url: '/manifest.json', revision: 'd72db892212e6fd855b3a20e05b58bb5' },
        { url: '/next.svg', revision: '8e061864f388b47f33a1c3780831193e' },
        { url: '/offline', revision: 'YlFZPhpfRPYSVE9p5Jx6c' },
        { url: '/vercel.svg', revision: 'c0af2f507b369b085b35ef4bbe3bcf1e' },
        { url: '/window.svg', revision: 'a2760511c65806022ad20adf74370ff3' },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: c,
              state: a,
            }) =>
              s && 'opaqueredirect' === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: s.headers,
                  })
                : s,
          },
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/fonts\.googleapis\.com/,
      new e.StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 2592e3 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/fonts\.gstatic\.com/,
      new e.CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 31536e3 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      new e.CacheFirst({
        cacheName: 'images',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 604800 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/api\./,
      new e.NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 86400 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:js|css)$/,
      new e.StaleWhileRevalidate({
        cacheName: 'static-resources',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 604800 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ));
});
