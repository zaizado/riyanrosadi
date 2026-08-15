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
  
  // 1. Check in live users array
  let matched = users.find(u => u.id === firebaseUser.uid || (u.email && u.email.toLowerCase() === emailLower));

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
        name: 'Super Admin SBN KASBI',
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

  return {
    authState: 'authenticated',
    matchedUser: matched
  };
}
