if (!self.define) {
  let a,
    e = {};
  const t = (t, s) => (
    (t = new URL(t + '.js', s).href),
    e[t] ||
      new Promise((e) => {
        if ('document' in self) {
          const a = document.createElement('script');
          ((a.src = t), (a.onload = e), document.head.appendChild(a));
        } else ((a = t), importScripts(t), e());
      }).then(() => {
        let a = e[t];
        if (!a) throw new Error(`Module ${t} didn’t register its module`);
        return a;
      })
  );
  self.define = (s, i) => {
    const n =
      a ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (e[n]) return;
    let c = {};
    const r = (a) => t(a, n),
      o = { module: { uri: n }, exports: c, require: r };
    e[n] = Promise.all(s.map((a) => o[a] || r(a))).then((a) => (i(...a), c));
  };
}
define(['./workbox-b8918663'], function (a) {
  'use strict';
  (importScripts('fallback-tabXt362FCDG6a4aarvo6.js'),
    self.skipWaiting(),
    a.clientsClaim(),
    a.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: 'b69473be172cc8bd1ef33ab02cf656df',
        },
        {
          url: '/_next/dynamic-css-manifest.json',
          revision: 'fe98ca6effd7235d56f644a56c027db5',
        },
        {
          url: '/_next/static/chunks/1010.df593eec351502e2.js',
          revision: 'df593eec351502e2',
        },
        {
          url: '/_next/static/chunks/1565-e46cfd9b951b003c.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/164f4fb6-a3c05d4f2d31ca8f.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/1655-40cacf74bfded76b.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/1684-4157b74a5b2a61c5.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/1851-8a53c32037a458d2.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/2121.53188f93655a7ff0.js',
          revision: '53188f93655a7ff0',
        },
        {
          url: '/_next/static/chunks/2642.f64fd44b0ffbcfe3.js',
          revision: 'f64fd44b0ffbcfe3',
        },
        {
          url: '/_next/static/chunks/2752-498670a5a9f534be.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/3363-61b5cbb82600e0f8.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/3948-259f3ae796ee6718.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/4212-eaddcf68b96eb05b.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/4887-d3e7b4ed0bf874e7.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/4bd1b696-f81b7abc2acabc57.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/5585-dccf84f60967d027.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/5905-049d9a3fe80b8ce5.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/6874-6de7143ac6046bdc.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/6956.95418448db429c92.js',
          revision: '95418448db429c92',
        },
        {
          url: '/_next/static/chunks/7265-09b6418e122497b7.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/7693.430a238a70f97387.js',
          revision: '430a238a70f97387',
        },
        {
          url: '/_next/static/chunks/8149-96a8f7f554d6cfc0.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/822.d1eebe7df2d8fc0a.js',
          revision: 'd1eebe7df2d8fc0a',
        },
        {
          url: '/_next/static/chunks/8304-3e7f1a69556161f0.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/8501-3e9f772b65e11a7b.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/8998-1a21d93c9dccd105.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/9090-71914bcf88b44616.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/9111-231b31f71f65d0bf.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/927-0ca557f3779a1340.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/9557-8747cbf13c2a8e63.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/ad2866b8.1fc071285e350c45.js',
          revision: '1fc071285e350c45',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-15c0c74850ad5495.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/api/campaigns/%5BcampaignId%5D/pdf/route-dce66319bbf44d53.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/api/campaigns/%5BcampaignId%5D/qr/route-8954fa17db3aa4fc.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/api/health/integrations/route-f2c027ff6d59c683.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/api/push/subscribe/route-bfd8bfb202a4263e.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/api/push/unsubscribe/route-3b772dcaef373cfd.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/api/uploadthing/route-a3ef1058d46e08c5.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-activity/route-652488a7a8204cdb.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-preferences/route-97d31ad14a602163.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-stats/route-5cc32a9c03f584f0.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/api/webhooks/clerk/route-eabbe1dd0a59228a.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/campaigns/%5Bid%5D/page-29e8806aa5d93f89.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/campaigns/create/page-0349b51132024acf.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/campaigns/page-83e6d98df7aa6139.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-e41133604965e8d9.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/demo/voting-interface/page-4dd76aab3368792f.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/layout-2f7c87096204d2a6.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/notifications/page-0deee86e5c6fc031.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/offline/page-5f857ffcc19e852f.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/onboarding/page-e2c4011b647d9505.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/page-fa0fea6deec428d8.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/profile/page-4d9820585ae79c9e.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/settings/page-1ae58043694dc14f.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/sign-in/%5B%5B...sign-in%5D%5D/page-5fb75ac597a4c9b6.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/sign-up/%5B%5B...sign-up%5D%5D/page-bb8a3ef83b7c7a18.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/app/unsubscribe/page-83299af47a2fa52f.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/bc98253f.a20b3a3cf1b114d6.js',
          revision: 'a20b3a3cf1b114d6',
        },
        {
          url: '/_next/static/chunks/c36f3faa-e94a85796d821bf1.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/d0deef33.a586094e67e92d1c.js',
          revision: 'a586094e67e92d1c',
        },
        {
          url: '/_next/static/chunks/framework-82b67a6346ddd02b.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/main-app-3b5432ead1eb4da2.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/main-dc8ca1614292a62a.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/pages/_app-5d1abe03d322390c.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/pages/_error-3b2a1d523de49635.js',
          revision: 'tabXt362FCDG6a4aarvo6',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-74785a466bdc8f73.js',
          revision: 'tabXt362FCDG6a4aarvo6',
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
          url: '/_next/static/css/9908e91d3a855252.css',
          revision: '9908e91d3a855252',
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
          url: '/_next/static/tabXt362FCDG6a4aarvo6/_buildManifest.js',
          revision: 'cd92845c5ab682c5c840ccbcacb4e21d',
        },
        {
          url: '/_next/static/tabXt362FCDG6a4aarvo6/_ssgManifest.js',
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
        { url: '/offline', revision: 'tabXt362FCDG6a4aarvo6' },
        {
          url: '/sw-enhanced.js',
          revision: '0186e7decb47ea27ce2bfd30657bcf3f',
        },
        { url: '/vercel.svg', revision: 'c0af2f507b369b085b35ef4bbe3bcf1e' },
        { url: '/window.svg', revision: 'a2760511c65806022ad20adf74370ff3' },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    a.cleanupOutdatedCaches(),
    a.registerRoute(
      '/',
      new a.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({
              request: a,
              response: e,
              event: t,
              state: s,
            }) =>
              e && 'opaqueredirect' === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: e.headers,
                  })
                : e,
          },
          { handlerDidError: async ({ request: a }) => self.fallback(a) },
        ],
      }),
      'GET'
    ),
    a.registerRoute(
      /^https:\/\/fonts\.googleapis\.com/,
      new a.StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 2592e3 }),
          { handlerDidError: async ({ request: a }) => self.fallback(a) },
        ],
      }),
      'GET'
    ),
    a.registerRoute(
      /^https:\/\/fonts\.gstatic\.com/,
      new a.CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 31536e3 }),
          { handlerDidError: async ({ request: a }) => self.fallback(a) },
        ],
      }),
      'GET'
    ),
    a.registerRoute(
      /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      new a.CacheFirst({
        cacheName: 'images',
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 604800 }),
          { handlerDidError: async ({ request: a }) => self.fallback(a) },
        ],
      }),
      'GET'
    ),
    a.registerRoute(
      /^https:\/\/api\./,
      new a.NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 86400 }),
          { handlerDidError: async ({ request: a }) => self.fallback(a) },
        ],
      }),
      'GET'
    ),
    a.registerRoute(
      /\.(?:js|css)$/,
      new a.StaleWhileRevalidate({
        cacheName: 'static-resources',
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 604800 }),
          { handlerDidError: async ({ request: a }) => self.fallback(a) },
        ],
      }),
      'GET'
    ));
});
