import { describe, it, expect, beforeEach } from 'vitest';
import { syncManager } from './syncManager';

describe('SyncManager State & Partial Sync Tests', () => {
  beforeEach(() => {
    syncManager.setOnlineState(true);
    // Clear all listeners before each test
    const listenerNames = [
      'col1', 'col2', 'col3', 'col4', 'col5', 
      'col6', 'col7', 'col8', 'col9', 'col10'
    ];
    listenerNames.forEach(name => syncManager.reportListenerUnsubscribe(name));
  });

  it('1/10 server confirmed -> CONNECTING', () => {
    // 1 server confirmed
    syncManager.reportListenerUpdate('col1', false);
    
    // 9 cache only
    for (let i = 2; i <= 10; i++) {
      syncManager.reportListenerUpdate(`col${i}`, true);
    }

    const details = syncManager.getDetails();
    expect(details.totalListeners).toBe(10);
    expect(details.syncedListeners).toBe(1);
    expect(details.cacheListeners).toBe(9);
    expect(details.syncState).toBe('connecting');
  });

  it('9/10 server confirmed -> CONNECTING', () => {
    // 9 server confirmed
    for (let i = 1; i <= 9; i++) {
      syncManager.reportListenerUpdate(`col${i}`, false);
    }
    // 1 cache only
    syncManager.reportListenerUpdate('col10', true);

    const details = syncManager.getDetails();
    expect(details.totalListeners).toBe(10);
    expect(details.syncedListeners).toBe(9);
    expect(details.cacheListeners).toBe(1);
    expect(details.syncState).toBe('connecting');
  });

  it('10/10 server confirmed -> SYNCED', () => {
    for (let i = 1; i <= 10; i++) {
      syncManager.reportListenerUpdate(`col${i}`, false);
    }

    const details = syncManager.getDetails();
    expect(details.totalListeners).toBe(10);
    expect(details.syncedListeners).toBe(10);
    expect(details.cacheListeners).toBe(0);
    expect(details.syncState).toBe('synced');
  });

  it('cache only -> CONNECTING', () => {
    syncManager.reportListenerUpdate('col1', true);
    const details = syncManager.getDetails();
    expect(details.syncState).toBe('connecting');
  });

  it('fatal error -> PARTIAL_ERROR or ERROR', () => {
    syncManager.reportListenerUpdate('col1', false);
    syncManager.reportListenerError('col2', new Error('permission-denied: insufficient permissions'));

    const details = syncManager.getDetails();
    expect(details.syncState).toBe('partial_error');
    expect(details.permissionErrorListeners).toBe(1);

    // If all collections error out -> ERROR
    syncManager.reportListenerError('col1', new Error('permission-denied: col1 failed'));
    const detailsAllError = syncManager.getDetails();
    expect(detailsAllError.syncState).toBe('error');
  });
});
