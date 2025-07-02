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
  (importScripts('fallback-oPCqraRiyFguAYBThjRk7.js'),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: 'e93b215aaf43af3f2ed67c5f99445fdf',
        },
        {
          url: '/_next/dynamic-css-manifest.json',
          revision: 'fe98ca6effd7235d56f644a56c027db5',
        },
        {
          url: '/_next/static/chunks/152-a3dfb708539be9d6.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/153-2f901fdd5ed655fe.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/212-48753bce66e8c879.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/318-617040f2fdbdfb33.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/363-047cdc3d323252c4.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/419-9d0cec582a9454c4.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/429-a684e6d93106a739.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/4bd1b696-2eab003e95522e3e.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/501-71f0c34dcffc3436.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/525-e86bd28a6e257ff5.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/585-7bc4cb2316f7482d.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/596.eb931fd91305c6d8.js',
          revision: 'eb931fd91305c6d8',
        },
        {
          url: '/_next/static/chunks/642.6c8222cc465952fe.js',
          revision: '6c8222cc465952fe',
        },
        {
          url: '/_next/static/chunks/684-5755810b66aa1586.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/693.00bfe48bf2822819.js',
          revision: '00bfe48bf2822819',
        },
        {
          url: '/_next/static/chunks/874-6ac2a318fa9c5bfb.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/890-924de14590c694a6.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/948-aa1f749d4f39d74c.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/956.294cd105076f1b1a.js',
          revision: '294cd105076f1b1a',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-abd906c67ef6c831.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/app/admin/services/page-0b37dfb14133be3b.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/app/api/health/integrations/route-60b6ab8c2973e2aa.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/app/api/push/subscribe/route-6a27edbbd27b7c2c.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/app/api/push/unsubscribe/route-1fb1130fa96049b4.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/app/api/uploadthing/route-429d82d9434df0c5.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/app/campaigns/%5Bid%5D/page-5ed471568c571702.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/app/campaigns/create/page-f471064691ad1420.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/app/campaigns/page-2dc1d41894854f38.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-d3ddec6aaa27384e.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/app/layout-8a699fcd4f4e1c13.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/app/offline/page-49c1e1c09541f755.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/app/page-60e8ca5dfeae71a2.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/app/sign-in/%5B%5B...sign-in%5D%5D/page-853140703848d4ed.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/app/sign-up/%5B%5B...sign-up%5D%5D/page-047cea79fabed44d.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/c36f3faa-a21efcfdbd85d7e1.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/d0deef33.d8e4dae5397587ae.js',
          revision: 'd8e4dae5397587ae',
        },
        {
          url: '/_next/static/chunks/framework-f593a28cde54158e.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/main-1f3d76e09e29c86a.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/main-app-74ed7925eb71e762.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/pages/_app-da15c11dea942c36.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/pages/_error-cc3f077a18ea1793.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-c228cca69a91630d.js',
          revision: 'oPCqraRiyFguAYBThjRk7',
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
          url: '/_next/static/css/cdd3010420edb1cc.css',
          revision: 'cdd3010420edb1cc',
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
          url: '/_next/static/oPCqraRiyFguAYBThjRk7/_buildManifest.js',
          revision: '0b5af72ac5e1fdfc5948c4337a3d82c1',
        },
        {
          url: '/_next/static/oPCqraRiyFguAYBThjRk7/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/file.svg', revision: 'd09f95206c3fa0bb9bd9fefabfd0ea71' },
        { url: '/globe.svg', revision: '2aaafa6a49b6563925fe440891e32717' },
        { url: '/manifest.json', revision: 'd72db892212e6fd855b3a20e05b58bb5' },
        { url: '/next.svg', revision: '8e061864f388b47f33a1c3780831193e' },
        { url: '/offline', revision: 'oPCqraRiyFguAYBThjRk7' },
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
