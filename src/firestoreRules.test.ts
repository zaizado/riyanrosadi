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
    projectId: 'demo-sbn-kasbi-test',
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

describe('REAL Firestore Security Rules Emulator Tests', () => {
  it('1. Unauthenticated request to protected collections -> DENIED', async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(unauthDb, 'members/m1')));
    await assertFails(getDoc(doc(unauthDb, 'users/u1')));
    await assertFails(getDoc(doc(unauthDb, 'financeRecords/f1')));
    await assertFails(setDoc(doc(unauthDb, 'members/m1'), { nama: 'Illegal Member' }));
  });

  it('2. Regular member role escalation during user creation -> DENIED', async () => {
    const memberContext = testEnv.authenticatedContext('user-regular');
    const db = memberContext.firestore();

    // Escalation to Super Admin -> DENIED
    await assertFails(
      setDoc(doc(db, 'users/user-regular'), {
        username: 'regular',
        role: 'Super Admin',
        isSuperAdmin: true
      })
    );

    // Escalation to Ketua -> DENIED
    await assertFails(
      setDoc(doc(db, 'users/user-regular'), {
        username: 'regular',
        role: 'Ketua',
        isAdmin: true
      })
    );

    // Escalation to Sekretaris -> DENIED
    await assertFails(
      setDoc(doc(db, 'users/user-regular'), {
        username: 'regular',
        role: 'Sekretaris',
        isAdmin: true
      })
    );

    // Creating normal Pengurus/Anggota account -> SUCCEEDS
    await assertSucceeds(
      setDoc(doc(db, 'users/user-regular'), {
        username: 'regular',
        role: 'Pengurus',
        isSuperAdmin: false,
        isAdmin: false
      })
    );
  });

  it('3. Regular member modifying privileged fields during update -> DENIED', async () => {
    // Seed user-regular in firestore
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
        role: 'Admin'
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

  it('4. Member financeRecords read and write -> DENIED', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/user-regular'), {
        role: 'Anggota'
      });
      await setDoc(doc(context.firestore(), 'financeRecords/fin-1'), {
        amount: 500000,
        type: 'pemasukan'
      });
    });

    const db = testEnv.authenticatedContext('user-regular').firestore();

    await assertFails(getDoc(doc(db, 'financeRecords/fin-1')));
    await assertFails(
      setDoc(doc(db, 'financeRecords/fin-2'), { amount: 1000000 })
    );
  });

  it('5. Authorized Admin financeRecords access -> SUCCEEDS', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/user-admin'), {
        role: 'Ketua',
        isAdmin: true
      });
      await setDoc(doc(context.firestore(), 'financeRecords/fin-1'), {
        amount: 500000,
        type: 'pemasukan'
      });
    });

    const db = testEnv.authenticatedContext('user-admin').firestore();

    await assertSucceeds(getDoc(doc(db, 'financeRecords/fin-1')));
    await assertSucceeds(
      setDoc(doc(db, 'financeRecords/fin-2'), { amount: 1000000 })
    );
  });

  it('6. Member auditLogs delete or update -> DENIED', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'auditLogs/log-1'), {
        user: 'system',
        action: 'DELETE_MEMBER'
      });
    });

    const db = testEnv.authenticatedContext('user-regular').firestore();

    await assertFails(deleteDoc(doc(db, 'auditLogs/log-1')));
    await assertFails(updateDoc(doc(db, 'auditLogs/log-1'), { action: 'MODIFIED' }));
  });

  it('7. userClearedNotifs collection signed in user access', async () => {
    const user1Db = testEnv.authenticatedContext('user-1').firestore();

    // Signed in user creating or updating cleared notifications -> SUCCEEDS
    await assertSucceeds(
      setDoc(doc(user1Db, 'userClearedNotifs/user-1'), {
        clearedIds: ['notif-1']
      })
    );

    // Reading cleared notifications -> SUCCEEDS
    await assertSucceeds(
      getDoc(doc(user1Db, 'userClearedNotifs/user-1'))
    );
  });

  it('8. Users list read isolation for regular members -> DENIED', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/user-regular'), {
        role: 'Anggota'
      });
      await setDoc(doc(context.firestore(), 'users/user-other'), {
        role: 'Anggota',
        phone: '0899999999'
      });
    });

    const db = testEnv.authenticatedContext('user-regular').firestore();

    // Reading another user profile as regular Anggota -> DENIED
    await assertFails(getDoc(doc(db, 'users/user-other')));

    // Reading own profile as regular Anggota -> SUCCEEDS
    await assertSucceeds(getDoc(doc(db, 'users/user-regular')));
  });
});
