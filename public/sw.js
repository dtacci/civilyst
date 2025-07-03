if (!self.define) {
  let e,
    s = {};
  const t = (t, i) => (
    (t = new URL(t + '.js', i).href),
    s[t] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = t), (e.onload = s), document.head.appendChild(e));
        } else ((e = t), importScripts(t), s());
      }).then(() => {
        let e = s[t];
        if (!e) throw new Error(`Module ${t} didn’t register its module`);
        return e;
      })
  );
  self.define = (i, a) => {
    const n =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (s[n]) return;
    let c = {};
    const r = (e) => t(e, n),
      u = { module: { uri: n }, exports: c, require: r };
    s[n] = Promise.all(i.map((e) => u[e] || r(e))).then((e) => (a(...e), c));
  };
}
define(['./workbox-b8918663'], function (e) {
  'use strict';
  (importScripts('fallback-myKjru7Q_NtM_7dH56WeK.js'),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: '5113276fbbb839a2a57c9a43a5fe376d',
        },
        {
          url: '/_next/dynamic-css-manifest.json',
          revision: 'fe98ca6effd7235d56f644a56c027db5',
        },
        {
          url: '/_next/static/chunks/1111-8014ef681280b25f.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/1153-2c94d0f5cafe6926.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/1684-790d8e38e17c008f.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/1851-2829c74acda2b863.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/2308-ea49a2d277c7a4ac.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
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
          url: '/_next/static/chunks/3363-04fb59c7945865d2.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/3948-d59dfb7b657cc8db.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/4212-23bd87801b59d9e3.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/4566-8d7ebbf313a7785a.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/4bd1b696-b6b1e12afd076b8e.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/5426-645906d124cc9db5.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/5585-de87f31a31dae374.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/6874-887ac2c6c9c9973d.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/6956.6c2fd72d62af1157.js',
          revision: '6c2fd72d62af1157',
        },
        {
          url: '/_next/static/chunks/7243-e6bb99b40e9b3818.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/7693.fe7b966a7c440da3.js',
          revision: 'fe7b966a7c440da3',
        },
        {
          url: '/_next/static/chunks/7890-bfd8769fedc877e0.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/8152-20546b5494f80873.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/8501-7727106d3ff00220.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-eb128c0f673cdb10.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/admin/services/page-ce5fc9060abc2a62.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/api/health/integrations/route-b0299afd1e0571e8.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/api/push/subscribe/route-789b4fd89eebf16f.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/api/push/unsubscribe/route-926329f2f7600936.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/api/uploadthing/route-c47e780ba6a66a4f.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-activity/route-6e7bdc2698eef998.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-preferences/route-9628acd7bf424492.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-stats/route-b23009f3c929774c.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/campaigns/%5Bid%5D/page-27fc046e4d42e1d4.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/campaigns/create/page-733a774377e9ab97.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/campaigns/page-d7c7e59a27331295.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-6aadf54c582a295d.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/layout-48a042e6174bcd5c.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/notifications/page-e747ac5f5ca52e60.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/offline/page-ef8e52d122f92085.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/page-85de91650f18951d.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/sign-in/%5B%5B...sign-in%5D%5D/page-a38875967f0cec0c.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/app/sign-up/%5B%5B...sign-up%5D%5D/page-2eeecae2eb00eb83.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/c36f3faa-a21efcfdbd85d7e1.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/d0deef33.aff3d46b768f00e5.js',
          revision: 'aff3d46b768f00e5',
        },
        {
          url: '/_next/static/chunks/framework-fda66049c8bbcca5.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/main-57db515bf10dbc3a.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/main-app-8979f47845b85829.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/pages/_app-eb694f3fd49020c8.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/pages/_error-2b3482c094a540b4.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-8fbfa3f4bd26c071.js',
          revision: 'myKjru7Q_NtM_7dH56WeK',
        },
        {
          url: '/_next/static/css/1de76be520b4de19.css',
          revision: '1de76be520b4de19',
        },
        {
          url: '/_next/static/css/7d849d9c579d48cb.css',
          revision: '7d849d9c579d48cb',
        },
        {
          url: '/_next/static/css/d1aa2c7a491e6a43.css',
          revision: 'd1aa2c7a491e6a43',
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
          url: '/_next/static/myKjru7Q_NtM_7dH56WeK/_buildManifest.js',
          revision: 'cdeed2ca344b3567e503ac66e2983dea',
        },
        {
          url: '/_next/static/myKjru7Q_NtM_7dH56WeK/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/file.svg', revision: 'd09f95206c3fa0bb9bd9fefabfd0ea71' },
        { url: '/globe.svg', revision: '2aaafa6a49b6563925fe440891e32717' },
        { url: '/manifest.json', revision: 'd72db892212e6fd855b3a20e05b58bb5' },
        { url: '/next.svg', revision: '8e061864f388b47f33a1c3780831193e' },
        {
          url: '/notification-handler.js',
          revision: 'e69cb54285f3078c4fb79793c6ae6018',
        },
        { url: '/offline', revision: 'myKjru7Q_NtM_7dH56WeK' },
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
              event: t,
              state: i,
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
