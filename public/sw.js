if (!self.define) {
  let e,
    s = {};
  const i = (i, a) => (
    (i = new URL(i + '.js', a).href),
    s[i] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = i), (e.onload = s), document.head.appendChild(e));
        } else ((e = i), importScripts(i), s());
      }).then(() => {
        let e = s[i];
        if (!e) throw new Error(`Module ${i} didn’t register its module`);
        return e;
      })
  );
  self.define = (a, t) => {
    const n =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (s[n]) return;
    let c = {};
    const r = (e) => i(e, n),
      u = { module: { uri: n }, exports: c, require: r };
    s[n] = Promise.all(a.map((e) => u[e] || r(e))).then((e) => (t(...e), c));
  };
}
define(['./workbox-b8918663'], function (e) {
  'use strict';
  (importScripts('fallback-DH0iY1BPh-CWEVqYPhaRt.js'),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: 'e670d3dbbd1c4a1901a5b069fb55921d',
        },
        {
          url: '/_next/dynamic-css-manifest.json',
          revision: 'fe98ca6effd7235d56f644a56c027db5',
        },
        {
          url: '/_next/static/DH0iY1BPh-CWEVqYPhaRt/_buildManifest.js',
          revision: '5e73fe8691dded591952352b6c3ad536',
        },
        {
          url: '/_next/static/DH0iY1BPh-CWEVqYPhaRt/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/1111-8014ef681280b25f.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/1153-2c94d0f5cafe6926.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/1684-790d8e38e17c008f.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/1851-2829c74acda2b863.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/191-e9f43d2c0871906a.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/2308-ea49a2d277c7a4ac.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
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
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/3363-04fb59c7945865d2.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/3948-d59dfb7b657cc8db.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/4212-23bd87801b59d9e3.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/4566-0d2ae4c558040bc3.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/4bd1b696-b6b1e12afd076b8e.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/5585-de87f31a31dae374.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/6874-887ac2c6c9c9973d.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/6956.6c2fd72d62af1157.js',
          revision: '6c2fd72d62af1157',
        },
        {
          url: '/_next/static/chunks/7243-e6bb99b40e9b3818.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/7693.fe7b966a7c440da3.js',
          revision: 'fe7b966a7c440da3',
        },
        {
          url: '/_next/static/chunks/7890-bfd8769fedc877e0.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/8152-20546b5494f80873.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/8501-7727106d3ff00220.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/9572-69f3024aff08468d.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-eb128c0f673cdb10.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/api/campaigns/%5BcampaignId%5D/pdf/route-97cd4cf807b605d9.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/api/campaigns/%5BcampaignId%5D/qr/route-87d8fbab2b14cb59.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/api/health/integrations/route-eb69afcaedbdd98b.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/api/push/subscribe/route-9216311117dce144.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/api/push/unsubscribe/route-38d95a37b8400276.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/api/uploadthing/route-73830d809af89551.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-activity/route-8f96e4a0c0c50fb7.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-preferences/route-d6e0fe741f51f38d.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-stats/route-352f56b3265dca3d.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/campaigns/%5Bid%5D/page-bb919f36cc4f6106.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/campaigns/create/page-3a45a724556cfa49.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/campaigns/page-7dd90383054c135a.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-49e6da1ba7e17e25.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/demo/voting-interface/page-a38cbaa11045ed4a.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/layout-f6b5b8b76f022ad7.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/notifications/page-e747ac5f5ca52e60.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/offline/page-ef8e52d122f92085.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/page-a25c1eac8de6723c.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/sign-in/%5B%5B...sign-in%5D%5D/page-a38875967f0cec0c.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/app/sign-up/%5B%5B...sign-up%5D%5D/page-2eeecae2eb00eb83.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/c36f3faa-a21efcfdbd85d7e1.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/d0deef33.aff3d46b768f00e5.js',
          revision: 'aff3d46b768f00e5',
        },
        {
          url: '/_next/static/chunks/framework-fda66049c8bbcca5.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/main-57db515bf10dbc3a.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/main-app-8979f47845b85829.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/pages/_app-eb694f3fd49020c8.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/pages/_error-2b3482c094a540b4.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-8fbfa3f4bd26c071.js',
          revision: 'DH0iY1BPh-CWEVqYPhaRt',
        },
        {
          url: '/_next/static/css/1de76be520b4de19.css',
          revision: '1de76be520b4de19',
        },
        {
          url: '/_next/static/css/68c4dcb03d076675.css',
          revision: '68c4dcb03d076675',
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
        { url: '/manifest.json', revision: '72143d457d3843bccb5371d6f8508f89' },
        { url: '/next.svg', revision: '8e061864f388b47f33a1c3780831193e' },
        {
          url: '/notification-handler.js',
          revision: '1c802f931bdfb35444e4f50b1203d132',
        },
        { url: '/offline', revision: 'DH0iY1BPh-CWEVqYPhaRt' },
        {
          url: '/sw-enhanced.js',
          revision: 'c8d839adb8d3ec1cedb33f360968a586',
        },
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
              event: i,
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
