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
    let t = {};
    const r = (e) => i(e, c),
      j = { module: { uri: c }, exports: t, require: r };
    s[c] = Promise.all(a.map((e) => j[e] || r(e))).then((e) => (n(...e), t));
  };
}
define(['./workbox-b8918663'], function (e) {
  'use strict';
  (importScripts('fallback-wb5E1YQmTlxFj8Xj3eDOj.js'),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: 'fc8acbd01d14f9b0623139fc531bffb2',
        },
        {
          url: '/_next/dynamic-css-manifest.json',
          revision: 'fe98ca6effd7235d56f644a56c027db5',
        },
        {
          url: '/_next/static/chunks/1565-ae6669edc6621bc2.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/164f4fb6-a3c05d4f2d31ca8f.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/1655-cac58378038fd6ad.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/1684-796efe6b984dc80b.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/1851-22f3e0f3d7a327d2.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/2121.53188f93655a7ff0.js',
          revision: '53188f93655a7ff0',
        },
        {
          url: '/_next/static/chunks/2642.24e97033fad3d1bc.js',
          revision: '24e97033fad3d1bc',
        },
        {
          url: '/_next/static/chunks/2752-abdc5efcaeab3c63.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/3055.93dc775b56719424.js',
          revision: '93dc775b56719424',
        },
        {
          url: '/_next/static/chunks/3363-180294686dd520b3.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/365-d9a17da077696b7f.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/3948-2e8aa56bf99f35bc.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/4212-faa113b8f5a6e5dd.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/4bd1b696-cc2c6103cc5f82c2.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/5556-c8f042bb940bb82e.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/5585-eb08b815b55c9f09.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/5703-a8cd78f32844d195.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/6057-12b5309ef6d55e5d.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/6874-a1e4f78fba63ad69.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/6956.95418448db429c92.js',
          revision: '95418448db429c92',
        },
        {
          url: '/_next/static/chunks/7265-0e7eadf9290bc09a.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/7693.430a238a70f97387.js',
          revision: '430a238a70f97387',
        },
        {
          url: '/_next/static/chunks/794-aeb39fc14e3c9064.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/822.d1eebe7df2d8fc0a.js',
          revision: 'd1eebe7df2d8fc0a',
        },
        {
          url: '/_next/static/chunks/8304-cf89e945ef92688b.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/8501-b4fb970d885a5abe.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/9111-f05641e5da6f2e82.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/927-0ca557f3779a1340.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/ad2866b8.1fc071285e350c45.js',
          revision: '1fc071285e350c45',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-21082a9ca1ccbe7a.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/api/campaigns/%5BcampaignId%5D/pdf/route-863d167624b63596.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/api/campaigns/%5BcampaignId%5D/qr/route-f76c11d7421ed9dd.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/api/health/integrations/route-35e237d93f4e9038.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/api/push/subscribe/route-656c2d5b507eb970.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/api/push/unsubscribe/route-8780c485a369464a.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/api/uploadthing/route-c9dba0415b868a32.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-activity/route-2378c65a9df1eba9.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-preferences/route-3796b04da1b0a228.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-stats/route-012345f7b6ebff3d.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/campaigns/%5Bid%5D/page-05145bb2c96f7ba0.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/campaigns/create/page-286c754d363e4d45.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/campaigns/page-9edbbc34d82d4822.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-bc3a8abb8e41ef6b.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/demo/voting-interface/page-d9db9218340fefd4.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/layout-c981abccae88affb.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/notifications/page-0cfb6c128cf3ec34.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/offline/page-0214c62a4c75a71c.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/page-561aef2f29256fb0.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/profile/page-7ec2828aba6bba1d.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/settings/page-d708a5ec012829ac.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/sign-in/%5B%5B...sign-in%5D%5D/page-db7ece6ad930e5c2.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/app/sign-up/%5B%5B...sign-up%5D%5D/page-ebd31475e625a10c.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/bc98253f.a20b3a3cf1b114d6.js',
          revision: 'a20b3a3cf1b114d6',
        },
        {
          url: '/_next/static/chunks/c36f3faa-e94a85796d821bf1.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/d0deef33.a586094e67e92d1c.js',
          revision: 'a586094e67e92d1c',
        },
        {
          url: '/_next/static/chunks/framework-82b67a6346ddd02b.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/main-app-3b5432ead1eb4da2.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/main-dc8ca1614292a62a.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/pages/_app-5d1abe03d322390c.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/pages/_error-3b2a1d523de49635.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-086d2e161a5d3f1e.js',
          revision: 'wb5E1YQmTlxFj8Xj3eDOj',
        },
        {
          url: '/_next/static/css/1de76be520b4de19.css',
          revision: '1de76be520b4de19',
        },
        {
          url: '/_next/static/css/6c90bbbbfe2fe5b9.css',
          revision: '6c90bbbbfe2fe5b9',
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
          url: '/_next/static/wb5E1YQmTlxFj8Xj3eDOj/_buildManifest.js',
          revision: '86172ada00fc76f8c469e9fcfef6c931',
        },
        {
          url: '/_next/static/wb5E1YQmTlxFj8Xj3eDOj/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/file.svg', revision: 'd09f95206c3fa0bb9bd9fefabfd0ea71' },
        { url: '/globe.svg', revision: '2aaafa6a49b6563925fe440891e32717' },
        { url: '/manifest.json', revision: '72143d457d3843bccb5371d6f8508f89' },
        { url: '/next.svg', revision: '8e061864f388b47f33a1c3780831193e' },
        {
          url: '/notification-handler.js',
          revision: 'c80b0f8c16462a0ec565e965f92e4616',
        },
        { url: '/offline', revision: 'wb5E1YQmTlxFj8Xj3eDOj' },
        {
          url: '/sw-enhanced.js',
          revision: '0186e7decb47ea27ce2bfd30657bcf3f',
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
