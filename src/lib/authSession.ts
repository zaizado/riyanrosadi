import { UserAccount } from '../types';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';

export type AuthState = 'initializing' | 'authenticated' | 'unauthenticated';

export interface ResolveUserParams {
  firebaseUser: { uid: string; email?: string | null; displayName?: string | null } | null;
  users: UserAccount[];
  cachedUser?: UserAccount | null;
}

export function resolveUserProfile({
  firebaseUser,
  users,
  cachedUser
}: ResolveUserParams): { authState: AuthState; matchedUser: UserAccount | null } {
  if (!firebaseUser) {
    return {
      authState: 'unauthenticated',
      matchedUser: null
    };
  }

  const emailLower = firebaseUser.email?.toLowerCase() || '';
  
  // 1. Check in live users array - prioritize auth UID first
  let matched = users.find(u => u.id === firebaseUser.uid) ||
                users.find(u => u.email && u.email.toLowerCase() === emailLower);

  // 2. Check in cached local user (e.g. on browser reload before Firestore snapshot arrives)
  if (!matched && cachedUser) {
    if (cachedUser.id === firebaseUser.uid || (cachedUser.email && cachedUser.email.toLowerCase() === emailLower)) {
      matched = cachedUser;
    }
  }

  // 3. Fallback for Super Admin bootstrap
  if (!matched) {
    const isSA = emailLower === 'superadmin@sbn-kasbi-vci.or.id' || 
                 emailLower === 'riyanrosadi@sbn-kasbi-vci.or.id' || 
                 emailLower === 'riyanrosadi@gmail.com';
    if (isSA) {
      matched = {
        id: firebaseUser.uid,
        username: 'sbnkasbivci1',
        name: firebaseUser.displayName || 'Super Admin SBN KASBI',
        email: firebaseUser.email || 'superadmin@sbn-kasbi-vci.or.id',
        nik: 'SA-00001',
        role: 'Super Admin',
        department: 'Dewan Pimpinan Utama',
        isSuperAdmin: true,
        avatarUrl: cheAvatar
      };
    } else {
      // Strict Security Hardening (PATCH 2): Unprovisioned accounts have no default Pengurus role
      return {
        authState: 'unauthenticated',
        matchedUser: null
      };
    }
  }

  const raw = matched as any;
  const resolvedName = raw.name || raw.nama || raw.displayName || raw.fullName || firebaseUser.displayName || raw.username || 'Pengurus SBN';
  const resolvedUsername = raw.username || raw.userName || (emailLower ? emailLower.split('@')[0] : 'user');

  const normalizedUser: UserAccount = {
    ...matched,
    id: raw.id || firebaseUser.uid,
    name: resolvedName,
    username: resolvedUsername,
    email: raw.email || firebaseUser.email || '',
    nik: raw.nik || raw.noKtp || raw.nip || '-',
    role: raw.role || raw.jabatan || 'Pengurus',
    department: raw.department || raw.departemen || raw.divisi || 'PT Victory Chingluh Indonesia',
    phoneNumber: raw.phoneNumber || raw.phone || raw.nomorHp || raw.noHp || '-',
    avatarUrl: raw.avatarUrl || raw.fotoUrl || cheAvatar,
    isSuperAdmin: raw.role === 'Super Admin' || raw.isSuperAdmin === true || false,
    isAdmin: raw.isAdmin || false
  };

  return {
    authState: 'authenticated',
    matchedUser: normalizedUser
  };
}
