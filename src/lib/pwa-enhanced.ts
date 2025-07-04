/**
 * Enhanced PWA utilities for Civilyst
 * Provides advanced offline capabilities, background sync, and performance optimizations
 */

// Type augmentation for ServiceWorker sync
declare global {
  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
    };
  }
}

// Types for offline data management
export interface OfflineQueueItem {
  id: string;
  type: 'campaign_create' | 'campaign_update' | 'vote' | 'comment';
  data: unknown;
  timestamp: number;
  retryCount: number;
}

export interface CachedCampaign {
  id: string;
  data: unknown;
  timestamp: number;
  lastAccessed: number;
}

export interface PWACapabilities {
  serviceWorker: boolean;
  backgroundSync: boolean;
  persistentStorage: boolean;
  shareTarget: boolean;
  webShare: boolean;
  badgeAPI: boolean;
  notifications: boolean;
}

class PWAEnhancedManager {
  private dbName = 'civilyst-pwa';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private syncQueue: OfflineQueueItem[] = [];

  /**
   * Initialize the PWA enhanced features
   */
  async initialize(): Promise<void> {
    try {
      // Initialize IndexedDB for offline storage
      await this.initIndexedDB();

      // Load sync queue from storage
      await this.loadSyncQueue();

      // Set up background sync if available
      await this.setupBackgroundSync();

      // Request persistent storage
      await this.requestPersistentStorage();

      // Set up periodic background sync
      this.setupPeriodicSync();

      // Log PWA initialization in development only
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PWA] Enhanced Manager initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize PWA Enhanced Manager:', error);
    }
  }

  /**
   * Initialize IndexedDB for offline data storage
   */
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('campaigns')) {
          const campaignStore = db.createObjectStore('campaigns', {
            keyPath: 'id',
          });
          campaignStore.createIndex('timestamp', 'timestamp', {
            unique: false,
          });
          campaignStore.createIndex('lastAccessed', 'lastAccessed', {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', {
            keyPath: 'id',
          });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('offlineDrafts')) {
          const draftStore = db.createObjectStore('offlineDrafts', {
            keyPath: 'id',
          });
          draftStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Cache campaign data for offline access
   */
  async cacheCampaign(campaignId: string, data: unknown): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['campaigns'], 'readwrite');
    const store = transaction.objectStore('campaigns');

    const cachedCampaign: CachedCampaign = {
      id: campaignId,
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
    };

    await store.put(cachedCampaign);
  }

  /**
   * Get cached campaign data
   */
  async getCachedCampaign(campaignId: string): Promise<unknown | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction(['campaigns'], 'readwrite');
    const store = transaction.objectStore('campaigns');

    return new Promise((resolve, reject) => {
      const request = store.get(campaignId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as CachedCampaign | undefined;

        if (result) {
          // Update last accessed time
          result.lastAccessed = Date.now();
          store.put(result);
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
    });
  }

  /**
   * Add action to offline sync queue
   */
  async addToSyncQueue(
    type: OfflineQueueItem['type'],
    data: unknown
  ): Promise<string> {
    const item: OfflineQueueItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.push(item);

    if (this.db) {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      await store.add(item);
    }

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.processSyncQueue();
    }

    return item.id;
  }

  /**
   * Load sync queue from IndexedDB
   */
  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.syncQueue = request.result || [];
        resolve();
      };
    });
  }

  /**
   * Process the sync queue when online
   */
  async processSyncQueue(): Promise<void> {
    if (!navigator.onLine || this.syncQueue.length === 0) return;

    const itemsToProcess = [...this.syncQueue];

    for (const item of itemsToProcess) {
      try {
        await this.syncItem(item);

        // Remove successful item from queue
        this.syncQueue = this.syncQueue.filter(
          (queueItem) => queueItem.id !== item.id
        );

        if (this.db) {
          const transaction = this.db.transaction(['syncQueue'], 'readwrite');
          const store = transaction.objectStore('syncQueue');
          await store.delete(item.id);
        }
      } catch (error) {
        console.error('Failed to sync item:', item, error);

        // Increment retry count
        item.retryCount++;

        // Remove if too many retries
        if (item.retryCount > 3) {
          this.syncQueue = this.syncQueue.filter(
            (queueItem) => queueItem.id !== item.id
          );

          if (this.db) {
            const transaction = this.db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            await store.delete(item.id);
          }
        }
      }
    }
  }

  /**
   * Sync individual item based on type
   */
  private async syncItem(item: OfflineQueueItem): Promise<void> {
    switch (item.type) {
      case 'campaign_create':
        await this.syncCampaignCreate(item.data);
        break;
      case 'campaign_update':
        await this.syncCampaignUpdate(item.data);
        break;
      case 'vote':
        await this.syncVote(item.data);
        break;
      case 'comment':
        await this.syncComment(item.data);
        break;
      default:
        throw new Error(`Unknown sync item type: ${item.type}`);
    }
  }

  /**
   * Individual sync methods (to be implemented based on your API)
   */
  private async syncCampaignCreate(data: unknown): Promise<void> {
    // Implementation would use your tRPC client
    // Log sync operations in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PWA] Syncing campaign create:', data);
    }
  }

  private async syncCampaignUpdate(data: unknown): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PWA] Syncing campaign update:', data);
    }
  }

  private async syncVote(data: unknown): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PWA] Syncing vote:', data);
    }
  }

  private async syncComment(data: unknown): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PWA] Syncing comment:', data);
    }
  }

  /**
   * Set up background sync registration
   */
  private async setupBackgroundSync(): Promise<void> {
    if (
      'serviceWorker' in navigator &&
      'sync' in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.sync) {
          await registration.sync.register('background-sync');
          console.warn('Background sync registered');
        }
      } catch (error) {
        console.warn('Background sync registration failed:', error);
      }
    }
  }

  /**
   * Request persistent storage to prevent cache eviction
   */
  private async requestPersistentStorage(): Promise<void> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        console.warn('Persistent storage:', persistent);
      } catch (error) {
        console.error('Failed to request persistent storage:', error);
      }
    }
  }

  /**
   * Set up periodic sync for cache maintenance
   */
  private setupPeriodicSync(): void {
    // Clean up old cached data every hour
    setInterval(
      () => {
        this.cleanupOldCache();
      },
      60 * 60 * 1000
    );

    // Try to sync queue every 30 seconds when online
    setInterval(() => {
      if (navigator.onLine) {
        this.processSyncQueue();
      }
    }, 30 * 1000);
  }

  /**
   * Clean up old cached data
   */
  private async cleanupOldCache(): Promise<void> {
    if (!this.db) return;

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const transaction = this.db.transaction(['campaigns'], 'readwrite');
    const store = transaction.objectStore('campaigns');
    const index = store.index('lastAccessed');

    const range = IDBKeyRange.upperBound(oneWeekAgo);
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }

  /**
   * Check PWA capabilities
   */
  getPWACapabilities(): PWACapabilities {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      backgroundSync:
        'serviceWorker' in navigator &&
        'sync' in window.ServiceWorkerRegistration.prototype,
      persistentStorage:
        'storage' in navigator && 'persist' in navigator.storage,
      shareTarget: 'share' in navigator,
      webShare: 'share' in navigator,
      badgeAPI: 'setAppBadge' in navigator,
      notifications: 'Notification' in window,
    };
  }

  /**
   * Pre-cache critical resources
   */
  async precacheCriticalResources(urls: string[]): Promise<void> {
    if ('caches' in window) {
      try {
        const cache = await caches.open('critical-resources-v1');
        await cache.addAll(urls);
        console.warn('Critical resources pre-cached');
      } catch (error) {
        console.error('Failed to pre-cache critical resources:', error);
      }
    }
  }

  /**
   * Save draft offline
   */
  async saveDraftOffline(draftId: string, data: unknown): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['offlineDrafts'], 'readwrite');
    const store = transaction.objectStore('offlineDrafts');

    await store.put({
      id: draftId,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get offline drafts
   */
  async getOfflineDrafts(): Promise<
    Array<{ id: string; data: unknown; timestamp: number }>
  > {
    if (!this.db) return [];

    const transaction = this.db.transaction(['offlineDrafts'], 'readonly');
    const store = transaction.objectStore('offlineDrafts');

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }
}

// Singleton instance
export const pwaManager = new PWAEnhancedManager();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  pwaManager.initialize().catch(console.error);
}

// Export utilities
export * from './utils';
