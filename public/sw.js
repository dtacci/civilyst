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
  self.define = (a, n) => {
    const c =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (s[c]) return;
    let r = {};
    const t = (e) => i(e, c),
      u = { module: { uri: c }, exports: r, require: t };
    s[c] = Promise.all(a.map((e) => u[e] || t(e))).then((e) => (n(...e), r));
  };
}
define(['./workbox-b8918663'], function (e) {
  'use strict';
  (importScripts('fallback-WxhZ0urp9PIb6gQIqLROI.js'),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: 'c5aa24cbcf94cca511cafe9c4f5c0553',
        },
        {
          url: '/_next/dynamic-css-manifest.json',
          revision: 'fe98ca6effd7235d56f644a56c027db5',
        },
        {
          url: '/_next/static/WxhZ0urp9PIb6gQIqLROI/_buildManifest.js',
          revision: '0b5af72ac5e1fdfc5948c4337a3d82c1',
        },
        {
          url: '/_next/static/WxhZ0urp9PIb6gQIqLROI/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/153-2f901fdd5ed655fe.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/16-722abc450f7ca02d.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/3-d0fb4a1360a005d1.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/363-769bc6b5835d3702.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/497-6fe1295f1e72c59e.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/4bd1b696-dd46c34cee0c339a.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/501-09068c691e9dd364.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/514-247d52a0f0ba3309.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/585-d5973c831b4a7f39.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/642.bee4794bd13fe730.js',
          revision: 'bee4794bd13fe730',
        },
        {
          url: '/_next/static/chunks/684-d1e0bf81e4a963c0.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/693.00bfe48bf2822819.js',
          revision: '00bfe48bf2822819',
        },
        {
          url: '/_next/static/chunks/874-8b3f9f57e6751791.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/948-16384ca1fa59228e.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
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
          url: '/_next/static/chunks/app/_not-found/page-dd73f858171215f0.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/app/admin/services/page-ad4bb18f5ca38d32.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/app/api/health/integrations/route-60b6ab8c2973e2aa.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/app/api/push/subscribe/route-6a27edbbd27b7c2c.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/app/api/push/unsubscribe/route-1fb1130fa96049b4.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/app/api/uploadthing/route-429d82d9434df0c5.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/app/campaigns/%5Bid%5D/page-4e26ce9143d9f765.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/app/campaigns/create/page-41f64a264a8097b8.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/app/campaigns/page-b02d789667386082.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-c6a4ccca5e981062.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/app/layout-6c583225492e8e29.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/app/offline/page-ea31d2655c028c30.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/app/page-85b366a01f6ac24b.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/app/sign-in/%5B%5B...sign-in%5D%5D/page-63652d9a0f7cbbbb.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/app/sign-up/%5B%5B...sign-up%5D%5D/page-b7e0d604a9a69df8.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/c36f3faa-a21efcfdbd85d7e1.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/d0deef33.d8e4dae5397587ae.js',
          revision: 'd8e4dae5397587ae',
        },
        {
          url: '/_next/static/chunks/framework-f593a28cde54158e.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/main-1ded44660d56e319.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/main-app-74ed7925eb71e762.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/pages/_app-da15c11dea942c36.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/pages/_error-cc3f077a18ea1793.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-483fe5685affe743.js',
          revision: 'WxhZ0urp9PIb6gQIqLROI',
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
          url: '/_next/static/css/8cc2fe63bf2ff9b2.css',
          revision: '8cc2fe63bf2ff9b2',
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
        { url: '/offline', revision: 'WxhZ0urp9PIb6gQIqLROI' },
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
