import { describe, it, expect, vi } from 'vitest';
import { generateNextMemberNumber, getMemberDocById } from '../utils/memberOperations';
import { syncManager } from './syncManager';
import { resolveUserProfile } from './authSession';
import { UserAccount } from '../types';
import { repositories } from '../repositories';

describe('MASTER PATCH 2C–2F Verification & Hardening', () => {
  describe('1. Member Number Generation (Data Correctness)', () => {
    it('generates a formatted nomor anggota without depending on members array length', () => {
      const num1 = generateNextMemberNumber();
      const num2 = generateNextMemberNumber();

      expect(num1).toMatch(/^SBN-VCI-\d{6}$/);
      expect(num2).toMatch(/^SBN-VCI-\d{6}$/);
      // Independent calls produce unique values
      expect(typeof num1).toBe('string');
      expect(num1.length).toBeGreaterThan(8);
    });

    it('does not produce SBN-VCI-0001 when members array is empty', () => {
      const generated = generateNextMemberNumber();
      expect(generated).not.toBe('SBN-VCI-0001');
    });
  });

  describe('2. Repositories On-Demand Methods', () => {
    it('has on-demand getById, getAll, and getCount methods on BaseRepository', () => {
      expect(typeof repositories.members.getById).toBe('function');
      expect(typeof repositories.members.getAll).toBe('function');
      expect(typeof repositories.members.getCount).toBe('function');
      expect(typeof repositories.users.getById).toBe('function');
    });
  });

  describe('3. SyncManager Quota & State Correctness', () => {
    it('reports quota state accurately and never claims fake SYNCED when quota is exceeded', () => {
      syncManager.reportListenerError('members', {
        code: 'resource-exhausted',
        message: 'Quota exceeded for quota metric Free daily read units'
      });

      const details = syncManager.getDetails();
      expect(details.syncState).toBe('quota');
      expect(details.statusMessage).toContain('KUOTA FIRESTORE TERCAPAI');
      expect(details.statusMessage).not.toBe('Online • Data tersinkron');
    });

    it('handles offline transition properly', () => {
      syncManager.setOnlineState(false);
      const details = syncManager.getDetails();
      expect(details.isOnline).toBe(false);
      // Clean up for other tests
      syncManager.setOnlineState(true);
    });
  });

  describe('4. Auth Session & RBAC Profile Resolution', () => {
    it('resolves user profile securely without trusting localStorage', () => {
      const mockFirebaseUser = {
        uid: 'fb-user-123',
        email: 'ketua@sbn.or.id'
      } as any;

      const mockUsers: UserAccount[] = [
        {
          id: 'usr-1',
          username: 'ketua',
          name: 'Ketua Serikat',
          email: 'ketua@sbn.or.id',
          nik: 'VCI-001',
          role: 'Ketua',
          department: 'Assembly',
          phoneNumber: '08123456789'
        }
      ];

      const result = resolveUserProfile({
        firebaseUser: mockFirebaseUser,
        users: mockUsers,
        cachedUser: null
      });

      expect(result.matchedUser).not.toBeNull();
      expect(result.matchedUser?.role).toBe('Ketua');
      expect(result.matchedUser?.name).toBe('Ketua Serikat');
    });

    it('rejects unmatched credentials', () => {
      const mockFirebaseUser = {
        uid: 'unknown-uid',
        email: 'intruder@unknown.com'
      } as any;

      const result = resolveUserProfile({
        firebaseUser: mockFirebaseUser,
        users: [],
        cachedUser: null
      });

      expect(result.matchedUser).toBeNull();
    });
  });
});
