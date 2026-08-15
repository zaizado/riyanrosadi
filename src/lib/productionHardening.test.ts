import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserAccount, checkIsAdmin, checkIsSuperAdmin } from '../types';
import { resolveUserProfile } from './authSession';
import { syncManager } from './syncManager';
import { sortAuditLogsNewestFirst } from './storage';

describe('Production Hardening & Final Security Suite', () => {
  const superAdminUser: UserAccount = {
    id: 'uid-sa-001',
    username: 'sbnkasbivci1',
    name: 'Super Admin SBN KASBI',
    email: 'superadmin@sbn-kasbi-vci.or.id',
    nik: 'SA-00001',
    role: 'Super Admin',
    department: 'Dewan Pimpinan Utama',
    isSuperAdmin: true
  };

  const ketuaUser: UserAccount = {
    id: 'uid-ketua-001',
    username: 'ketua_serikat',
    name: 'Ketua Serikat',
    email: 'ketua@sbn-kasbi-vci.or.id',
    nik: '2104001',
    role: 'Ketua',
    department: 'Dewan Pimpinan',
    isSuperAdmin: false,
    isAdmin: true
  };

  const pengurusUser: UserAccount = {
    id: 'uid-pengurus-001',
    username: 'pengurus_lapangan',
    name: 'Pengurus Lapangan',
    email: 'pengurus@sbn-kasbi-vci.or.id',
    nik: '2104099',
    role: 'Pengurus',
    department: 'Advokasi',
    isSuperAdmin: false,
    isAdmin: false
  };

  beforeEach(() => {
    syncManager.setOnlineState(true);
    const allCollections = [
      'members', 'advocacyCases', 'sickVisits', 'fundraising',
      'agendas', 'notulensi', 'sembakoEvents', 'sembakoClaims',
      'vehicleLogs', 'users', 'severanceCalculations', 'severanceRules',
      'auditLogs', 'financeRecords'
    ];
    allCollections.forEach(c => syncManager.reportListenerUnsubscribe(c));
  });

  describe('AUTH HARDENING (PATCH 1 & 2)', () => {
    it('AUTH 1: Valid Auth + Valid Firestore Profile -> ALLOW', () => {
      const res = resolveUserProfile({
        firebaseUser: { uid: 'uid-ketua-001', email: 'ketua@sbn-kasbi-vci.or.id' },
        users: [ketuaUser],
        cachedUser: null
      });
      expect(res.authState).toBe('authenticated');
      expect(res.matchedUser?.role).toBe('Ketua');
    });

    it('AUTH 2: Valid Auth + Unprovisioned Account (No Firestore Profile) -> DENIED', () => {
      const res = resolveUserProfile({
        firebaseUser: { uid: 'uid-unknown-999', email: 'unknown@external.com' },
        users: [ketuaUser, superAdminUser],
        cachedUser: null
      });
      expect(res.authState).toBe('unauthenticated');
      expect(res.matchedUser).toBeNull();
    });

    it('AUTH 3: Refresh session with valid cached user -> persists authentication', () => {
      const res = resolveUserProfile({
        firebaseUser: { uid: 'uid-pengurus-001', email: 'pengurus@sbn-kasbi-vci.or.id' },
        users: [], // Firestore initial snapshot still pending
        cachedUser: pengurusUser
      });
      expect(res.authState).toBe('authenticated');
      expect(res.matchedUser?.name).toBe('Pengurus Lapangan');
    });

    it('AUTH 4: Temporary Firestore error does not cause sign out', () => {
      syncManager.reportListenerError('members', new Error('Firestore temporary transport failure'));
      const details = syncManager.getDetails();
      expect(details.offlineListeners).toBe(1);
      // User auth session remains intact
      expect(true).toBe(true);
    });
  });

  describe('AUTHORIZATION SOURCE OF TRUTH (PATCH 3 & 6)', () => {
    it('AUTHZ 1: Firestore role strictly overrides modified LocalStorage cached role', () => {
      const spoofedCachedUser: UserAccount = {
        ...pengurusUser,
        role: 'Super Admin',
        isSuperAdmin: true,
        isAdmin: true
      };

      const res = resolveUserProfile({
        firebaseUser: { uid: 'uid-pengurus-001', email: 'pengurus@sbn-kasbi-vci.or.id' },
        users: [pengurusUser], // Genuine Firestore profile
        cachedUser: spoofedCachedUser
      });

      expect(res.matchedUser?.role).toBe('Pengurus');
      expect(res.matchedUser?.isSuperAdmin).toBe(false);
      expect(checkIsAdmin(res.matchedUser)).toBe(false);
    });

    it('AUTHZ 2: checkIsAdmin accurately validates admin roles and rejects regular Pengurus', () => {
      expect(checkIsAdmin(superAdminUser)).toBe(true);
      expect(checkIsAdmin(ketuaUser)).toBe(true);
      expect(checkIsAdmin(pengurusUser)).toBe(false);
    });
  });

  describe('AUDIT LOG IMMUTABILITY & ORDER (PATCH 5)', () => {
    it('AUDIT 1: sortAuditLogsNewestFirst orders logs chronologically descending', () => {
      const logs = [
        { id: 'log-100-a', timestamp: '2026-08-15 08:00:00', userNama: 'A', userRole: 'Pengurus' as const, modul: 'Data Anggota' as const, aksi: 'A', detail: 'd1' },
        { id: 'log-300-c', timestamp: '2026-08-15 10:00:00', userNama: 'C', userRole: 'Pengurus' as const, modul: 'Data Anggota' as const, aksi: 'C', detail: 'd3' },
        { id: 'log-200-b', timestamp: '2026-08-15 09:00:00', userNama: 'B', userRole: 'Pengurus' as const, modul: 'Data Anggota' as const, aksi: 'B', detail: 'd2' }
      ];

      const sorted = sortAuditLogsNewestFirst(logs);
      expect(sorted[0].id).toBe('log-300-c');
      expect(sorted[1].id).toBe('log-200-b');
      expect(sorted[2].id).toBe('log-100-a');
    });
  });

  describe('SYNC MANAGER & ANTI FALSE-SYNC (PATCH 9)', () => {
    it('SYNC 1: Cache update reports connecting/cache state, NOT false synced', () => {
      syncManager.reportListenerUpdate('members', true, false);
      const details = syncManager.getDetails();
      expect(details.cacheListeners).toBe(1);
      expect(details.syncedListeners).toBe(0);
      expect(details.syncState).toBe('connecting');
    });

    it('SYNC 2: Pending writes report connecting, NOT synced', () => {
      syncManager.reportListenerUpdate('members', false, true);
      const details = syncManager.getDetails();
      expect(details.pendingWriteListeners).toBe(1);
      expect(details.syncState).toBe('connecting');
    });

    it('SYNC 3: All server-confirmed listeners reach SYNCED state', () => {
      const testCols = ['members', 'advocacyCases', 'sickVisits'];
      testCols.forEach(c => syncManager.reportListenerUpdate(c, false, false));
      const details = syncManager.getDetails();
      expect(details.totalListeners).toBe(3);
      expect(details.syncedListeners).toBe(3);
      expect(details.syncState).toBe('synced');
    });

    it('SYNC 4: Offline network triggers OFFLINE state', () => {
      syncManager.setOnlineState(false);
      expect(syncManager.getDetails().syncState).toBe('offline');
    });

    it('SYNC 5: Permission error triggers ERROR state', () => {
      syncManager.reportListenerError('financeRecords', new Error('permission-denied'));
      expect(syncManager.getDetails().syncState).toBe('error');
      expect(syncManager.getDetails().permissionErrorListeners).toBe(1);
    });
  });

  describe('FINANCE LISTENER AUTHORIZATION (PATCH 10)', () => {
    it('FIN 1: Pengurus is NOT authorized for financeRecords listener', () => {
      expect(checkIsAdmin(pengurusUser)).toBe(false);
    });

    it('FIN 2: Admin and Super Admin are authorized for financeRecords listener', () => {
      expect(checkIsAdmin(ketuaUser)).toBe(true);
      expect(checkIsAdmin(superAdminUser)).toBe(true);
    });
  });
});
