import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, subscribeDocument, db } from '../lib/firebase';
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
  checkIsAdmin,
  isAuthorizedPengurus,
  isValidUserRole
} from '../types';
import { repositories } from '../repositories';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { sortAuditLogsNewestFirst, getCurrentUser, setCurrentUser } from '../lib/storage';
import { resolveUserProfile } from '../lib/authSession';
import { SeveranceCalculationResult, PkbRuleConfig } from '../types/severance';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';
import { syncManager, SyncState, GlobalSyncDetails } from '../lib/syncManager';

export const formatUserAccount = (u: any): UserAccount => {
  const raw = u as any;
  const emailLower = (raw.email || '').toLowerCase();
  const rawRole = raw.role || raw.jabatan;
  let normalizedRole: UserAccount['role'] = 'Pengurus';
  if (rawRole === 'Super Admin') normalizedRole = 'Super Admin';
  else if (rawRole === 'Administrator') normalizedRole = 'Administrator';
  else if (rawRole === 'Admin') normalizedRole = 'Admin';
  else if (rawRole === 'Ketua' || rawRole === 'Wakil Ketua') normalizedRole = 'Ketua';
  else if (rawRole === 'Sekretaris') normalizedRole = 'Sekretaris';
  else if (rawRole === 'Bendahara') normalizedRole = 'Bendahara';
  else if (rawRole === 'Anggota') normalizedRole = 'Anggota';
  else if (rawRole === 'Pengurus') normalizedRole = 'Pengurus';

  return {
    ...u,
    id: raw.id || raw.uid || '',
    name: raw.name || raw.nama || raw.displayName || raw.fullName || raw.username || 'Pengurus SBN',
    username: raw.username || raw.userName || (emailLower ? emailLower.split('@')[0] : 'user'),
    email: raw.email || '',
    nik: raw.nik || raw.noKtp || raw.nip || '-',
    role: normalizedRole,
    department: raw.department || raw.departemen || raw.divisi || 'PT Victory Chingluh Indonesia',
    phoneNumber: raw.phoneNumber || raw.phone || raw.nomorHp || raw.noHp || '-',
    avatarUrl: raw.avatarUrl || raw.fotoUrl || cheAvatar,
    isSuperAdmin: normalizedRole === 'Super Admin' || raw.isSuperAdmin === true || false,
    isAdmin: raw.isAdmin || normalizedRole === 'Super Admin' || normalizedRole === 'Ketua' || normalizedRole === 'Sekretaris' || normalizedRole === 'Administrator' || normalizedRole === 'Admin' || normalizedRole === 'Bendahara' || false,
    lastActive: raw.lastActive || undefined
  };
};

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

  // Effect 1: Auth & Self Profile
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (unsubProfile) {
        try { unsubProfile(); } catch (e) {}
        unsubProfile = null;
      }

      if (!fbUser) {
        setResolvedUser(null);
        setUsers([]);
        return;
      }

      // Synchronous optimistic resolution from cache
      const { matchedUser } = resolveUserProfile({
        firebaseUser: fbUser,
        users: [],
        cachedUser: getCurrentUser()
      });
      setResolvedUser(matchedUser || null);

      // Subscribe to real profile from Firestore
      const handleErr = (err: Error) => console.warn('Profile subscription warning:', err.message);
      unsubProfile = subscribeDocument<any>('users', fbUser.uid, (docData) => {
        const { matchedUser: updatedMatched } = resolveUserProfile({
          firebaseUser: fbUser,
          users: docData ? [formatUserAccount(docData)] : [],
          cachedUser: getCurrentUser()
        });

        if (updatedMatched) {
          setResolvedUser(updatedMatched);
          setCurrentUser(updatedMatched);
        } else {
          setResolvedUser(null);
        }
      }, handleErr);
    });

    return () => {
      if (unsubProfile) {
        try { unsubProfile(); } catch (e) {}
      }
      unsubscribeAuth();
    };
  }, []);

  // Effect 2: Business & Admin Collections
  useEffect(() => {
    let unsubs: (() => void)[] = [];
    const currentFbUser = auth.currentUser;

    if (!resolvedUser || !isValidUserRole(resolvedUser.role) || !isAuthorizedPengurus(resolvedUser, currentFbUser)) {
       return () => {}; // Do nothing, cleanup if previously subscribed
    }

    const handleErr = (err: Error) => {
      console.warn('Firestore subscription warning:', err.message);
    };

    // Note: members and sembakoClaims are intentionally NOT subscribed globally to save bandwidth and reads.
    // They are fetched on-demand by their respective modules.
    
    unsubs.push(repositories.advocacy.subscribe([], (items) => { setAdvocacyCases(items); }, handleErr));
    unsubs.push(repositories.sickVisits.subscribe([], (items) => { setSickVisits(items); }, handleErr));
    unsubs.push(repositories.fundraising.subscribe([], (items) => { setFundraisingCampaigns(items); }, handleErr));
    unsubs.push(repositories.agendas.subscribe([], (items) => { setAgendas(items); }, handleErr));
    unsubs.push(repositories.notulensi.subscribe([], (items) => { setNotulensiFiles(items); }, handleErr));
    unsubs.push(repositories.sembakoEvents.subscribe([], (items) => { setSembakoEvents(items); }, handleErr));
    // sembakoClaims removed
    unsubs.push(repositories.vehicles.subscribeRecent([], (items) => { setVehicleLogs(items); }, handleErr, 50));
    unsubs.push(repositories.severanceCalculations.subscribeRecent([], (items) => { setSeveranceCalculations(items); }, handleErr, 50));
    unsubs.push(repositories.severanceRules.subscribe([], (items) => { setPkbRules(items); }, handleErr));
    unsubs.push(auditLogRepository.subscribeRecent([], (items) => { setAuditLogs(sortAuditLogsNewestFirst(items)); }, handleErr, 15));

    // Admin-only subscriptions
    const effectiveUser = currentUserParam || resolvedUser;
    const isAuthorizedForFinance = checkIsAdmin(effectiveUser, currentFbUser);

    if (isAuthorizedForFinance) {
      unsubs.push(repositories.finance.subscribe([], (items) => { setFinanceRecords(items); }, handleErr));
      
      unsubs.push(repositories.users.subscribe([], (items) => {
        const formatted = items.map(u => formatUserAccount(u));
        setUsers(formatted);
      }, handleErr));
    } else {
      setFinanceRecords([]);
      // Just put self in users array so UI logic relying on users list doesn't break
      setUsers([resolvedUser]);
    }

    return () => {
      unsubs.forEach(fn => { try { fn(); } catch (e) {} });
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
