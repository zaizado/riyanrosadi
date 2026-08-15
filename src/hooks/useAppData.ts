import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  Member,
  AdvocacyCase,
  SickVisit,
  OrganizationAgenda,
  SembakoEvent,
  SembakoClaim,
  VehicleLog,
  FinanceDailyRecord,
  UserAccount,
  AuditLog,
  FundraisingCampaign,
  NotulensiFileItem,
  checkIsAdmin
} from '../types';
import { repositories } from '../repositories';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { sortAuditLogsNewestFirst, getCurrentUser, setCurrentUser } from '../lib/storage';
import { resolveUserProfile } from '../lib/authSession';
import { SeveranceCalculationResult, PkbRuleConfig } from '../types/severance';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';
import { syncManager, SyncState, GlobalSyncDetails } from '../lib/syncManager';

export const useAppData = (currentUserParam?: UserAccount | null) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [advocacyCases, setAdvocacyCases] = useState<AdvocacyCase[]>([]);
  const [sickVisits, setSickVisits] = useState<SickVisit[]>([]);
  const [agendas, setAgendas] = useState<OrganizationAgenda[]>([]);
  const [notulensiFiles, setNotulensiFiles] = useState<NotulensiFileItem[]>([]);
  const [sembakoEvents, setSembakoEvents] = useState<SembakoEvent[]>([]);
  const [sembakoClaims, setSembakoClaims] = useState<SembakoClaim[]>([]);
  const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>([]);
  const [financeRecords, setFinanceRecords] = useState<FinanceDailyRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [fundraisingCampaigns, setFundraisingCampaigns] = useState<FundraisingCampaign[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [severanceCalculations, setSeveranceCalculations] = useState<SeveranceCalculationResult[]>([]);
  const [pkbRules, setPkbRules] = useState<PkbRuleConfig[]>([]);
  
  const [syncDetails, setSyncDetails] = useState<GlobalSyncDetails>(() => syncManager.getDetails());

  const usersRef = useRef<UserAccount[]>([]);
  usersRef.current = users;

  useEffect(() => {
    const unsubSync = syncManager.subscribe((details) => {
      setSyncDetails(details);
    });
    return () => unsubSync();
  }, []);

  const syncState: SyncState = syncDetails.syncState;
  const isSyncOffline = syncDetails.syncState === 'offline';

  // Resolved user for collection access evaluation
  const [resolvedUser, setResolvedUser] = useState<UserAccount | null>(() => currentUserParam || getCurrentUser());

  useEffect(() => {
    if (currentUserParam) {
      setResolvedUser(currentUserParam);
    }
  }, [currentUserParam]);

  // Main listener for general collections (available to all signed-in pengurus)
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      // Clean up any existing collection listeners when auth state changes
      unsubs.forEach(fn => {
        try { fn(); } catch (e) { /* ignore cleanup errors */ }
      });
      unsubs = [];

      if (!fbUser) {
        // User is logged out / unauthenticated - do not subscribe to protected collections
        setResolvedUser(null);
        return;
      }

      // Resolve user profile for permissions
      const { matchedUser } = resolveUserProfile({
        firebaseUser: fbUser,
        users: usersRef.current,
        cachedUser: getCurrentUser()
      });
      if (matchedUser) {
        setResolvedUser(matchedUser);
      }

      const handleErr = (err: Error) => {
        console.warn('Firestore subscription warning:', err.message);
      };

      unsubs.push(repositories.members.subscribe([], (items) => {
        const formatted = items.map(m => ({
          ...m,
          fotoUrl: m.fotoUrl || cheAvatar
        }));
        setMembers(formatted);
      }, handleErr));

      unsubs.push(repositories.advocacy.subscribe([], (items) => {
        setAdvocacyCases(items);
      }, handleErr));

      unsubs.push(repositories.sickVisits.subscribe([], (items) => {
        setSickVisits(items);
      }, handleErr));

      unsubs.push(repositories.fundraising.subscribe([], (items) => {
        setFundraisingCampaigns(items);
      }, handleErr));

      unsubs.push(repositories.agendas.subscribe([], (items) => {
        setAgendas(items);
      }, handleErr));

      unsubs.push(repositories.notulensi.subscribe([], (items) => {
        setNotulensiFiles(items);
      }, handleErr));

      unsubs.push(repositories.sembakoEvents.subscribe([], (items) => {
        setSembakoEvents(items);
      }, handleErr));

      unsubs.push(repositories.sembakoClaims.subscribe([], (items) => {
        setSembakoClaims(items);
      }, handleErr));

      unsubs.push(repositories.vehicles.subscribeRecent([], (items) => {
        setVehicleLogs(items);
      }, handleErr, 100));

      unsubs.push(repositories.users.subscribe([], (items) => {
        const formatted: UserAccount[] = items.map(u => {
          const raw = u as any;
          const emailLower = (raw.email || '').toLowerCase();
          return {
            ...u,
            id: raw.id || raw.uid || '',
            name: raw.name || raw.nama || raw.displayName || raw.fullName || raw.username || 'Pengurus SBN',
            username: raw.username || raw.userName || (emailLower ? emailLower.split('@')[0] : 'user'),
            email: raw.email || '',
            nik: raw.nik || raw.noKtp || raw.nip || '-',
            role: raw.role || raw.jabatan || 'Pengurus',
            department: raw.department || raw.departemen || raw.divisi || 'PT Victory Chingluh Indonesia',
            phoneNumber: raw.phoneNumber || raw.phone || raw.nomorHp || raw.noHp || '-',
            avatarUrl: raw.avatarUrl || raw.fotoUrl || cheAvatar,
            isSuperAdmin: raw.role === 'Super Admin' || raw.isSuperAdmin === true || false,
            isAdmin: raw.isAdmin || false,
            lastActive: raw.lastActive || undefined
          };
        });
        setUsers(formatted);

        const currentFbUser = auth.currentUser;
        if (currentFbUser) {
          const { matchedUser: updatedMatched } = resolveUserProfile({
            firebaseUser: currentFbUser,
            users: formatted,
            cachedUser: getCurrentUser()
          });
          if (updatedMatched) {
            setResolvedUser(updatedMatched);
            setCurrentUser(updatedMatched);
          }
        }
      }, handleErr));

      unsubs.push(repositories.severanceCalculations.subscribeRecent([], (items) => {
        setSeveranceCalculations(items);
      }, handleErr, 50));

      unsubs.push(repositories.severanceRules.subscribe([], (items) => {
        setPkbRules(items);
      }, handleErr));

      unsubs.push(auditLogRepository.subscribeRecent([], (items) => {
        setAuditLogs(sortAuditLogsNewestFirst(items));
      }, handleErr, 100));
    });

    return () => {
      unsubs.forEach(fn => {
        try { fn(); } catch (e) { /* ignore cleanup errors */ }
      });
      unsubscribeAuth();
    };
  }, []);

  // Dedicated conditional subscription for financeRecords (ONLY for Admin / Bendahara / Super Admin)
  useEffect(() => {
    let unsubFinance: (() => void) | null = null;
    const currentFbUser = auth.currentUser;
    const effectiveUser = currentUserParam || resolvedUser || getCurrentUser();

    // Strict role check matching firestore.rules: isAdmin()
    const isAuthorizedForFinance = checkIsAdmin(effectiveUser, currentFbUser);

    if (currentFbUser && isAuthorizedForFinance) {
      const handleErr = (err: Error) => {
        console.warn('Firestore finance subscription warning:', err.message);
      };

      unsubFinance = repositories.finance.subscribe([], (items) => {
        setFinanceRecords(items);
      }, handleErr);
    } else {
      // Clear finance records if user is not authorized or logged out
      setFinanceRecords([]);
    }

    return () => {
      if (unsubFinance) {
        try { unsubFinance(); } catch (e) { /* ignore cleanup errors */ }
      }
    };
  }, [
    currentUserParam?.id,
    currentUserParam?.role,
    currentUserParam?.isSuperAdmin,
    currentUserParam?.isAdmin,
    resolvedUser?.id,
    resolvedUser?.role,
    resolvedUser?.isSuperAdmin,
    resolvedUser?.isAdmin
  ]);

  return {
    members, setMembers,
    advocacyCases, setAdvocacyCases,
    sickVisits, setSickVisits,
    agendas, setAgendas,
    notulensiFiles, setNotulensiFiles,
    sembakoEvents, setSembakoEvents,
    sembakoClaims, setSembakoClaims,
    vehicleLogs, setVehicleLogs,
    financeRecords, setFinanceRecords,
    auditLogs, setAuditLogs,
    fundraisingCampaigns, setFundraisingCampaigns,
    users, setUsers,
    severanceCalculations, setSeveranceCalculations,
    pkbRules, setPkbRules,
    isSyncOffline,
    syncState,
    syncDetails
  };
};
