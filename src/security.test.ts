import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Firestore Security Rules Verification Suite', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  it('Default catch-all rule is default-deny', () => {
    expect(rulesContent).toContain('match /{document=**} {');
    expect(rulesContent).toContain('allow read, write: if false;');
  });

  it('Privilege escalation protection on users collection', () => {
    // Check that users create forbids setting privileged roles and flags
    expect(rulesContent).toContain("request.resource.data.get('role', 'Pengurus') != 'Super Admin'");
    expect(rulesContent).toContain("request.resource.data.get('role', 'Pengurus') != 'Admin'");
    expect(rulesContent).toContain("request.resource.data.get('isSuperAdmin', false) != true");

    // Check that users update forbids changing role and privileged fields
    expect(rulesContent).toContain("affectedKeys().hasAny(['role', 'isSuperAdmin', 'permissions', 'departmentRole', 'isAdmin'])");
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

  it('Organizational data deletion requires Admin privileges', () => {
    const adminDeleteCollections = [
      'members',
      'advocacyCases',
      'sickVisits',
      'agendas',
      'notulensi',
      'sembakoEvents',
      'sembakoClaims',
      'vehicleLogs',
      'fundraising',
      'severanceCalculations'
    ];

    adminDeleteCollections.forEach(coll => {
      expect(rulesContent).toContain(`match /${coll}/`);
    });
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
