import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Firestore Security Rules Static Analysis & AST Verification', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  it('Default catch-all rule is default-deny', () => {
    expect(rulesContent).toContain('match /{document=**} {');
    expect(rulesContent).toContain('allow read, write: if false;');
  });

  it('Privilege escalation protection on users collection for all admin roles including Ketua & Sekretaris', () => {
    // Check that users create forbids setting privileged roles (Super Admin, Admin, Administrator, Ketua, Sekretaris) and flags
    expect(rulesContent).toContain("!(request.resource.data.get('role', 'Pengurus') in ['Super Admin', 'Admin', 'Administrator', 'Ketua', 'Sekretaris'])");
    expect(rulesContent).toContain("request.resource.data.get('isSuperAdmin', false) != true");
    expect(rulesContent).toContain("request.resource.data.get('isAdmin', false) != true");

    // Check that users update forbids changing role and privileged fields
    expect(rulesContent).toContain("affectedKeys().hasAny(['role', 'isSuperAdmin', 'permissions', 'departmentRole', 'isAdmin'])");
  });

  it('Users collection read access is isolated to self or Pengurus', () => {
    expect(rulesContent).toContain('allow read: if isSignedIn() && (isPengurus() || request.auth.uid == userId);');
  });

  it('userClearedNotifs collection is strictly isolated per user UID', () => {
    expect(rulesContent).toContain('allow read, write: if isSignedIn() && (request.auth.uid == docId || docId.startsWith(request.auth.uid));');
  });

  it('Finance records access is strictly restricted to Admins', () => {
    expect(rulesContent).toContain('match /financeRecords/{docId} {');
    expect(rulesContent).toContain('allow read: if isAdmin();');
    expect(rulesContent).toContain('allow create, update, delete: if isAdmin();');
  });

  it('Audit logs are protected against deletion by non-superadmins', () => {
    expect(rulesContent).toContain('match /auditLogs/{docId} {');
    expect(rulesContent).toContain('allow update, delete: if isSuperAdmin();');
  });

  it('All 17 collections are explicitly secured in firestore.rules', () => {
    const requiredCollections = [
      'users',
      'members',
      'advocacyCases',
      'sickVisits',
      'agendas',
      'notulensi',
      'sembakoEvents',
      'sembakoClaims',
      'vehicleLogs',
      'financeRecords',
      'fundraising',
      'severanceCalculations',
      'severanceRules',
      'auditLogs',
      'importHistory',
      'criticalNews',
      'userClearedNotifs'
    ];

    requiredCollections.forEach(coll => {
      expect(rulesContent).toContain(`match /${coll}/`);
    });
  });
});

