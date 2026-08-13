import { useState, useEffect } from 'react';
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
} from '../types';
import { repositories } from '../repositories';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { sortAuditLogsNewestFirst } from '../lib/storage';
import { SeveranceCalculationResult, PkbRuleConfig } from '../types/severance';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';
import { syncManager, SyncState, GlobalSyncDetails } from '../lib/syncManager';

export const useAppData = () => {
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

  useEffect(() => {
    const unsubSync = syncManager.subscribe((details) => {
      setSyncDetails(details);
    });
    return () => unsubSync();
  }, []);

  const syncState: SyncState = syncDetails.syncState;
  const isSyncOffline = syncDetails.syncState === 'offline';

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      // Clean up any existing collection listeners when auth state changes
      unsubs.forEach(fn => {
        try { fn(); } catch (e) { /* ignore cleanup errors */ }
      });
      unsubs = [];

      if (!currentUser) {
        // User is logged out / unauthenticated - do not subscribe to protected collections
        return;
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

      unsubs.push(repositories.vehicles.subscribe([], (items) => {
        setVehicleLogs(items);
      }, handleErr));

      unsubs.push(repositories.finance.subscribe([], (items) => {
        setFinanceRecords(items);
      }, handleErr));

      unsubs.push(repositories.users.subscribe([], (items) => {
        const formatted = items.map(u => ({
          ...u,
          avatarUrl: u.avatarUrl || cheAvatar
        }));
        setUsers(formatted);
      }, handleErr));

      unsubs.push(repositories.severanceCalculations.subscribe([], (items) => {
        setSeveranceCalculations(items);
      }, handleErr));

      unsubs.push(repositories.severanceRules.subscribe([], (items) => {
        setPkbRules(items);
      }, handleErr));

      unsubs.push(auditLogRepository.subscribe([], (items) => {
        setAuditLogs(sortAuditLogsNewestFirst(items));
      }, handleErr));
    });

    return () => {
      unsubs.forEach(fn => {
        try { fn(); } catch (e) { /* ignore cleanup errors */ }
      });
      unsubscribeAuth();
    };
  }, []);

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
