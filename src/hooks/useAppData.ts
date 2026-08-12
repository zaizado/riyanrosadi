import { useState, useEffect } from 'react';
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
import { SeveranceCalculationResult } from '../types/severance';
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
    const handleErr = (err: Error) => {
      console.warn('Firestore subscription warning:', err.message);
    };

    const unsubMembers = repositories.members.subscribe([], (items) => {
      const formatted = items.map(m => ({
        ...m,
        fotoUrl: m.fotoUrl || cheAvatar
      }));
      setMembers(formatted);
    }, handleErr);

    const unsubAdvocacy = repositories.advocacy.subscribe([], (items) => {
      setAdvocacyCases(items);
    }, handleErr);

    const unsubSickVisits = repositories.sickVisits.subscribe([], (items) => {
      setSickVisits(items);
    }, handleErr);

    const unsubFundraising = repositories.fundraising.subscribe([], (items) => {
      setFundraisingCampaigns(items);
    }, handleErr);

    const unsubAgendas = repositories.agendas.subscribe([], (items) => {
      setAgendas(items);
    }, handleErr);

    const unsubNotulensi = repositories.notulensi.subscribe([], (items) => {
      setNotulensiFiles(items);
    }, handleErr);

    const unsubSembakoEvents = repositories.sembakoEvents.subscribe([], (items) => {
      setSembakoEvents(items);
    }, handleErr);

    const unsubSembakoClaims = repositories.sembakoClaims.subscribe([], (items) => {
      setSembakoClaims(items);
    }, handleErr);

    const unsubVehicles = repositories.vehicles.subscribe([], (items) => {
      setVehicleLogs(items);
    }, handleErr);

    const unsubFinance = repositories.finance.subscribe([], (items) => {
      setFinanceRecords(items);
    }, handleErr);

    const unsubUsers = repositories.users.subscribe([], (items) => {
      const formatted = items.map(u => ({
        ...u,
        avatarUrl: u.avatarUrl || cheAvatar
      }));
      setUsers(formatted);
    }, handleErr);

    const unsubSeverance = repositories.severanceCalculations.subscribe([], (items) => {
      setSeveranceCalculations(items);
    }, handleErr);

    const unsubAudit = auditLogRepository.subscribe([], (items) => {
      setAuditLogs(sortAuditLogsNewestFirst(items));
    }, handleErr);

    return () => {
      unsubMembers();
      unsubAdvocacy();
      unsubSickVisits();
      unsubFundraising();
      unsubAgendas();
      unsubNotulensi();
      unsubSembakoEvents();
      unsubSembakoClaims();
      unsubVehicles();
      unsubFinance();
      unsubUsers();
      unsubSeverance();
      unsubAudit();
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
    isSyncOffline,
    syncState,
    syncDetails
  };
};
