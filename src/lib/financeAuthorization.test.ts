import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkIsAdmin, checkIsSuperAdmin, UserAccount } from '../types';
import { syncManager } from './syncManager';

describe('Finance Listener Role Authorization & Anti-Error Sync Tests', () => {
  const superAdminUser: UserAccount = {
    id: 'uid-sa-1',
    username: 'sbnkasbivci1',
    name: 'Super Admin',
    email: 'superadmin@sbn-kasbi-vci.or.id',
    nik: 'SA-001',
    role: 'Super Admin',
    isSuperAdmin: true
  };

  const adminBendaharaUser: UserAccount = {
    id: 'uid-ben-1',
    username: 'bendahara1',
    name: 'Bendahara Organisasi',
    email: 'bendahara@sbn-kasbi-vci.or.id',
    nik: '2104005',
    role: 'Administrator', // or Admin/Bendahara/Ketua/Sekretaris
    isAdmin: true,
    isSuperAdmin: false
  };

  const ketuaUser: UserAccount = {
    id: 'uid-ketua-1',
    username: 'ketua1',
    name: 'Ketua Serikat',
    email: 'ketua@sbn-kasbi-vci.or.id',
    nik: '2104001',
    role: 'Ketua',
    isSuperAdmin: false
  };

  const pengurusBiasaUser: UserAccount = {
    id: 'uid-pengurus-99',
    username: 'pengurusbiasa',
    name: 'Pengurus Lapangan',
    email: 'pengurus@sbn-kasbi-vci.or.id',
    nik: '2104099',
    role: 'Pengurus',
    isSuperAdmin: false,
    isAdmin: false
  };

  beforeEach(() => {
    syncManager.setOnlineState(true);
    // Reset sync listeners
    const allCollections = [
      'members', 'advocacyCases', 'sickVisits', 'fundraising',
      'agendas', 'notulensi', 'sembakoEvents', 'sembakoClaims',
      'vehicleLogs', 'users', 'severanceCalculations', 'severanceRules',
      'auditLogs', 'financeRecords'
    ];
    allCollections.forEach(c => syncManager.reportListenerUnsubscribe(c));
  });

  it('TEST 1: Super Admin -> finance listener dibuat & diizinkan', () => {
    const isAuthorized = checkIsAdmin(superAdminUser, { email: superAdminUser.email });
    expect(isAuthorized).toBe(true);
    expect(checkIsSuperAdmin(superAdminUser)).toBe(true);

    // Super admin registers finance listener and it receives updates
    syncManager.reportListenerUpdate('financeRecords', false, false);
    const details = syncManager.getDetails();
    expect(details.totalListeners).toBe(1);
    expect(details.syncedListeners).toBe(1);
    expect(details.syncState).toBe('synced');
  });

  it('TEST 2: Admin / Bendahara / Ketua -> finance listener dibuat jika rules mengizinkannya', () => {
    expect(checkIsAdmin(adminBendaharaUser, { email: adminBendaharaUser.email })).toBe(true);
    expect(checkIsAdmin(ketuaUser, { email: ketuaUser.email })).toBe(true);

    // Whitelist role 'Bendahara'
    const bendaharaRoleUser: UserAccount = {
      ...pengurusBiasaUser,
      role: 'Administrator' as any
    };
    expect(checkIsAdmin(bendaharaRoleUser)).toBe(true);
  });

  it('TEST 3: Role yang tidak memiliki finance read permission (Pengurus biasa) -> finance listener TIDAK dibuat', () => {
    const isAuthorized = checkIsAdmin(pengurusBiasaUser, { email: pengurusBiasaUser.email });
    expect(isAuthorized).toBe(false);
  });

  it('TEST 4: Pengurus login -> tidak ada permission-denied dari financeRecords', () => {
    // Simulated Pengurus login:
    const isAuthorized = checkIsAdmin(pengurusBiasaUser, { email: pengurusBiasaUser.email });
    const subscribeMock = vi.fn();

    if (isAuthorized) {
      subscribeMock('financeRecords');
    }

    // Because isAuthorized is false, subscribeMock was never called
    expect(subscribeMock).not.toHaveBeenCalled();
    expect(syncManager.getDetails().permissionErrorListeners).toBe(0);
  });

  it('TEST 5: Pengurus login -> SyncManager tidak mendapat finance listener error', () => {
    // Pengurus registers the 13 authorized general collections:
    const authorizedCollections = [
      'members', 'advocacyCases', 'sickVisits', 'fundraising',
      'agendas', 'notulensi', 'sembakoEvents', 'sembakoClaims',
      'vehicleLogs', 'users', 'severanceCalculations', 'severanceRules',
      'auditLogs'
    ];

    authorizedCollections.forEach(c => {
      syncManager.reportListenerUpdate(c, true, false); // initial cache
    });

    const details = syncManager.getDetails();
    expect(details.totalListeners).toBe(13);
    expect(details.permissionErrorListeners).toBe(0);
    expect(details.errorListeners).toBe(0);
  });

  it('TEST 6: Pengurus login -> status sync dapat mencapai SYNCED jika seluruh listener lain sudah server-confirmed', () => {
    const authorizedCollections = [
      'members', 'advocacyCases', 'sickVisits', 'fundraising',
      'agendas', 'notulensi', 'sembakoEvents', 'sembakoClaims',
      'vehicleLogs', 'users', 'severanceCalculations', 'severanceRules',
      'auditLogs'
    ];

    // All 13 collections get confirmed from server
    authorizedCollections.forEach(c => {
      syncManager.reportListenerUpdate(c, false, false);
    });

    const details = syncManager.getDetails();
    expect(details.totalListeners).toBe(13);
    expect(details.syncedListeners).toBe(13);
    expect(details.permissionErrorListeners).toBe(0);
    expect(details.syncState).toBe('synced');
  });

  it('TEST 7: Admin/Super Admin -> financeRecords tetap realtime & disinkronkan', () => {
    const allCollections = [
      'members', 'advocacyCases', 'sickVisits', 'fundraising',
      'agendas', 'notulensi', 'sembakoEvents', 'sembakoClaims',
      'vehicleLogs', 'users', 'severanceCalculations', 'severanceRules',
      'auditLogs', 'financeRecords'
    ];

    // Admin subscribes to all 14 collections including financeRecords
    allCollections.forEach(c => {
      syncManager.reportListenerUpdate(c, false, false);
    });

    const details = syncManager.getDetails();
    expect(details.totalListeners).toBe(14);
    expect(details.syncedListeners).toBe(14);
    expect(details.syncState).toBe('synced');
  });
});
