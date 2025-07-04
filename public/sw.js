if (!self.define) {
  let s,
    e = {};
  const i = (i, n) => (
    (i = new URL(i + '.js', n).href),
    e[i] ||
      new Promise((e) => {
        if ('document' in self) {
          const s = document.createElement('script');
          ((s.src = i), (s.onload = e), document.head.appendChild(s));
        } else ((s = i), importScripts(i), e());
      }).then(() => {
        let s = e[i];
        if (!s) throw new Error(`Module ${i} didn’t register its module`);
        return s;
      })
  );
  self.define = (n, a) => {
    const t =
      s ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (e[t]) return;
    let c = {};
    const p = (s) => i(s, t),
      r = { module: { uri: t }, exports: c, require: p };
    e[t] = Promise.all(n.map((s) => r[s] || p(s))).then((s) => (a(...s), c));
  };
}
define(['./workbox-b8918663'], function (s) {
  'use strict';
  (importScripts('fallback-1UiUq1pp-KCEEHUzsVvHp.js'),
    self.skipWaiting(),
    s.clientsClaim(),
    s.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: '9b161e216ccb19d96b37ae150b67d4b5',
        },
        {
          url: '/_next/dynamic-css-manifest.json',
          revision: 'fe98ca6effd7235d56f644a56c027db5',
        },
        {
          url: '/_next/static/1UiUq1pp-KCEEHUzsVvHp/_buildManifest.js',
          revision: 'b5baafca86966401800d11f31b331df4',
        },
        {
          url: '/_next/static/1UiUq1pp-KCEEHUzsVvHp/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/0e5ce63c-8817714ae70b42a0.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/1010.df593eec351502e2.js',
          revision: 'df593eec351502e2',
        },
        {
          url: '/_next/static/chunks/1029-867fced57390bc21.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/1404-1f16a7a8c1be98dd.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/1448-09e7decbbdbb66d0.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/164f4fb6-a3c05d4f2d31ca8f.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/1655-d02f1e899160b8cb.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/1684-b7deaec2377866c2.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/1851-582673f018af4820.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/1976-34c016b21dbae12d.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
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
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/3363-47a501392fa5d75f.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/3882-924c2b66ad3f1956.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/3948-259f3ae796ee6718.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/4212-6fb450bd392a29e8.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/4bd1b696-3395aeafebc14929.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/5347-640812c6913993d3.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/5424-b741a75d93cfe5e0.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/5585-dccf84f60967d027.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/6744.c492189346b1e82b.js',
          revision: 'c492189346b1e82b',
        },
        {
          url: '/_next/static/chunks/6874-6de7143ac6046bdc.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/7158-aa25e50e10ac8a2c.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/7265-09b6418e122497b7.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/7452-71b226df50664b1a.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/7693.430a238a70f97387.js',
          revision: '430a238a70f97387',
        },
        {
          url: '/_next/static/chunks/8115-d3c9e680549eed74.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/822.d1eebe7df2d8fc0a.js',
          revision: 'd1eebe7df2d8fc0a',
        },
        {
          url: '/_next/static/chunks/8304-3e7f1a69556161f0.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/8501-9995e044cb67b476.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/9111-231b31f71f65d0bf.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/927-0ca557f3779a1340.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/9352-84cb5cd1ae95e463.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/ad2866b8.1fc071285e350c45.js',
          revision: '1fc071285e350c45',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-15c0c74850ad5495.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/ai-demo/page-709bda2a80dcfb1e.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/api/campaigns/%5BcampaignId%5D/pdf/route-dce66319bbf44d53.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/api/campaigns/%5BcampaignId%5D/qr/route-8954fa17db3aa4fc.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/api/health/integrations/route-f2c027ff6d59c683.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/api/push/subscribe/route-bfd8bfb202a4263e.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/api/push/unsubscribe/route-3b772dcaef373cfd.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/api/uploadthing/route-a3ef1058d46e08c5.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-activity/route-652488a7a8204cdb.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-preferences/route-97d31ad14a602163.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/api/users/%5BuserId%5D/notification-stats/route-5cc32a9c03f584f0.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/api/webhooks/clerk/route-eabbe1dd0a59228a.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/campaigns/%5Bid%5D/page-4d846e8f40b5b7d1.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/campaigns/create/page-7566cb43303df5fd.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/campaigns/page-cfc4f6f17f61655f.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-4b4a86c50e38ffac.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/demo/voting-interface/page-ad86283246c5cbee.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/investment-demo/page-8a3f69e930841fd7.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/layout-824e8abf92743625.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/notifications/page-0deee86e5c6fc031.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/offline/page-6e67ffcd5d0fbb1a.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/onboarding/page-2d621b4db14430c8.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/page-93547785ebf28a4e.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/profile/page-2221c6e1e78d00fc.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/settings/page-5c96c9a6998800cb.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/sign-in/%5B%5B...sign-in%5D%5D/page-d65a490f0f628596.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/sign-up/%5B%5B...sign-up%5D%5D/page-18de382be0d8cacc.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/test-investment/page-84219672bf36721e.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/app/unsubscribe/page-83299af47a2fa52f.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/bc98253f.a20b3a3cf1b114d6.js',
          revision: 'a20b3a3cf1b114d6',
        },
        {
          url: '/_next/static/chunks/c36f3faa-e94a85796d821bf1.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/d0deef33.a586094e67e92d1c.js',
          revision: 'a586094e67e92d1c',
        },
        {
          url: '/_next/static/chunks/framework-82b67a6346ddd02b.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/main-app-3b5432ead1eb4da2.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/main-dc8ca1614292a62a.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/pages/_app-5d1abe03d322390c.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/pages/_error-3b2a1d523de49635.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-dcd43aaf3dd91cb4.js',
          revision: '1UiUq1pp-KCEEHUzsVvHp',
        },
        {
          url: '/_next/static/css/1de76be520b4de19.css',
          revision: '1de76be520b4de19',
        },
        {
          url: '/_next/static/css/2408e82aff40035f.css',
          revision: '2408e82aff40035f',
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
          revision: 'c80b0f8c16462a0ec565e965f92e4616',
        },
        { url: '/offline', revision: '1UiUq1pp-KCEEHUzsVvHp' },
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
              event: i,
              state: n,
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
