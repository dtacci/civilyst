if (!self.define) {
  let s,
    e = {};
  const n = (n, a) => (
    (n = new URL(n + '.js', a).href),
    e[n] ||
      new Promise((e) => {
        if ('document' in self) {
          const s = document.createElement('script');
          ((s.src = n), (s.onload = e), document.head.appendChild(s));
        } else ((s = n), importScripts(n), e());
      }).then(() => {
        let s = e[n];
        if (!s) throw new Error(`Module ${n} didn’t register its module`);
        return s;
      })
  );
  self.define = (a, t) => {
    const i =
      s ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (e[i]) return;
    let c = {};
    const r = (s) => n(s, i),
      u = { module: { uri: i }, exports: c, require: r };
    e[i] = Promise.all(a.map((s) => u[s] || r(s))).then((s) => (t(...s), c));
  };
}
define(['./workbox-b8918663'], function (s) {
  'use strict';
  (importScripts('fallback-qysjtansDO8uBn79eMrAl.js'),
    self.skipWaiting(),
    s.clientsClaim(),
    s.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: '1d0c77b8a5e29d277dc573203487098f',
        },
        {
          url: '/_next/dynamic-css-manifest.json',
          revision: 'fe98ca6effd7235d56f644a56c027db5',
        },
        {
          url: '/_next/static/chunks/1111-8014ef681280b25f.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/1153-2c94d0f5cafe6926.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/1684-790d8e38e17c008f.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/1851-2829c74acda2b863.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/191-e9f43d2c0871906a.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/2308-ea49a2d277c7a4ac.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/2642.70c1c639a2babd2b.js',
          revision: '70c1c639a2babd2b',
        },
        {
          url: '/_next/static/chunks/3055.09b8a68c5c2ff4bc.js',
          revision: '09b8a68c5c2ff4bc',
        },
        {
          url: '/_next/static/chunks/3296-c8c7d1c38d7f4efd.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/3363-04fb59c7945865d2.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/3948-d59dfb7b657cc8db.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/4212-23bd87801b59d9e3.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/4566-0d2ae4c558040bc3.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/4bd1b696-b6b1e12afd076b8e.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/5585-de87f31a31dae374.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/6874-887ac2c6c9c9973d.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/6956.6c2fd72d62af1157.js',
          revision: '6c2fd72d62af1157',
        },
        {
          url: '/_next/static/chunks/7243-e6bb99b40e9b3818.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/7693.fe7b966a7c440da3.js',
          revision: 'fe7b966a7c440da3',
        },
        {
          url: '/_next/static/chunks/7890-bfd8769fedc877e0.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/8152-20546b5494f80873.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/8501-7727106d3ff00220.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/9572-71085c34fac41318.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-eb128c0f673cdb10.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/admin/services/page-ce5fc9060abc2a62.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/api/health/integrations/route-b0299afd1e0571e8.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/api/push/subscribe/route-789b4fd89eebf16f.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/api/push/unsubscribe/route-926329f2f7600936.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/api/uploadthing/route-c47e780ba6a66a4f.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-activity/route-6e7bdc2698eef998.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-preferences/route-9628acd7bf424492.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-stats/route-b23009f3c929774c.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/campaigns/%5Bid%5D/page-bb919f36cc4f6106.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/campaigns/create/page-27eae933ad2d668c.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/campaigns/page-7dd90383054c135a.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-3577810d05ac92db.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/demo/voting-interface/page-a38cbaa11045ed4a.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/layout-48a042e6174bcd5c.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/notifications/page-e747ac5f5ca52e60.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/offline/page-ef8e52d122f92085.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/page-a25c1eac8de6723c.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/sign-in/%5B%5B...sign-in%5D%5D/page-a38875967f0cec0c.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/app/sign-up/%5B%5B...sign-up%5D%5D/page-2eeecae2eb00eb83.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/c36f3faa-a21efcfdbd85d7e1.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/d0deef33.aff3d46b768f00e5.js',
          revision: 'aff3d46b768f00e5',
        },
        {
          url: '/_next/static/chunks/framework-fda66049c8bbcca5.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/main-57db515bf10dbc3a.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/main-app-8979f47845b85829.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/pages/_app-eb694f3fd49020c8.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/pages/_error-2b3482c094a540b4.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-8fbfa3f4bd26c071.js',
          revision: 'qysjtansDO8uBn79eMrAl',
        },
        {
          url: '/_next/static/css/1de76be520b4de19.css',
          revision: '1de76be520b4de19',
        },
        {
          url: '/_next/static/css/5ebebf0107946a11.css',
          revision: '5ebebf0107946a11',
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
        {
          url: '/_next/static/qysjtansDO8uBn79eMrAl/_buildManifest.js',
          revision: '186b2914e863a752b430521569284455',
        },
        {
          url: '/_next/static/qysjtansDO8uBn79eMrAl/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/file.svg', revision: 'd09f95206c3fa0bb9bd9fefabfd0ea71' },
        { url: '/globe.svg', revision: '2aaafa6a49b6563925fe440891e32717' },
        { url: '/manifest.json', revision: 'd72db892212e6fd855b3a20e05b58bb5' },
        { url: '/next.svg', revision: '8e061864f388b47f33a1c3780831193e' },
        {
          url: '/notification-handler.js',
          revision: '1c802f931bdfb35444e4f50b1203d132',
        },
        { url: '/offline', revision: 'qysjtansDO8uBn79eMrAl' },
        { url: '/vercel.svg', revision: 'c0af2f507b369b085b35ef4bbe3bcf1e' },
        { url: '/window.svg', revision: 'a2760511c65806022ad20adf74370ff3' },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    s.cleanupOutdatedCaches(),
    s.registerRoute(
      '/',
      new s.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({
              request: s,
              response: e,
              event: n,
              state: a,
            }) =>
              e && 'opaqueredirect' === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: e.headers,
                  })
                : e,
          },
          { handlerDidError: async ({ request: s }) => self.fallback(s) },
        ],
      }),
      'GET'
    ),
    s.registerRoute(
      /^https:\/\/fonts\.googleapis\.com/,
      new s.StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
        plugins: [
          new s.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 2592e3 }),
          { handlerDidError: async ({ request: s }) => self.fallback(s) },
        ],
      }),
      'GET'
    ),
    s.registerRoute(
      /^https:\/\/fonts\.gstatic\.com/,
      new s.CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
          new s.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 31536e3 }),
          { handlerDidError: async ({ request: s }) => self.fallback(s) },
        ],
      }),
      'GET'
    ),
    s.registerRoute(
      /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      new s.CacheFirst({
        cacheName: 'images',
        plugins: [
          new s.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 604800 }),
          { handlerDidError: async ({ request: s }) => self.fallback(s) },
        ],
      }),
      'GET'
    ),
    s.registerRoute(
      /^https:\/\/api\./,
      new s.NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        plugins: [
          new s.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 86400 }),
          { handlerDidError: async ({ request: s }) => self.fallback(s) },
        ],
      }),
      'GET'
    ),
    s.registerRoute(
      /\.(?:js|css)$/,
      new s.StaleWhileRevalidate({
        cacheName: 'static-resources',
        plugins: [
          new s.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 604800 }),
          { handlerDidError: async ({ request: s }) => self.fallback(s) },
        ],
      }),
      'GET'
    ));
});
