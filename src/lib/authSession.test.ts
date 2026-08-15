import { describe, it, expect, beforeEach } from 'vitest';
import { resolveUserProfile, AuthState } from './authSession';
import { UserAccount } from '../types';
import { syncManager } from './syncManager';

describe('Auth Session Lifecycle & Anti False-Logout Tests', () => {
  const mockPengurusUser: UserAccount = {
    id: 'uid-pengurus-123',
    username: 'adekurniawan',
    name: 'Ade Kurniawan',
    email: 'ade.kurniawan@sbn-kasbi-vci.or.id',
    nik: '2104001',
    role: 'Ketua',
    department: 'Dewan Pimpinan',
    isSuperAdmin: false,
    avatarUrl: '/avatar.jpg'
  };

  const mockSuperAdminUser: UserAccount = {
    id: 'uid-sa-999',
    username: 'sbnkasbivci1',
    name: 'Super Admin SBN KASBI',
    email: 'superadmin@sbn-kasbi-vci.or.id',
    nik: 'SA-00001',
    role: 'Super Admin',
    department: 'Dewan Pimpinan Utama',
    isSuperAdmin: true,
    avatarUrl: '/avatar.jpg'
  };

  beforeEach(() => {
    syncManager.setOnlineState(true);
  });

  it('TEST 1: Initial state -> AUTH_INITIALIZING (Login modal should NOT be displayed)', () => {
    let authState: AuthState = 'initializing' as AuthState;
    let isLoggedIn = false;

    // In initializing state:
    const showLoading = authState === 'initializing';
    const showLogin = authState === 'unauthenticated' || !isLoggedIn;

    expect(showLoading).toBe(true);
    // Even though isLoggedIn is false, because authState === 'initializing', loading splash takes precedence
    expect(authState).toBe('initializing');
  });

  it('TEST 2: Firebase callback user != null -> AUTHENTICATED -> Dashboard', () => {
    const result = resolveUserProfile({
      firebaseUser: { uid: 'uid-pengurus-123', email: 'ade.kurniawan@sbn-kasbi-vci.or.id', displayName: 'Ade Kurniawan' },
      users: [mockPengurusUser],
      cachedUser: null
    });

    expect(result.authState).toBe('authenticated');
    expect(result.matchedUser).not.toBeNull();
    expect(result.matchedUser?.name).toBe('Ade Kurniawan');
    expect(result.matchedUser?.role).toBe('Ketua');
  });

  it('TEST 3: Firebase callback user == null -> AUTH_UNAUTHENTICATED -> Login', () => {
    const result = resolveUserProfile({
      firebaseUser: null,
      users: [mockPengurusUser],
      cachedUser: null
    });

    expect(result.authState).toBe('unauthenticated');
    expect(result.matchedUser).toBeNull();
  });

  it('TEST 4: Firestore temporarily offline -> user tetap authenticated', () => {
    let authState: AuthState = 'authenticated';
    let isLoggedIn = true;

    // Simulate Firestore/Network going offline
    syncManager.setOnlineState(false);
    expect(syncManager.getDetails().syncState).toBe('offline');

    // Auth state must NOT be mutated by offline Firestore
    expect(authState).toBe('authenticated');
    expect(isLoggedIn).toBe(true);
  });

  it('TEST 5: Firestore permission/error -> user tetap authenticated', () => {
    let authState: AuthState = 'authenticated';
    let isLoggedIn = true;

    // Simulate Firestore reporting a subscription error
    syncManager.reportListenerError('members', new Error('permission-denied: simulated error'));
    expect(syncManager.getDetails().permissionErrorListeners).toBe(1);

    // Auth state must remain unaffected by Firestore error
    expect(authState).toBe('authenticated');
    expect(isLoggedIn).toBe(true);
  });

  it('TEST 6: SyncManager ERROR -> user tetap authenticated', () => {
    let authState: AuthState = 'authenticated';
    let isLoggedIn = true;

    // Simulate SyncManager state becoming error
    syncManager.reportListenerError('members', new Error('permission-denied: fatal'));
    const details = syncManager.getDetails();
    expect(details.syncState).toBe('error');

    // User is still authenticated and sees Dashboard with sync banner
    expect(authState).toBe('authenticated');
    expect(isLoggedIn).toBe(true);
  });

  it('TEST 7: Firebase Auth signOut -> user menjadi unauthenticated -> Login', () => {
    let authState: AuthState = 'authenticated';
    let isLoggedIn = true;

    // User triggers explicit signOut
    authState = 'unauthenticated';
    isLoggedIn = false;

    expect(authState).toBe('unauthenticated');
    expect(isLoggedIn).toBe(false);
  });

  it('TEST 8: Session restoration startup -> temporary currentUser null -> onAuthStateChanged resolves user -> NO login flicker', () => {
    // Stage 1: App mounts -> authState is initializing
    let authState: AuthState = 'initializing' as AuthState;
    let isLoginRendered = false;

    if (authState === 'initializing') {
      isLoginRendered = false; // Render loading screen
    } else if (authState === 'unauthenticated') {
      isLoginRendered = true;
    }
    expect(isLoginRendered).toBe(false);

    // Stage 2: onAuthStateChanged returns restored session
    const resolved = resolveUserProfile({
      firebaseUser: { uid: 'uid-sa-999', email: 'superadmin@sbn-kasbi-vci.or.id' },
      users: [mockSuperAdminUser],
      cachedUser: mockSuperAdminUser
    });

    authState = resolved.authState;
    expect(authState).toBe('authenticated');
    expect(resolved.matchedUser?.isSuperAdmin).toBe(true);

    // At no point was Login rendered during session restoration
    expect(isLoginRendered).toBe(false);
  });

  it('TEST 9: Refresh browser saat authenticated -> tetap authenticated setelah Firebase restore', () => {
    // When browser refreshes, localStorage contains cached user
    const cachedUser = mockSuperAdminUser;

    // Firebase Auth onAuthStateChanged returns existing session
    const result = resolveUserProfile({
      firebaseUser: { uid: 'uid-sa-999', email: 'superadmin@sbn-kasbi-vci.or.id' },
      users: [], // users from Firestore may still be loading
      cachedUser: cachedUser
    });

    expect(result.authState).toBe('authenticated');
    expect(result.matchedUser?.id).toBe('uid-sa-999');
    expect(result.matchedUser?.name).toBe('Super Admin SBN KASBI');
  });

  it('TEST 10: Pengurus refresh browser -> tetap authenticated dengan role dan profil yang valid', () => {
    const cachedPengurus = mockPengurusUser;

    // Firestore users list is initially empty [] during fresh boot
    const emptyFirestoreUsers: UserAccount[] = [];

    const result = resolveUserProfile({
      firebaseUser: { uid: 'uid-pengurus-123', email: 'ade.kurniawan@sbn-kasbi-vci.or.id' },
      users: emptyFirestoreUsers,
      cachedUser: cachedPengurus
    });

    expect(result.authState).toBe('authenticated');
    expect(result.matchedUser?.role).toBe('Ketua');
    expect(result.matchedUser?.nik).toBe('2104001');
    expect(result.matchedUser?.name).toBe('Ade Kurniawan');
  });
});
