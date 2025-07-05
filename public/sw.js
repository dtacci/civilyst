if (!self.define) {
  let e,
    s = {};
  const i = (i, c) => (
    (i = new URL(i + '.js', c).href),
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
  self.define = (c, n) => {
    const a =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (s[a]) return;
    let r = {};
    const t = (e) => i(e, a),
      o = { module: { uri: a }, exports: r, require: t };
    s[a] = Promise.all(c.map((e) => o[e] || t(e))).then((e) => (n(...e), r));
  };
}
define(['./workbox-b8918663'], function (e) {
  'use strict';
  (importScripts('fallback-JohirFVpEC2Wj9jlkkPIq.js'),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: '710a881f65508a4a239303a735937a52',
        },
        {
          url: '/_next/dynamic-css-manifest.json',
          revision: 'fe98ca6effd7235d56f644a56c027db5',
        },
        {
          url: '/_next/static/JohirFVpEC2Wj9jlkkPIq/_buildManifest.js',
          revision: 'b5baafca86966401800d11f31b331df4',
        },
        {
          url: '/_next/static/JohirFVpEC2Wj9jlkkPIq/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/0e5ce63c-fc11b0897e49fd59.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/1029-1c83852a91f1ae23.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/1040-e028808ac8a23f4a.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/1404-211c9eb1eb86c907.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/164f4fb6-a3c05d4f2d31ca8f.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/1655-c41da0e3131f86c8.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/1684-56bdbef0a195637d.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/1851-40ec92073aec6794.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/1976-7188da39ab28ae79.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/2121.53188f93655a7ff0.js',
          revision: '53188f93655a7ff0',
        },
        {
          url: '/_next/static/chunks/2642.0f38acee601ccf8b.js',
          revision: '0f38acee601ccf8b',
        },
        {
          url: '/_next/static/chunks/2752-a0a896ee1dc9174c.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/3363-69304497b0912758.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/356-ed0dad44b4d74a56.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/3836.617c69bbd931444c.js',
          revision: '617c69bbd931444c',
        },
        {
          url: '/_next/static/chunks/3948-af28bef08e90119b.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/4015-21547e8a8a01ff08.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/4bd1b696-27e7bc1ce610e457.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/5347-9b421c9946257510.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/5477-ad957375908dd98e.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/5585-a042b533236da866.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/651-ab7a20cd65f04c6b.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/6744.fcb1d81fbb4e4010.js',
          revision: 'fcb1d81fbb4e4010',
        },
        {
          url: '/_next/static/chunks/6874-f0875d17d9c1ca5d.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/7265-3a8ddbbb94554da4.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/7317-905e8307fb945c85.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/7452-d739a2ddac92f75d.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/7561-495c55d80a9b1c3f.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/7693.430a238a70f97387.js',
          revision: '430a238a70f97387',
        },
        {
          url: '/_next/static/chunks/7929-a316648cc0d46d6b.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/822.d1eebe7df2d8fc0a.js',
          revision: 'd1eebe7df2d8fc0a',
        },
        {
          url: '/_next/static/chunks/8304-7af0489674d441c5.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/8501-d0527b586488caaa.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/9111-8330d3d0535fd5ad.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/9352-12379ea56bf86830.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/ad2866b8.1fc071285e350c45.js',
          revision: '1fc071285e350c45',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-4c645a5f7c6d017b.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/ai-demo/page-3a4245b7721ea952.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/api/campaigns/%5BcampaignId%5D/pdf/route-dce66319bbf44d53.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/api/campaigns/%5BcampaignId%5D/qr/route-8954fa17db3aa4fc.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/api/health/integrations/route-f2c027ff6d59c683.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/api/push/subscribe/route-bfd8bfb202a4263e.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/api/push/unsubscribe/route-3b772dcaef373cfd.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/api/uploadthing/route-a3ef1058d46e08c5.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-activity/route-652488a7a8204cdb.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-preferences/route-97d31ad14a602163.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-stats/route-5cc32a9c03f584f0.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/api/webhooks/clerk/route-eabbe1dd0a59228a.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/campaigns/%5Bid%5D/page-266853f15d94e3ce.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/campaigns/create/page-62957baf8e959b49.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/campaigns/page-6ab1ec27362eaa89.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-35d737422d6d1636.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/demo/voting-interface/page-8d09c7126a6d69c5.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/investment-demo/page-00c151a6726e6412.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/layout-725c89bb3326fc4f.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/notifications/page-0f7e1dd40664af26.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/offline/page-af1bb977bcbfa9c9.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/onboarding/page-cc70caadc82b557d.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/page-5407b80d239d92f2.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/profile/page-a8f7bb3b703b3a48.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/settings/page-ab19a39575708d1b.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/sign-in/%5B%5B...sign-in%5D%5D/page-ee0b7f8819c4116b.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/sign-up/%5B%5B...sign-up%5D%5D/page-7948bc63f03a4665.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/test-investment/page-6519f8c07e806c9d.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/app/unsubscribe/page-d32a46f0d126c779.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/bc98253f.a20b3a3cf1b114d6.js',
          revision: 'a20b3a3cf1b114d6',
        },
        {
          url: '/_next/static/chunks/c36f3faa-e94a85796d821bf1.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/d0deef33.a586094e67e92d1c.js',
          revision: 'a586094e67e92d1c',
        },
        {
          url: '/_next/static/chunks/framework-82b67a6346ddd02b.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/main-app-3b5432ead1eb4da2.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/main-dc8ca1614292a62a.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/pages/_app-5d1abe03d322390c.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/pages/_error-3b2a1d523de49635.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-3db3cb393af9dead.js',
          revision: 'JohirFVpEC2Wj9jlkkPIq',
        },
        {
          url: '/_next/static/css/1de76be520b4de19.css',
          revision: '1de76be520b4de19',
        },
        {
          url: '/_next/static/css/7a7f060d61bd2ed2.css',
          revision: '7a7f060d61bd2ed2',
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
        {
          url: '/icons/icon-128x128.png',
          revision: 'f829b914fc47cfc9c0747c119c27cf1b',
        },
        {
          url: '/icons/icon-144x144.png',
          revision: 'f829b914fc47cfc9c0747c119c27cf1b',
        },
        {
          url: '/icons/icon-152x152.png',
          revision: 'f829b914fc47cfc9c0747c119c27cf1b',
        },
        {
          url: '/icons/icon-192x192.png',
          revision: 'f829b914fc47cfc9c0747c119c27cf1b',
        },
        {
          url: '/icons/icon-384x384.png',
          revision: 'f829b914fc47cfc9c0747c119c27cf1b',
        },
        {
          url: '/icons/icon-512x512.png',
          revision: 'f829b914fc47cfc9c0747c119c27cf1b',
        },
        {
          url: '/icons/icon-72x72.png',
          revision: 'f829b914fc47cfc9c0747c119c27cf1b',
        },
        {
          url: '/icons/icon-96x96.png',
          revision: 'f829b914fc47cfc9c0747c119c27cf1b',
        },
        {
          url: '/icons/shortcut-activity.png',
          revision: 'f829b914fc47cfc9c0747c119c27cf1b',
        },
        {
          url: '/icons/shortcut-create.png',
          revision: 'f829b914fc47cfc9c0747c119c27cf1b',
        },
        {
          url: '/icons/shortcut-discover.png',
          revision: 'f829b914fc47cfc9c0747c119c27cf1b',
        },
        { url: '/manifest.json', revision: '72143d457d3843bccb5371d6f8508f89' },
        { url: '/next.svg', revision: '8e061864f388b47f33a1c3780831193e' },
        {
          url: '/notification-handler.js',
          revision: 'c80b0f8c16462a0ec565e965f92e4616',
        },
        { url: '/offline', revision: 'JohirFVpEC2Wj9jlkkPIq' },
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
              state: c,
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
