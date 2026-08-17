import { UserAccount } from '../types';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';
import { INITIAL_USERS } from '../data/initialData';
import { STRUKTUR_PENGURUS_DATA } from '../data/strukturPengurusData';

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
  const emailPrefix = emailLower ? emailLower.split('@')[0] : '';
  
  // 1. Check in live users array - prioritize auth UID first
  let matched = users.find(u => u.id === firebaseUser.uid) ||
                users.find(u => u.email && u.email.toLowerCase() === emailLower) ||
                users.find(u => emailPrefix && (
                  (u.username && u.username.toLowerCase() === emailPrefix) ||
                  (u.nik && u.nik.toLowerCase() === emailPrefix)
                ));

  // 2. Check in cached local user (e.g. on browser reload before Firestore snapshot arrives)
  if (!matched && cachedUser) {
    if (
      cachedUser.id === firebaseUser.uid || 
      (cachedUser.email && cachedUser.email.toLowerCase() === emailLower) ||
      (emailPrefix && cachedUser.username && cachedUser.username.toLowerCase() === emailPrefix)
    ) {
      matched = cachedUser;
    }
  }

  // 3. Check in initial predefined users list
  if (!matched) {
    const fromInit = INITIAL_USERS.find(u => 
      (u.email && u.email.toLowerCase() === emailLower) ||
      (emailPrefix && u.username && u.username.toLowerCase() === emailPrefix) ||
      (emailPrefix && u.nik && u.nik.toLowerCase() === emailPrefix)
    );
    if (fromInit) {
      matched = {
        ...fromInit,
        id: firebaseUser.uid
      };
    }
  }

  // 4. Check in official organizational structure
  if (!matched && emailPrefix) {
    const fromStruktur = STRUKTUR_PENGURUS_DATA.find(p => 
      p.nik.toLowerCase() === emailPrefix ||
      p.nama.toLowerCase().replace(/\s+/g, '') === emailPrefix ||
      p.nama.toLowerCase().replace(/\s+/g, '.') === emailPrefix
    );
    if (fromStruktur) {
      let roleToAssign: UserAccount['role'] = 'Pengurus';
      if (fromStruktur.jabatan === 'Ketua' || fromStruktur.jabatan === 'Wakil Ketua') {
        roleToAssign = 'Ketua';
      } else if (fromStruktur.jabatan === 'Sekretaris') {
        roleToAssign = 'Sekretaris';
      } else if (fromStruktur.jabatan === 'Bendahara') {
        roleToAssign = 'Bendahara';
      } else if (fromStruktur.jabatan === 'Super Admin') {
        roleToAssign = 'Super Admin';
      } else if (fromStruktur.jabatan === 'Administrator') {
        roleToAssign = 'Administrator';
      } else if (fromStruktur.jabatan === 'Admin') {
        roleToAssign = 'Admin';
      } else if (fromStruktur.jabatan === 'Anggota') {
        roleToAssign = 'Anggota';
      }

      matched = {
        id: firebaseUser.uid,
        username: emailPrefix,
        name: fromStruktur.nama,
        email: firebaseUser.email || `${emailPrefix}@sbn-kasbi-vci.or.id`,
        nik: fromStruktur.nik,
        role: roleToAssign,
        department: fromStruktur.departemen || 'PT Victory Chingluh Indonesia',
        phoneNumber: fromStruktur.noHp || '-',
        avatarUrl: fromStruktur.fotoUrl || cheAvatar,
        isSuperAdmin: roleToAssign === 'Super Admin'
      };
    }
  }

  // 5. Fallback for Super Admin bootstrap
  if (!matched) {
    const isSA = emailLower === 'superadmin@sbn-kasbi-vci.or.id' || 
                 emailLower === 'administrator@sbn-kasbi-vci.or.id' || 
                 emailLower === 'riyanrosadi@sbn-kasbi-vci.or.id' || 
                 emailLower === 'riyanrosadi@gmail.com' ||
                 emailPrefix === 'administrator' ||
                 emailPrefix === 'admin' ||
                 emailPrefix === 'sbnkasbivci1' ||
                 emailPrefix === 'superadmin';
    if (isSA) {
      const saName = emailLower.includes('riyan')
        ? (firebaseUser.displayName || 'Riyan Rosadi (Super Admin)')
        : (firebaseUser.displayName || 'Administrator');

      matched = {
        id: firebaseUser.uid,
        username: 'administrator',
        name: saName,
        email: firebaseUser.email || 'superadmin@sbn-kasbi-vci.or.id',
        nik: 'SA-00001',
        role: 'Super Admin',
        department: 'Administrator',
        isSuperAdmin: true,
        avatarUrl: cheAvatar
      };
    } else {
      // Unprovisioned accounts have no default Pengurus role
      return {
        authState: 'unauthenticated',
        matchedUser: null
      };
    }
  }

  const raw = matched as any;
  let resolvedName = raw.name || raw.nama || raw.displayName || raw.fullName || firebaseUser.displayName;
  if (!resolvedName || resolvedName.trim() === '') {
    if (emailLower.includes('riyan')) {
      resolvedName = 'Riyan Rosadi';
    } else if (raw.username) {
      resolvedName = raw.username;
    } else {
      resolvedName = 'Pengurus SBN';
    }
  }

  const resolvedUsername = raw.username || raw.userName || (emailPrefix || 'user');

  let normalizedRole: UserAccount['role'] = 'Pengurus';
  const rawRole = raw.role || raw.jabatan;
  if (rawRole === 'Super Admin') normalizedRole = 'Super Admin';
  else if (rawRole === 'Administrator') normalizedRole = 'Administrator';
  else if (rawRole === 'Admin') normalizedRole = 'Admin';
  else if (rawRole === 'Ketua' || rawRole === 'Wakil Ketua') normalizedRole = 'Ketua';
  else if (rawRole === 'Sekretaris') normalizedRole = 'Sekretaris';
  else if (rawRole === 'Bendahara') normalizedRole = 'Bendahara';
  else if (rawRole === 'Anggota') normalizedRole = 'Anggota';
  else if (rawRole === 'Pengurus') normalizedRole = 'Pengurus';

  const normalizedUser: UserAccount = {
    ...matched,
    id: raw.id || firebaseUser.uid,
    name: resolvedName,
    username: resolvedUsername,
    email: raw.email || firebaseUser.email || '',
    nik: raw.nik || raw.noKtp || raw.nip || '-',
    role: normalizedRole,
    department: raw.department || raw.departemen || raw.divisi || 'PT Victory Chingluh Indonesia',
    phoneNumber: raw.phoneNumber || raw.phone || raw.nomorHp || raw.noHp || '-',
    avatarUrl: raw.avatarUrl || raw.fotoUrl || cheAvatar,
    isSuperAdmin: normalizedRole === 'Super Admin' || raw.isSuperAdmin === true || false,
    isAdmin: raw.isAdmin || normalizedRole === 'Super Admin' || normalizedRole === 'Ketua' || normalizedRole === 'Sekretaris' || normalizedRole === 'Administrator' || normalizedRole === 'Admin' || normalizedRole === 'Bendahara' || false
  };

  return {
    authState: 'authenticated',
    matchedUser: normalizedUser
  };
}
