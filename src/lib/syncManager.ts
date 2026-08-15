export type SyncState = 'connecting' | 'synced' | 'pending' | 'partial_error' | 'quota' | 'error' | 'offline';

export interface ListenerDetail {
  collectionName: string;
  hasReceivedSnapshot: boolean;
  hasServerConfirmation: boolean;
  isFromCache: boolean;
  hasPendingWrites: boolean;
  lastError: Error | null;
  errorType: 'network' | 'permission' | 'unauthenticated' | 'quota' | 'other' | null;
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
  pendingWriteListeners: number;
  errorListeners: number;
  offlineListeners: number;
  permissionErrorListeners: number;
  failingCollections: string[];
  statusMessage: string;
}

export type SyncListenerCallback = (details: GlobalSyncDetails) => void;

const getFriendlyCollectionName = (name: string): string => {
  const map: Record<string, string> = {
    members: 'Data Anggota',
    advocacyCases: 'Advokasi',
    sickVisits: 'Kunjungan Sakit',
    agendas: 'Agenda Serikat',
    notulensi: 'Notulensi',
    sembakoEvents: 'Event Sembako',
    sembakoClaims: 'Klaim Sembako',
    vehicleLogs: 'Log Kendaraan',
    financeRecords: 'Keuangan',
    users: 'Akun Pengurus',
    fundraising: 'Dana Gotong Royong',
    severanceCalculations: 'Kalkulator Pesangon',
    severanceRules: 'Aturan PKB',
    auditLogs: 'Audit Log',
    userClearedNotifs: 'Notifikasi User',
  };
  return map[name] || name;
};

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

  public setOnlineState(online: boolean) {
    this.handleNetworkChange(online);
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

  public reportListenerUpdate(collectionName: string, isFromCache: boolean, hasPendingWrites: boolean = false) {
    const hasServerConfirmation = !isFromCache && !hasPendingWrites;
    this.listenersMap.set(collectionName, {
      collectionName,
      hasReceivedSnapshot: true,
      hasServerConfirmation,
      isFromCache,
      hasPendingWrites,
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

    let errorType: 'network' | 'permission' | 'unauthenticated' | 'quota' | 'other' = 'other';
    if (
      errorCode === 'resource-exhausted' ||
      errorLower.includes('quota') ||
      errorLower.includes('resource exhausted') ||
      errorLower.includes('limit exceeded')
    ) {
      errorType = 'quota';
    } else if (
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
      hasPendingWrites: existing ? existing.hasPendingWrites : false,
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
    let pendingWritesCount = 0;
    let errorCount = 0;
    let offlineCount = 0;
    let permissionErrorCount = 0;
    let quotaErrorCount = 0;
    const failingCollections: string[] = [];

    for (const [colName, info] of this.listenersMap) {
      if (info.lastError) {
        failingCollections.push(colName);
        if (info.errorType === 'quota') {
          quotaErrorCount++;
          errorCount++;
        } else if (info.errorType === 'network') {
          offlineCount++;
        } else if (info.errorType === 'permission' || info.errorType === 'unauthenticated') {
          permissionErrorCount++;
          errorCount++;
        } else {
          errorCount++;
        }
      } else if (!info.hasReceivedSnapshot) {
        connecting++;
      } else if (info.hasPendingWrites) {
        pendingWritesCount++;
      } else if (!info.hasServerConfirmation) {
        cacheOnly++;
      } else {
        synced++;
      }
    }

    let calculatedState: SyncState = 'connecting';
    let statusMessage = 'Menyinkronkan data database Firestore...';

    if (quotaErrorCount > 0) {
      calculatedState = 'quota';
      statusMessage = 'KUOTA FIRESTORE TERCAPAI (Quota Exceeded) — Mode data lokal aktif. Kuota harian reset otomatis besok.';
    } else if (!this.isOnline || (total > 0 && offlineCount === total)) {
      calculatedState = 'offline';
      statusMessage = 'OFFLINE — Menunggu koneksi internet. Data lokal tetap dapat diakses.';
    } else if (total === 0) {
      calculatedState = 'connecting';
      statusMessage = 'Menghubungkan ke database Firestore...';
    } else if (errorCount > 0) {
      if (synced > 0) {
        calculatedState = 'partial_error';
        const friendlyNames = failingCollections.map(getFriendlyCollectionName).join(', ');
        statusMessage = `Sinkronisasi sebagian bermasalah — ${friendlyNames} belum tersinkron.`;
      } else {
        calculatedState = 'error';
        statusMessage = 'SINKRONISASI BERMASALAH — Memeriksa koneksi database Firestore.';
      }
    } else if (pendingWritesCount > 0) {
      calculatedState = 'pending';
      statusMessage = 'Menyimpan perubahan ke server...';
    } else if (synced === total && total > 0) {
      calculatedState = 'synced';
      statusMessage = 'Online • Data tersinkron';
    } else {
      calculatedState = 'connecting';
      statusMessage = 'Menyinkronkan data database Firestore...';
    }

    return {
      syncState: calculatedState,
      isOnline: this.isOnline,
      totalListeners: total,
      syncedListeners: synced,
      connectingListeners: connecting,
      cacheListeners: cacheOnly,
      pendingWriteListeners: pendingWritesCount,
      errorListeners: errorCount,
      offlineListeners: offlineCount,
      permissionErrorListeners: permissionErrorCount,
      failingCollections,
      statusMessage,
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
