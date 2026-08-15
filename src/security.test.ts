import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-sbn-kasbi-security-rules-test',
    firestore: {
      host: '127.0.0.1',
      port: 8088,
      rules
    }
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

describe('REAL Firebase Emulator Security Rules Integration Tests', () => {
  it('1. Default catch-all rule: unauthenticated requests to any collection are DENIED', async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(unauthDb, 'members/m1')));
    await assertFails(getDoc(doc(unauthDb, 'users/u1')));
    await assertFails(getDoc(doc(unauthDb, 'financeRecords/f1')));
    await assertFails(getDoc(doc(unauthDb, 'unknownCollection/x1')));
    await assertFails(setDoc(doc(unauthDb, 'members/m1'), { namaLengkap: 'Illegal' }));
  });

  it('2. Privilege escalation protection on user document creation: setting admin roles/flags as regular user is DENIED', async () => {
    const memberContext = testEnv.authenticatedContext('user-regular');
    const db = memberContext.firestore();

    // Setting Super Admin -> DENIED
    await assertFails(
      setDoc(doc(db, 'users/user-regular'), {
        username: 'regular',
        role: 'Super Admin',
        isSuperAdmin: true
      })
    );

    // Setting Ketua -> DENIED
    await assertFails(
      setDoc(doc(db, 'users/user-regular'), {
        username: 'regular',
        role: 'Ketua',
        isAdmin: true
      })
    );

    // Setting Sekretaris -> DENIED
    await assertFails(
      setDoc(doc(db, 'users/user-regular'), {
        username: 'regular',
        role: 'Sekretaris',
        isAdmin: true
      })
    );

    // Creating normal Pengurus account -> SUCCEEDS
    await assertSucceeds(
      setDoc(doc(db, 'users/user-regular'), {
        username: 'regular',
        role: 'Pengurus',
        isSuperAdmin: false,
        isAdmin: false
      })
    );
  });

  it('3. User profile privilege escalation on update: changing role or admin flags is DENIED', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/user-regular'), {
        username: 'regular',
        role: 'Pengurus',
        isSuperAdmin: false,
        isAdmin: false
      });
    });

    const db = testEnv.authenticatedContext('user-regular').firestore();

    // Modifying role -> DENIED
    await assertFails(
      updateDoc(doc(db, 'users/user-regular'), {
        role: 'Super Admin'
      })
    );

    // Modifying isAdmin flag -> DENIED
    await assertFails(
      updateDoc(doc(db, 'users/user-regular'), {
        isAdmin: true
      })
    );

    // Updating non-security profile field -> SUCCEEDS
    await assertSucceeds(
      updateDoc(doc(db, 'users/user-regular'), {
        phone: '08123456789'
      })
    );
  });

  it('4. User profile read access: isolated to self or Pengurus/Admin roles', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/user-anggota'), {
        role: 'Anggota'
      });
      await setDoc(doc(context.firestore(), 'users/user-target'), {
        role: 'Anggota',
        phone: '0812222333'
      });
    });

    const dbAnggota = testEnv.authenticatedContext('user-anggota').firestore();

    // Reading other user profile as regular Anggota -> DENIED
    await assertFails(getDoc(doc(dbAnggota, 'users/user-target')));

    // Reading own profile as regular Anggota -> SUCCEEDS
    await assertSucceeds(getDoc(doc(dbAnggota, 'users/user-anggota')));
  });

  it('5. userClearedNotifs collection: signed-in users can read/write their document by UID', async () => {
    const user1Db = testEnv.authenticatedContext('user-101').firestore();

    // Write cleared notifications doc for user-101 -> SUCCEEDS
    await assertSucceeds(
      setDoc(doc(user1Db, 'userClearedNotifs/user-101'), {
        clearedIds: ['notif-1', 'notif-2']
      })
    );

    // Read cleared notifications doc for user-101 -> SUCCEEDS
    await assertSucceeds(
      getDoc(doc(user1Db, 'userClearedNotifs/user-101'))
    );
  });

  it('6. financeRecords collection: restricted strictly to Admins', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/user-anggota'), {
        role: 'Anggota',
        isAdmin: false
      });
      await setDoc(doc(context.firestore(), 'users/user-admin'), {
        role: 'Bendahara',
        isAdmin: true
      });
      await setDoc(doc(context.firestore(), 'financeRecords/fin-100'), {
        amount: 1500000,
        type: 'pemasukan'
      });
    });

    const dbAnggota = testEnv.authenticatedContext('user-anggota').firestore();
    const dbAdmin = testEnv.authenticatedContext('user-admin').firestore();

    // Anggota reading financeRecords -> DENIED
    await assertFails(getDoc(doc(dbAnggota, 'financeRecords/fin-100')));

    // Admin reading financeRecords -> SUCCEEDS
    await assertSucceeds(getDoc(doc(dbAdmin, 'financeRecords/fin-100')));
  });

  it('7. auditLogs collection: non-superadmin update/deletion is DENIED', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/user-admin'), {
        role: 'Ketua',
        isAdmin: true,
        isSuperAdmin: false
      });
      await setDoc(doc(context.firestore(), 'users/user-superadmin'), {
        role: 'Super Admin',
        isAdmin: true,
        isSuperAdmin: true
      });
      await setDoc(doc(context.firestore(), 'auditLogs/log-999'), {
        userNama: 'John',
        aksi: 'Hapus Anggota'
      });
    });

    const dbAdmin = testEnv.authenticatedContext('user-admin').firestore();
    const dbSuperAdmin = testEnv.authenticatedContext('user-superadmin').firestore();

    // Non-superadmin deleting auditLog -> DENIED
    await assertFails(deleteDoc(doc(dbAdmin, 'auditLogs/log-999')));

    // SuperAdmin deleting auditLog is also STRICTLY DENIED (Audit Log is append-only for all roles)
    await assertFails(deleteDoc(doc(dbSuperAdmin, 'auditLogs/log-999')));
  });
});
