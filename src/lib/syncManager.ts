export type SyncState = 'connecting' | 'synced' | 'offline' | 'error';

export interface ListenerDetail {
  collectionName: string;
  hasReceivedSnapshot: boolean;
  hasServerConfirmation: boolean;
  isFromCache: boolean;
  lastError: Error | null;
  errorType: 'network' | 'permission' | 'unauthenticated' | 'other' | null;
  errorMessage?: string;
  lastUpdated?: number;
}

export interface GlobalSyncDetails {
  syncState: SyncState;
  isOnline: boolean;
  totalListeners: number;
  syncedListeners: number;
  connectingListeners: number;
  cacheListeners: number;
  errorListeners: number;
  offlineListeners: number;
  permissionErrorListeners: number;
}

export type SyncListenerCallback = (details: GlobalSyncDetails) => void;

class SyncManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listenersMap: Map<string, ListenerDetail> = new Map();
  private subscribers: Set<SyncListenerCallback> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    if (!online) {
      // Mark all listeners as not server confirmed when offline
      for (const [key, detail] of this.listenersMap.entries()) {
        this.listenersMap.set(key, {
          ...detail,
          hasServerConfirmation: false,
          isFromCache: true,
        });
      }
    }
    this.recalculateState();
  }

  public reportListenerUpdate(collectionName: string, isFromCache: boolean) {
    this.listenersMap.set(collectionName, {
      collectionName,
      hasReceivedSnapshot: true,
      hasServerConfirmation: !isFromCache,
      isFromCache,
      lastError: null,
      errorType: null,
      errorMessage: undefined,
      lastUpdated: Date.now(),
    });

    this.recalculateState();
  }

  public reportListenerError(collectionName: string, error: any) {
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || '';
    const errorLower = errorMsg.toLowerCase();

    let errorType: 'network' | 'permission' | 'unauthenticated' | 'other' = 'other';
    if (
      errorCode === 'unavailable' ||
      errorCode === 'cancelled' ||
      errorCode === 'deadline-exceeded' ||
      errorLower.includes('offline') || 
      errorLower.includes('unavailable') || 
      errorLower.includes('could not reach') ||
      errorLower.includes('network') ||
      errorLower.includes('transport')
    ) {
      errorType = 'network';
    } else if (
      errorCode === 'permission-denied' ||
      errorLower.includes('permission') || 
      errorLower.includes('insufficient')
    ) {
      errorType = 'permission';
    } else if (
      errorCode === 'unauthenticated' ||
      errorLower.includes('unauthenticated')
    ) {
      errorType = 'unauthenticated';
    }

    const existing = this.listenersMap.get(collectionName);

    this.listenersMap.set(collectionName, {
      collectionName,
      hasReceivedSnapshot: existing ? existing.hasReceivedSnapshot : false,
      hasServerConfirmation: false,
      isFromCache: true,
      lastError: error instanceof Error ? error : new Error(errorMsg),
      errorType,
      errorMessage: errorMsg,
      lastUpdated: Date.now(),
    });

    this.recalculateState();
  }

  public reportListenerUnsubscribe(collectionName: string) {
    this.listenersMap.delete(collectionName);
    this.recalculateState();
  }

  public getDetails(): GlobalSyncDetails {
    const total = this.listenersMap.size;
    let synced = 0;
    let connecting = 0;
    let cacheOnly = 0;
    let errorCount = 0;
    let offlineCount = 0;
    let permissionErrorCount = 0;

    for (const [, info] of this.listenersMap) {
      if (info.lastError) {
        if (info.errorType === 'network') {
          offlineCount++;
        } else if (info.errorType === 'permission' || info.errorType === 'unauthenticated') {
          permissionErrorCount++;
          errorCount++;
        } else {
          errorCount++;
        }
      } else if (!info.hasReceivedSnapshot) {
        connecting++;
      } else if (!info.hasServerConfirmation) {
        cacheOnly++;
      } else {
        synced++;
      }
    }

    let calculatedState: SyncState = 'connecting';

    if (!this.isOnline || offlineCount > 0) {
      calculatedState = 'offline';
    } else if (total === 0) {
      calculatedState = 'connecting';
    } else if (errorCount > 0) {
      calculatedState = 'error';
    } else if (synced === total && total > 0) {
      calculatedState = 'synced';
    } else {
      // Partial sync or still waiting for all listeners to get server confirmation
      calculatedState = 'connecting';
    }

    return {
      syncState: calculatedState,
      isOnline: this.isOnline,
      totalListeners: total,
      syncedListeners: synced,
      connectingListeners: connecting,
      cacheListeners: cacheOnly,
      errorListeners: errorCount,
      offlineListeners: offlineCount,
      permissionErrorListeners: permissionErrorCount,
    };
  }

  public getSyncState(): SyncState {
    return this.getDetails().syncState;
  }

  public getListenerDetail(collectionName: string): ListenerDetail | undefined {
    return this.listenersMap.get(collectionName);
  }

  private recalculateState() {
    const details = this.getDetails();
    this.notifySubscribers(details);
  }

  public subscribe(callback: SyncListenerCallback): () => void {
    this.subscribers.add(callback);
    callback(this.getDetails());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(details: GlobalSyncDetails) {
    this.subscribers.forEach((cb) => {
      try {
        cb(details);
      } catch (err) {
        console.error('Error in syncManager subscriber callback:', err);
      }
    });
  }
}

export const syncManager = new SyncManager();
