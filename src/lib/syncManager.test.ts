import { describe, it, expect, beforeEach } from 'vitest';
import { syncManager } from './syncManager';

describe('SyncManager Anti False-Sync & Server Confirmation Tests', () => {
  beforeEach(() => {
    syncManager.setOnlineState(true);
    // Clear all listeners before each test
    const listenerNames = [
      'col1', 'col2', 'col3', 'col4', 'col5', 
      'col6', 'col7', 'col8', 'col9', 'col10',
      'members', 'advocacyCases', 'testDoc/doc1'
    ];
    listenerNames.forEach(name => syncManager.reportListenerUnsubscribe(name));
  });

  it('1. cache snapshot (fromCache=true, hasPendingWrites=false) -> CONNECTING', () => {
    syncManager.reportListenerUpdate('col1', true, false);
    const details = syncManager.getDetails();
    expect(details.totalListeners).toBe(1);
    expect(details.syncedListeners).toBe(0);
    expect(details.cacheListeners).toBe(1);
    expect(details.syncState).toBe('connecting');
  });

  it('2. pending write (fromCache=false, hasPendingWrites=true) -> CONNECTING', () => {
    syncManager.reportListenerUpdate('col1', false, true);
    const details = syncManager.getDetails();
    expect(details.totalListeners).toBe(1);
    expect(details.syncedListeners).toBe(0);
    expect(details.pendingWriteListeners).toBe(1);
    expect(details.syncState).toBe('connecting');
  });

  it('3. server confirmed (fromCache=false, hasPendingWrites=false) -> SYNCED', () => {
    syncManager.reportListenerUpdate('col1', false, false);
    const details = syncManager.getDetails();
    expect(details.totalListeners).toBe(1);
    expect(details.syncedListeners).toBe(1);
    expect(details.pendingWriteListeners).toBe(0);
    expect(details.cacheListeners).toBe(0);
    expect(details.syncState).toBe('synced');
  });

  it('4. 9/10 server confirmed (1 cache or pending write) -> CONNECTING', () => {
    for (let i = 1; i <= 9; i++) {
      syncManager.reportListenerUpdate(`col${i}`, false, false);
    }
    syncManager.reportListenerUpdate('col10', true, false);

    const details = syncManager.getDetails();
    expect(details.totalListeners).toBe(10);
    expect(details.syncedListeners).toBe(9);
    expect(details.cacheListeners).toBe(1);
    expect(details.syncState).toBe('connecting');

    // Test with 1 pending write instead of cache
    syncManager.reportListenerUpdate('col10', false, true);
    const detailsPending = syncManager.getDetails();
    expect(detailsPending.totalListeners).toBe(10);
    expect(detailsPending.syncedListeners).toBe(9);
    expect(detailsPending.pendingWriteListeners).toBe(1);
    expect(detailsPending.syncState).toBe('connecting');
  });

  it('5. 10/10 server confirmed -> SYNCED', () => {
    for (let i = 1; i <= 10; i++) {
      syncManager.reportListenerUpdate(`col${i}`, false, false);
    }

    const details = syncManager.getDetails();
    expect(details.totalListeners).toBe(10);
    expect(details.syncedListeners).toBe(10);
    expect(details.cacheListeners).toBe(0);
    expect(details.pendingWriteListeners).toBe(0);
    expect(details.syncState).toBe('synced');
  });

  it('6. offline -> OFFLINE', () => {
    syncManager.reportListenerUpdate('col1', false, false);
    expect(syncManager.getDetails().syncState).toBe('synced');

    syncManager.setOnlineState(false);
    const details = syncManager.getDetails();
    expect(details.isOnline).toBe(false);
    expect(details.syncState).toBe('offline');
  });

  it('7. listener error -> ERROR or PARTIAL_ERROR', () => {
    syncManager.reportListenerError('col1', new Error('permission-denied: insufficient permissions'));
    const detailsSingleError = syncManager.getDetails();
    expect(detailsSingleError.syncState).toBe('error');
    expect(detailsSingleError.permissionErrorListeners).toBe(1);

    // If one is synced and another has error -> PARTIAL_ERROR
    syncManager.reportListenerUpdate('col2', false, false);
    const detailsPartial = syncManager.getDetails();
    expect(detailsPartial.syncState).toBe('partial_error');
  });

  it('8. pending write then server confirmed: pending -> CONNECTING then confirmed -> SYNCED', () => {
    // Local write initiated (hasPendingWrites = true)
    syncManager.reportListenerUpdate('col1', false, true);
    expect(syncManager.getDetails().syncState).toBe('connecting');
    expect(syncManager.getDetails().pendingWriteListeners).toBe(1);

    // Server acknowledges and writes are committed (hasPendingWrites = false)
    syncManager.reportListenerUpdate('col1', false, false);
    expect(syncManager.getDetails().syncState).toBe('synced');
    expect(syncManager.getDetails().pendingWriteListeners).toBe(0);
  });

  it('9. metadata update from Firestore (fromCache: true -> false) updates state properly', () => {
    // 1st snapshot from local persistence cache
    syncManager.reportListenerUpdate('col1', true, false);
    expect(syncManager.getDetails().syncState).toBe('connecting');
    expect(syncManager.getDetails().cacheListeners).toBe(1);

    // 2nd snapshot from Firestore server
    syncManager.reportListenerUpdate('col1', false, false);
    expect(syncManager.getDetails().syncState).toBe('synced');
    expect(syncManager.getDetails().cacheListeners).toBe(0);
    expect(syncManager.getDetails().syncedListeners).toBe(1);
  });

  it('handles quota exceeded error -> QUOTA state', () => {
    syncManager.reportListenerUpdate('col1', false, false);
    syncManager.reportListenerError('col2', { code: 'resource-exhausted', message: 'Quota exceeded for firestore' });

    const details = syncManager.getDetails();
    expect(details.syncState).toBe('quota');
  });
});
