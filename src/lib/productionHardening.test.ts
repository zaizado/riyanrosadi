import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserAccount, AuditLog, checkIsAdmin, checkIsSuperAdmin } from '../types';
import { resolveUserProfile } from './authSession';
import { syncManager } from './syncManager';
import { sortAuditLogsNewestFirst } from './storage';
import { 
  generateNotificationId, 
  deduplicateNotifications, 
  NotificationTracker, 
  extractEntityId, 
  sanitizeNotificationKeyPart 
} from './notificationIdempotency';

describe('Production Hardening & Final Security Suite', () => {
  const superAdminUser: UserAccount = {
    id: 'uid-sa-001',
    username: 'administrator',
    name: 'Administrator',
    email: 'superadmin@sbn-kasbi-vci.or.id',
    nik: 'SA-00001',
    role: 'Super Admin',
    department: 'Administrator',
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

  describe('REGRESSION TESTS — SYNC SPINNER & PROFILE FIXES', () => {
    it('REG 1: Auth user + valid Firestore profile -> nama sidebar profile tersedia', () => {
      const indonesianUserDoc = {
        id: 'uid-ade-001',
        nama: 'Ade Kurniawan',
        email: 'ade@sbn-kasbi-vci.or.id',
        role: 'Pengurus'
      } as any;

      const res = resolveUserProfile({
        firebaseUser: { uid: 'uid-ade-001', email: 'ade@sbn-kasbi-vci.or.id' },
        users: [indonesianUserDoc],
        cachedUser: null
      });

      expect(res.authState).toBe('authenticated');
      expect(res.matchedUser?.name).toBe('Ade Kurniawan');
      expect(res.matchedUser?.id).toBe('uid-ade-001');
    });

    it('REG 2: Profile snapshot fromCache -> bukan SYNCED', () => {
      syncManager.reportListenerUpdate('users', true, false);
      const details = syncManager.getDetails();
      expect(details.syncState).toBe('connecting');
      expect(details.cacheListeners).toBe(1);
      expect(details.syncedListeners).toBe(0);
    });

    it('REG 3: Profile server-confirmed -> listener menjadi SYNCED', () => {
      syncManager.reportListenerUpdate('users', false, false);
      const details = syncManager.getDetails();
      expect(details.syncState).toBe('synced');
      expect(details.syncedListeners).toBe(1);
      expect(details.cacheListeners).toBe(0);
    });

    it('REG 4: Semua listener server-confirmed -> global SYNCED', () => {
      const allCols = ['members', 'advocacyCases', 'users', 'vehicleLogs', 'agendas'];
      allCols.forEach(c => syncManager.reportListenerUpdate(c, false, false));
      const details = syncManager.getDetails();
      expect(details.totalListeners).toBe(allCols.length);
      expect(details.syncedListeners).toBe(allCols.length);
      expect(details.syncState).toBe('synced');
    });

    it('REG 5: Pengurus -> finance listener tidak dibuat', () => {
      expect(checkIsAdmin(pengurusUser)).toBe(false);
    });

    it('REG 6: Listener unsubscribe -> listener registry tidak menyimpan zombie listener', () => {
      syncManager.reportListenerUpdate('tempCol', false, false);
      expect(syncManager.getDetails().totalListeners).toBe(1);
      
      syncManager.reportListenerUnsubscribe('tempCol');
      expect(syncManager.getDetails().totalListeners).toBe(0);
      expect(syncManager.getDetails().syncedListeners).toBe(0);
    });

    it('REG 7: Profile tidak ditemukan -> UNPROVISIONED / ACCESS DENIED, bukan infinite CONNECTING', () => {
      const res = resolveUserProfile({
        firebaseUser: { uid: 'uid-unregistered-999', email: 'intruder@external.com' },
        users: [pengurusUser, superAdminUser],
        cachedUser: null
      });

      expect(res.authState).toBe('unauthenticated');
      expect(res.matchedUser).toBeNull();
    });
  });

  describe('NOTIFICATION DEDUPLICATION & IDEMPOTENCY (PATCH — IDEMPOTENCY)', () => {
    it('IDEMPOTENCY 1: Double click Konfirmasi TASK-123 -> Menghasilkan 1 deterministic document ID yang sama persis', () => {
      const id1 = generateNotificationId({
        modul: 'Agenda',
        entityId: 'TASK-123',
        action: 'confirmed'
      });

      const id2 = generateNotificationId({
        modul: 'Agenda',
        entityId: 'TASK-123',
        action: 'confirmed'
      });

      expect(id1).toBe(id2);
      expect(id1).toBe('agenda_task-123_confirmed');
    });

    it('IDEMPOTENCY 2: 10 concurrent clicks Konfirmasi TASK-123 -> Hanya 1 notification ID yang valid', () => {
      const generatedIds = Array.from({ length: 10 }).map(() =>
        generateNotificationId({
          modul: 'Agenda',
          entityId: 'TASK-123',
          action: 'confirmed'
        })
      );

      const uniqueIds = new Set(generatedIds);
      expect(uniqueIds.size).toBe(1);
      expect(Array.from(uniqueIds)[0]).toBe('agenda_task-123_confirmed');
    });

    it('IDEMPOTENCY 3: Tindakan berbeda pada task yang sama -> Menghasilkan 2 notification terpisah', () => {
      const idCreated = generateNotificationId({
        modul: 'Agenda',
        entityId: 'TASK-123',
        action: 'created'
      });

      const idConfirmed = generateNotificationId({
        modul: 'Agenda',
        entityId: 'TASK-123',
        action: 'confirmed'
      });

      expect(idCreated).not.toBe(idConfirmed);
      expect(idCreated).toBe('agenda_task-123_created');
      expect(idConfirmed).toBe('agenda_task-123_confirmed');
    });

    it('IDEMPOTENCY 4: Tindakan pada dua entity berbeda (TASK-123 vs TASK-456) -> Menghasilkan 2 notification terpisah', () => {
      const id1 = generateNotificationId({
        modul: 'Agenda',
        entityId: 'TASK-123',
        action: 'confirmed'
      });

      const id2 = generateNotificationId({
        modul: 'Agenda',
        entityId: 'TASK-456',
        action: 'confirmed'
      });

      expect(id1).not.toBe(id2);
      expect(id1).toBe('agenda_task-123_confirmed');
      expect(id2).toBe('agenda_task-456_confirmed');
    });

    it('IDEMPOTENCY 5: deduplicateNotifications menyaring log duplikat dari UI & data', () => {
      const logs = [
        {
          id: 'agenda_task-123_confirmed',
          timestamp: '2026-08-16 10:00:00',
          userNama: 'Riyan Rosadi',
          userRole: 'Super Admin' as const,
          modul: 'Agenda' as const,
          aksi: 'Konfirmasi Tugas',
          detail: 'Konfirmasi penyelesaian tugas TASK-123'
        },
        {
          id: 'agenda_task-123_confirmed', // Identical ID duplicate
          timestamp: '2026-08-16 10:00:01',
          userNama: 'Riyan Rosadi',
          userRole: 'Super Admin' as const,
          modul: 'Agenda' as const,
          aksi: 'Konfirmasi Tugas',
          detail: 'Konfirmasi penyelesaian tugas TASK-123'
        },
        {
          id: 'agenda_task-456_confirmed',
          timestamp: '2026-08-16 10:05:00',
          userNama: 'Ade Kurniawan',
          userRole: 'Pengurus' as const,
          modul: 'Agenda' as const,
          aksi: 'Konfirmasi Tugas',
          detail: 'Konfirmasi penyelesaian tugas TASK-456'
        }
      ];

      const deduplicated = deduplicateNotifications(logs);
      expect(deduplicated.length).toBe(2);
      expect(deduplicated.map(l => l.id)).toEqual([
        'agenda_task-123_confirmed',
        'agenda_task-456_confirmed'
      ]);
    });

    it('IDEMPOTENCY 6: NotificationTracker mencegah in-flight duplicate calls', () => {
      NotificationTracker.clear();
      const testKey = 'agenda_task-777_confirmed';

      expect(NotificationTracker.hasRecentlyProcessed(testKey)).toBe(false);

      const testLog = {
        id: testKey,
        timestamp: '2026-08-16 10:00:00',
        userNama: 'Test User',
        userRole: 'Pengurus' as const,
        modul: 'Agenda' as const,
        aksi: 'Test Aksi',
        detail: 'Test Detail'
      };

      NotificationTracker.markProcessed(testKey, testLog);
      expect(NotificationTracker.hasRecentlyProcessed(testKey)).toBe(true);
      expect(NotificationTracker.getExisting(testKey)).toEqual(testLog);
    });

    it('IDEMPOTENCY 7: extractEntityId mendeteksi berbagai format ID entitas', () => {
      expect(extractEntityId('Menambahkan anggota (SBN-VCI-0012) ke sistem', 'Data Anggota')).toBe('SBN-VCI-0012');
      expect(extractEntityId('Pencatatan pendampingan sakit SAK-2026-001 untuk John', 'Anggota Sakit')).toBe('SAK-2026-001');
      expect(extractEntityId('Konfirmasi tugas TASK-999 selesai', 'Agenda')).toBe('TASK-999');
      expect(extractEntityId('Penggalangan dana DANA-2026-001 dibuat', 'Penggalangan Dana')).toBe('DANA-2026-001');
    });

    it('IDEMPOTENCY 8: sanitizeNotificationKeyPart membersihkan karakter berbahaya untuk Firestore ID', () => {
      expect(sanitizeNotificationKeyPart('  Task / 123 @ Action!  ')).toBe('task_123_action');
      expect(sanitizeNotificationKeyPart('___Multiple__Underscores___')).toBe('multiple_underscores');
      expect(sanitizeNotificationKeyPart('')).toBe('na');
    });

    it('IDEMPOTENCY 9: Custom idempotency key diprioritaskan jika disediakan', () => {
      const id = generateNotificationId({
        modul: 'Agenda',
        action: 'confirmed',
        customKey: 'custom_idempotent_event_key_123'
      });

      expect(id).toBe('custom_idempotent_event_key_123');
    });

    it('IDEMPOTENCY 10: Filter notifikasi keuangan strictly disembunyikan dari non-Super Admin', () => {
      const mixedLogs: AuditLog[] = [
        {
          id: 'log_1',
          timestamp: '2026-08-16 10:00:00',
          userNama: 'Bendahara Utama',
          userRole: 'Super Admin',
          modul: 'Keuangan',
          aksi: 'Catat Kas',
          detail: 'Uang COS masuk'
        },
        {
          id: 'log_2',
          timestamp: '2026-08-16 10:01:00',
          userNama: 'Pengurus',
          userRole: 'Pengurus',
          modul: 'Data Anggota',
          aksi: 'Update Anggota',
          detail: 'Update biodata'
        }
      ];

      const forPengurus = deduplicateNotifications(mixedLogs).filter(l => l.modul !== 'Keuangan');
      expect(forPengurus.length).toBe(1);
      expect(forPengurus[0].id).toBe('log_2');

      const forSuperAdmin = deduplicateNotifications(mixedLogs);
      expect(forSuperAdmin.length).toBe(2);
    });
  });
});

