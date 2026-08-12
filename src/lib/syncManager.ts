export type SyncState = 'connecting' | 'synced' | 'offline' | 'error';

export interface ListenerDetail {
  collectionName: string;
  isFromCache: boolean;
  hasReceivedFirstSnapshot: boolean;
  hasError: boolean;
  errorType?: 'network' | 'permission' | 'other';
  errorMessage?: string;
  lastUpdated?: number;
}

export interface GlobalSyncDetails {
  syncState: SyncState;
  isOnline: boolean;
  totalListeners: number;
  syncedListeners: number;
  connectingListeners: number;
  errorListeners: number;
  offlineListeners: number;
}

export type SyncListenerCallback = (details: GlobalSyncDetails) => void;

class SyncManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listenersMap: Map<string, ListenerDetail> = new Map();
  private subscribers: Set<SyncListenerCallback> = new Set();
  private globalState: SyncState = 'connecting';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.recalculateState();
  }

  public reportListenerUpdate(collectionName: string, isFromCache: boolean) {
    const existing = this.listenersMap.get(collectionName) || {
      collectionName,
      isFromCache: true,
      hasReceivedFirstSnapshot: false,
      hasError: false,
    };

    this.listenersMap.set(collectionName, {
      ...existing,
      isFromCache,
      hasReceivedFirstSnapshot: true,
      hasError: false,
      errorType: undefined,
      errorMessage: undefined,
      lastUpdated: Date.now(),
    });

    this.recalculateState();
  }

  public reportListenerError(collectionName: string, error: Error) {
    const errorMsg = error?.message || String(error);
    const errorLower = errorMsg.toLowerCase();

    let errorType: 'network' | 'permission' | 'other' = 'other';
    if (
      errorLower.includes('offline') || 
      errorLower.includes('unavailable') || 
      errorLower.includes('could not reach') ||
      errorLower.includes('network') ||
      errorLower.includes('transport')
    ) {
      errorType = 'network';
    } else if (errorLower.includes('permission') || errorLower.includes('insufficient')) {
      errorType = 'permission';
    }

    const existing = this.listenersMap.get(collectionName) || {
      collectionName,
      isFromCache: true,
      hasReceivedFirstSnapshot: false,
      hasError: true,
    };

    this.listenersMap.set(collectionName, {
      ...existing,
      hasError: true,
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
    let errorCount = 0;
    let offlineCount = 0;

    for (const [, info] of this.listenersMap) {
      if (info.hasError) {
        if (info.errorType === 'network') {
          offlineCount++;
        } else {
          errorCount++;
        }
      } else if (!info.hasReceivedFirstSnapshot) {
        connecting++;
      } else {
        synced++;
      }
    }

    let calculatedState: SyncState = 'synced';

    if (!this.isOnline || offlineCount > 0) {
      calculatedState = 'offline';
    } else if (errorCount > 0 && synced === 0) {
      calculatedState = 'error';
    } else if (synced === 0 && total > 0) {
      calculatedState = 'connecting';
    } else {
      calculatedState = 'synced';
    }

    return {
      syncState: calculatedState,
      isOnline: this.isOnline,
      totalListeners: total,
      syncedListeners: synced,
      connectingListeners: connecting,
      errorListeners: errorCount,
      offlineListeners: offlineCount,
    };
  }

  public getSyncState(): SyncState {
    return this.getDetails().syncState;
  }

  private recalculateState() {
    const details = this.getDetails();
    this.globalState = details.syncState;
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
