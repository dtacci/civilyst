(() => {
  'use strict';
  self.fallback = async (e) => {
    switch (e.destination) {
      case 'document':
      case 'image':
      case 'audio':
      case 'video':
      case 'font':
        return caches.match('/offline', { ignoreSearch: !0 });
      default:
        return Response.error();
    }
  };
})();
