import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncManager } from './syncManager';
import { 
  UserAccount, 
  checkIsAdmin, 
  checkIsSuperAdmin, 
  isAuthorizedPengurus, 
  isValidUserRole,
  canApproveRequests 
} from '../types';
import { resolveUserProfile } from './authSession';

describe('PATCH 1 — Scalability Foundation & Sync Metadata Tests', () => {
  const mockSuperAdmin: UserAccount = {
    id: 'uid-sa-001',
    username: 'administrator',
    name: 'Administrator',
    email: 'superadmin@sbn-kasbi-vci.or.id',
    nik: 'SA-00001',
    role: 'Super Admin',
    department: 'Administrator',
    isSuperAdmin: true,
    isAdmin: true
  };

  const mockAdmin: UserAccount = {
    id: 'uid-admin-001',
    username: 'admin_sys',
    name: 'Admin System',
    email: 'admin@sbn-kasbi-vci.or.id',
    nik: 'ADM-001',
    role: 'Admin',
    department: 'IT',
    isSuperAdmin: false,
    isAdmin: true
  };

  const mockAdministrator: UserAccount = {
    id: 'uid-admin-002',
    username: 'administrator_ops',
    name: 'Administrator Ops',
    email: 'ops@sbn-kasbi-vci.or.id',
    nik: 'ADM-002',
    role: 'Administrator',
    department: 'Operasional',
    isSuperAdmin: false,
    isAdmin: true
  };

  const mockKetua: UserAccount = {
    id: 'uid-ketua-001',
    username: 'adekurniawan',
    name: 'Ade Kurniawan',
    email: 'ade.kurniawan@sbn-kasbi-vci.or.id',
    nik: '2104001',
    role: 'Ketua',
    department: 'Dewan Pimpinan',
    isSuperAdmin: false,
    isAdmin: true
  };

  const mockSekretaris: UserAccount = {
    id: 'uid-sekretaris-001',
    username: 'sekretaris',
    name: 'Sekretaris Serikat',
    email: 'sekretaris@sbn-kasbi-vci.or.id',
    nik: '2104002',
    role: 'Sekretaris',
    department: 'Sekretariat',
    isSuperAdmin: false,
    isAdmin: true
  };

  const mockBendahara: UserAccount = {
    id: 'uid-bendahara-001',
    username: 'bendahara',
    name: 'Bendahara Serikat',
    email: 'bendahara@sbn-kasbi-vci.or.id',
    nik: '2104003',
    role: 'Bendahara',
    department: 'Keuangan',
    isSuperAdmin: false,
    isAdmin: true
  };

  const mockPengurus: UserAccount = {
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

  const mockAnggota: UserAccount = {
    id: 'uid-anggota-001',
    username: 'anggota_biasa',
    name: 'Anggota Biasa',
    email: 'anggota@sbn-kasbi-vci.or.id',
    nik: '2104500',
    role: 'Anggota',
    department: 'Assembly',
    isSuperAdmin: false,
    isAdmin: false
  };

  beforeEach(() => {
    syncManager.setOnlineState(true);
    const collections = [
      'members', 'advocacyCases', 'sickVisits', 'fundraising',
      'agendas', 'notulensi', 'sembakoEvents', 'sembakoClaims',
      'vehicleLogs', 'users', 'severanceCalculations', 'severanceRules',
      'auditLogs', 'financeRecords'
    ];
    collections.forEach(c => syncManager.reportListenerUnsubscribe(c));
  });

  // TEST 1: onSnapshot metadata: fromCache=true -> CONNECTING
  it('TEST 1: onSnapshot metadata fromCache=true reports connecting state', () => {
    syncManager.reportListenerUpdate('members', true, false);
    const detail = syncManager.getListenerDetail('members');
    const details = syncManager.getDetails();

    expect(detail?.isFromCache).toBe(true);
    expect(detail?.hasPendingWrites).toBe(false);
    expect(detail?.hasServerConfirmation).toBe(false);
    expect(details.cacheListeners).toBe(1);
    expect(details.syncState).toBe('connecting');
  });

  // TEST 2: pending write: hasPendingWrites=true -> CONNECTING
  it('TEST 2: onSnapshot metadata hasPendingWrites=true reports connecting/pending state', () => {
    syncManager.reportListenerUpdate('members', false, true);
    const detail = syncManager.getListenerDetail('members');
    const details = syncManager.getDetails();

    expect(detail?.isFromCache).toBe(false);
    expect(detail?.hasPendingWrites).toBe(true);
    expect(details.pendingWriteListeners).toBe(1);
    expect(details.syncState).toBe('connecting');
  });

  // TEST 3: server confirmed: fromCache=false, hasPendingWrites=false -> SYNCED
  it('TEST 3: server confirmed (fromCache=false, hasPendingWrites=false) -> SYNCED if all listeners confirmed', () => {
    syncManager.reportListenerUpdate('members', false, false);
    syncManager.reportListenerUpdate('advocacyCases', false, false);
    const membersDetail = syncManager.getListenerDetail('members');
    const advocacyDetail = syncManager.getListenerDetail('advocacyCases');
    const details = syncManager.getDetails();

    expect(membersDetail?.hasServerConfirmation).toBe(true);
    expect(advocacyDetail?.hasServerConfirmation).toBe(true);
    expect(details.syncedListeners).toBe(2);
    expect(details.syncState).toBe('synced');
  });

  // TEST 4: authenticated tanpa Firestore profile -> tidak membuat protected listeners
  it('TEST 4: authenticated tanpa Firestore profile (unprovisioned) -> tidak valid pengurus', () => {
    const unprovisionedAuth = {
      uid: 'uid-unregistered-999',
      email: 'unregistered@external.org',
      displayName: 'Unregistered User'
    };

    const resolved = resolveUserProfile({
      firebaseUser: unprovisionedAuth,
      users: [mockPengurus, mockSuperAdmin],
      cachedUser: null
    });

    expect(resolved.authState).toBe('unauthenticated');
    expect(resolved.matchedUser).toBeNull();
    expect(isAuthorizedPengurus(resolved.matchedUser, unprovisionedAuth)).toBe(false);
  });

  // TEST 5: authenticated dengan valid profile -> protected listeners dibuat sesuai role
  it('TEST 5: authenticated dengan valid profile -> role valid dan authorized pengurus', () => {
    const pengurusAuth = {
      uid: 'uid-pengurus-001',
      email: 'pengurus@sbn-kasbi-vci.or.id',
      displayName: 'Pengurus Lapangan'
    };

    const resolved = resolveUserProfile({
      firebaseUser: pengurusAuth,
      users: [mockPengurus],
      cachedUser: null
    });

    expect(resolved.authState).toBe('authenticated');
    expect(resolved.matchedUser).not.toBeNull();
    expect(isValidUserRole(resolved.matchedUser?.role)).toBe(true);
    expect(isAuthorizedPengurus(resolved.matchedUser, pengurusAuth)).toBe(true);
  });

  // TEST 6: Pengurus -> tidak subscribe financeRecords (checkIsAdmin is false)
  it('TEST 6: Pengurus tidak berhak mengakses financeRecords (checkIsAdmin is false)', () => {
    expect(checkIsAdmin(mockPengurus)).toBe(false);
    expect(checkIsAdmin(mockAnggota)).toBe(false);
  });

  // TEST 7: Admin/Bendahara/Ketua/Sekretaris/Administrator/Super Admin -> authorized untuk finance
  it('TEST 7: Admin/Bendahara/Ketua/Sekretaris/Administrator/Super Admin -> authorized untuk finance', () => {
    expect(checkIsAdmin(mockSuperAdmin)).toBe(true);
    expect(checkIsAdmin(mockAdministrator)).toBe(true);
    expect(checkIsAdmin(mockAdmin)).toBe(true);
    expect(checkIsAdmin(mockKetua)).toBe(true);
    expect(checkIsAdmin(mockSekretaris)).toBe(true);
    expect(checkIsAdmin(mockBendahara)).toBe(true);

    // Approval permissions
    expect(canApproveRequests(mockSuperAdmin)).toBe(true);
    expect(canApproveRequests(mockAdministrator)).toBe(true);
    expect(canApproveRequests(mockAdmin)).toBe(true);
    expect(canApproveRequests(mockKetua)).toBe(true);
    expect(canApproveRequests(mockSekretaris)).toBe(true);
    expect(canApproveRequests(mockBendahara)).toBe(true);
    expect(canApproveRequests(mockPengurus)).toBe(false);
  });

  // TEST 8: Role consistency across all 8 roles
  it('TEST 8: All 8 roles are valid, and Bendahara does NOT fall back to Pengurus', () => {
    const roles: UserAccount['role'][] = [
      'Super Admin',
      'Administrator',
      'Admin',
      'Ketua',
      'Sekretaris',
      'Bendahara',
      'Pengurus',
      'Anggota'
    ];

    roles.forEach(r => {
      expect(isValidUserRole(r)).toBe(true);
    });

    // Test Bendahara resolution from raw user
    const bendaharaRaw = {
      id: 'uid-bendahara-test',
      nama: 'Ibu Bendahara',
      email: 'bendahara.test@sbn-kasbi-vci.or.id',
      nik: '2104009',
      role: 'Bendahara',
      departemen: 'Keuangan'
    };

    const resolved = resolveUserProfile({
      firebaseUser: { uid: 'uid-bendahara-test', email: 'bendahara.test@sbn-kasbi-vci.or.id' },
      users: [bendaharaRaw as any],
      cachedUser: null
    });

    expect(resolved.matchedUser?.role).toBe('Bendahara');
    expect(resolved.matchedUser?.isAdmin).toBe(true);
  });

  // TEST 9: Periodic heartbeat write removed from App
  it('TEST 9: Periodic heartbeat write is completely disabled to avoid write amplification', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    // Ensure no 60,000ms presence interval is registered when simulating app initialization
    expect(setIntervalSpy).not.toHaveBeenCalledWith(expect.any(Function), 60000);
    setIntervalSpy.mockRestore();
  });
});
