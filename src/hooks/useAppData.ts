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
} from '../types';
import { repositories } from '../repositories';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { sortAuditLogsNewestFirst } from '../lib/storage';
import { SeveranceCalculationResult } from '../types/severance';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';

export const useAppData = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [advocacyCases, setAdvocacyCases] = useState<AdvocacyCase[]>([]);
  const [sickVisits, setSickVisits] = useState<SickVisit[]>([]);
  const [agendas, setAgendas] = useState<OrganizationAgenda[]>([]);
  const [sembakoEvents, setSembakoEvents] = useState<SembakoEvent[]>([]);
  const [sembakoClaims, setSembakoClaims] = useState<SembakoClaim[]>([]);
  const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>([]);
  const [financeRecords, setFinanceRecords] = useState<FinanceDailyRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [fundraisingCampaigns, setFundraisingCampaigns] = useState<FundraisingCampaign[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [severanceCalculations, setSeveranceCalculations] = useState<SeveranceCalculationResult[]>([]);
  const [isSyncOffline, setIsSyncOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleErr = (err: Error) => {
      console.warn('Firestore subscription offline or error:', err.message);
      setIsSyncOffline(true);
    };

    const unsubMembers = repositories.members.subscribe([], (items) => {
      setIsSyncOffline(false);
      const formatted = items.map(m => ({
        ...m,
        fotoUrl: m.fotoUrl || cheAvatar
      }));
      setMembers(formatted);
    }, handleErr);

    const unsubAdvocacy = repositories.advocacy.subscribe([], (items) => {
      setIsSyncOffline(false);
      setAdvocacyCases(items);
    }, handleErr);

    const unsubSickVisits = repositories.sickVisits.subscribe([], (items) => {
      setIsSyncOffline(false);
      setSickVisits(items);
    }, handleErr);

    const unsubFundraising = repositories.fundraising.subscribe([], (items) => {
      setIsSyncOffline(false);
      setFundraisingCampaigns(items);
    }, handleErr);

    const unsubAgendas = repositories.agendas.subscribe([], (items) => {
      setIsSyncOffline(false);
      setAgendas(items);
    }, handleErr);

    const unsubSembakoEvents = repositories.sembakoEvents.subscribe([], (items) => {
      setIsSyncOffline(false);
      setSembakoEvents(items);
    }, handleErr);

    const unsubSembakoClaims = repositories.sembakoClaims.subscribe([], (items) => {
      setIsSyncOffline(false);
      setSembakoClaims(items);
    }, handleErr);

    const unsubVehicles = repositories.vehicles.subscribe([], (items) => {
      setIsSyncOffline(false);
      setVehicleLogs(items);
    }, handleErr);

    const unsubFinance = repositories.finance.subscribe([], (items) => {
      setIsSyncOffline(false);
      setFinanceRecords(items);
    }, handleErr);

    const unsubUsers = repositories.users.subscribe([], (items) => {
      setIsSyncOffline(false);
      const formatted = items.map(u => ({
        ...u,
        avatarUrl: u.avatarUrl || cheAvatar
      }));
      setUsers(formatted);
    }, handleErr);

    const unsubSeverance = repositories.severanceCalculations.subscribe([], (items) => {
      setIsSyncOffline(false);
      setSeveranceCalculations(items);
    }, handleErr);

    const unsubAudit = auditLogRepository.subscribe([], (items) => {
      setIsSyncOffline(false);
      setAuditLogs(sortAuditLogsNewestFirst(items));
    }, handleErr);

    return () => {
      unsubMembers();
      unsubAdvocacy();
      unsubSickVisits();
      unsubFundraising();
      unsubAgendas();
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
    sembakoEvents, setSembakoEvents,
    sembakoClaims, setSembakoClaims,
    vehicleLogs, setVehicleLogs,
    financeRecords, setFinanceRecords,
    auditLogs, setAuditLogs,
    fundraisingCampaigns, setFundraisingCampaigns,
    users, setUsers,
    severanceCalculations, setSeveranceCalculations,
    isSyncOffline
  };
};
