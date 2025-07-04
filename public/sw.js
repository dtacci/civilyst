if (!self.define) {
  let s,
    e = {};
  const a = (a, i) => (
    (a = new URL(a + '.js', i).href),
    e[a] ||
      new Promise((e) => {
        if ('document' in self) {
          const s = document.createElement('script');
          ((s.src = a), (s.onload = e), document.head.appendChild(s));
        } else ((s = a), importScripts(a), e());
      }).then(() => {
        let s = e[a];
        if (!s) throw new Error(`Module ${a} didn’t register its module`);
        return s;
      })
  );
  self.define = (i, n) => {
    const c =
      s ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (e[c]) return;
    let t = {};
    const r = (s) => a(s, c),
      u = { module: { uri: c }, exports: t, require: r };
    e[c] = Promise.all(i.map((s) => u[s] || r(s))).then((s) => (n(...s), t));
  };
}
define(['./workbox-b8918663'], function (s) {
  'use strict';
  (importScripts('fallback-yjaOhmv_3K8w9lT-q-5bs.js'),
    self.skipWaiting(),
    s.clientsClaim(),
    s.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: '91b180c1ded1ed3a753fb65c0dec0c13',
        },
        {
          url: '/_next/dynamic-css-manifest.json',
          revision: 'fe98ca6effd7235d56f644a56c027db5',
        },
        {
          url: '/_next/static/chunks/0e5ce63c-8817714ae70b42a0.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/1029-1c83852a91f1ae23.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/1040-76ae3c95a87a4d4a.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/1404-faee13fccc48345e.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/1448-f92f970b7a4b3dc9.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/164f4fb6-a3c05d4f2d31ca8f.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/1655-6985bc8037302a0e.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/1684-b7deaec2377866c2.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/1851-582673f018af4820.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/1976-34c016b21dbae12d.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/2121.53188f93655a7ff0.js',
          revision: '53188f93655a7ff0',
        },
        {
          url: '/_next/static/chunks/2642.cdf2f54f829ee63a.js',
          revision: 'cdf2f54f829ee63a',
        },
        {
          url: '/_next/static/chunks/2752-6b38afafd1376dde.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/3363-34593b2203ad642b.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/356-ade497b689954ae3.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/3948-259f3ae796ee6718.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/4015-21547e8a8a01ff08.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/4bd1b696-3395aeafebc14929.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/5261-6c21e63217233445.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/5477-ad957375908dd98e.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/5585-dccf84f60967d027.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/651-a63f598793e30952.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/6744.fcb1d81fbb4e4010.js',
          revision: 'fcb1d81fbb4e4010',
        },
        {
          url: '/_next/static/chunks/6874-6de7143ac6046bdc.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/7254.bcc7e92ada9b0bcc.js',
          revision: 'bcc7e92ada9b0bcc',
        },
        {
          url: '/_next/static/chunks/7265-2cb36d82793e9ccd.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/7452-71b226df50664b1a.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/7693.430a238a70f97387.js',
          revision: '430a238a70f97387',
        },
        {
          url: '/_next/static/chunks/7929-0c2b90748d57850b.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/822.d1eebe7df2d8fc0a.js',
          revision: 'd1eebe7df2d8fc0a',
        },
        {
          url: '/_next/static/chunks/8304-3e7f1a69556161f0.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/8501-525e004425c060f7.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/9111-231b31f71f65d0bf.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/927-0ca557f3779a1340.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/9352-84cb5cd1ae95e463.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/ad2866b8.1fc071285e350c45.js',
          revision: '1fc071285e350c45',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-15c0c74850ad5495.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/ai-demo/page-97722db5d07aeca1.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/api/campaigns/%5BcampaignId%5D/pdf/route-dce66319bbf44d53.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/api/campaigns/%5BcampaignId%5D/qr/route-8954fa17db3aa4fc.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/api/health/integrations/route-f2c027ff6d59c683.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/api/push/subscribe/route-bfd8bfb202a4263e.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/api/push/unsubscribe/route-3b772dcaef373cfd.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/api/uploadthing/route-a3ef1058d46e08c5.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-activity/route-652488a7a8204cdb.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-preferences/route-97d31ad14a602163.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-stats/route-5cc32a9c03f584f0.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/api/webhooks/clerk/route-eabbe1dd0a59228a.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/campaigns/%5Bid%5D/page-9fb354c78cb0ec53.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/campaigns/create/page-862e4f7cd59ccbd8.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/campaigns/page-1b966d168ad88e8c.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-4b4a86c50e38ffac.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/demo/voting-interface/page-3cd08c63a4d65932.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/investment-demo/page-5d9837506709413c.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/layout-372234d7e6a0ae0a.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/notifications/page-0deee86e5c6fc031.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/offline/page-6e67ffcd5d0fbb1a.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/onboarding/page-6309b1abe72c08c7.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/page-b944cc7eccf45aa5.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/profile/page-3d041b640f8c2e93.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/settings/page-583f73b61d983604.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/sign-in/%5B%5B...sign-in%5D%5D/page-9ee9c0f2e08c9e54.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/sign-up/%5B%5B...sign-up%5D%5D/page-f04a1e95d9050732.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/test-investment/page-d65d900386416abf.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/app/unsubscribe/page-2578df0de21592dd.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/bc98253f.a20b3a3cf1b114d6.js',
          revision: 'a20b3a3cf1b114d6',
        },
        {
          url: '/_next/static/chunks/c36f3faa-e94a85796d821bf1.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/d0deef33.a586094e67e92d1c.js',
          revision: 'a586094e67e92d1c',
        },
        {
          url: '/_next/static/chunks/framework-82b67a6346ddd02b.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/main-app-3b5432ead1eb4da2.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/main-dc8ca1614292a62a.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/pages/_app-5d1abe03d322390c.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/pages/_error-3b2a1d523de49635.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-97c7319063156239.js',
          revision: 'yjaOhmv_3K8w9lT-q-5bs',
        },
        {
          url: '/_next/static/css/0d45b337b87f801d.css',
          revision: '0d45b337b87f801d',
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
          url: '/_next/static/yjaOhmv_3K8w9lT-q-5bs/_buildManifest.js',
          revision: 'b5baafca86966401800d11f31b331df4',
        },
        {
          url: '/_next/static/yjaOhmv_3K8w9lT-q-5bs/_ssgManifest.js',
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
        { url: '/offline', revision: 'yjaOhmv_3K8w9lT-q-5bs' },
        {
          url: '/sw-enhanced.js',
          revision: '0186e7decb47ea27ce2bfd30657bcf3f',
        },
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
              event: a,
              state: i,
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
