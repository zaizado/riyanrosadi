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
import {
  getStoredMembers,
  setStoredMembers,
  getStoredAdvocacy,
  setStoredAdvocacy,
  getStoredSickVisits,
  setStoredSickVisits,
  getStoredAgendas,
  setStoredAgendas,
  getStoredSembakoEvents,
  setStoredSembakoEvents,
  getStoredSembakoClaims,
  setStoredSembakoClaims,
  getStoredVehicles,
  setStoredVehicles,
  getStoredFinance,
  setStoredFinance,
  getStoredFundraising,
  setStoredFundraising,
  getStoredAuditLogs,
  sortAuditLogsNewestFirst,
  getStoredUsers,
  setStoredUsers,
  getStoredSeverance,
  setStoredSeverance,
} from '../lib/storage';
import { SeveranceCalculationResult } from '../types/severance';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';

export const useAppData = () => {
  const [members, setMembers] = useState<Member[]>(() => getStoredMembers());
  const [advocacyCases, setAdvocacyCases] = useState<AdvocacyCase[]>(() => getStoredAdvocacy());
  const [sickVisits, setSickVisits] = useState<SickVisit[]>(() => getStoredSickVisits());
  const [agendas, setAgendas] = useState<OrganizationAgenda[]>(() => getStoredAgendas());
  const [sembakoEvents, setSembakoEvents] = useState<SembakoEvent[]>(() => getStoredSembakoEvents());
  const [sembakoClaims, setSembakoClaims] = useState<SembakoClaim[]>(() => getStoredSembakoClaims());
  const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>(() => getStoredVehicles());
  const [financeRecords, setFinanceRecords] = useState<FinanceDailyRecord[]>(() => getStoredFinance());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStoredAuditLogs());
  const [fundraisingCampaigns, setFundraisingCampaigns] = useState<FundraisingCampaign[]>(() => getStoredFundraising());
  const [users, setUsers] = useState<UserAccount[]>(() => getStoredUsers());
  const [severanceCalculations, setSeveranceCalculations] = useState<SeveranceCalculationResult[]>(() => getStoredSeverance());

  useEffect(() => {
    const unsubMembers = repositories.members.subscribe(getStoredMembers(), (items) => {
      const formatted = items.map(m => ({
        ...m,
        fotoUrl: m.fotoUrl || cheAvatar
      }));
      setMembers(formatted);
      setStoredMembers(formatted);
    });

    const unsubAdvocacy = repositories.advocacy.subscribe(getStoredAdvocacy(), (items) => {
      setAdvocacyCases(items);
      setStoredAdvocacy(items);
    });

    const unsubSickVisits = repositories.sickVisits.subscribe(getStoredSickVisits(), (items) => {
      setSickVisits(items);
      setStoredSickVisits(items);
    });

    const unsubFundraising = repositories.fundraising.subscribe(getStoredFundraising(), (items) => {
      setFundraisingCampaigns(items);
      setStoredFundraising(items);
    });

    const unsubAgendas = repositories.agendas.subscribe(getStoredAgendas(), (items) => {
      setAgendas(items);
      setStoredAgendas(items);
    });

    const unsubSembakoEvents = repositories.sembakoEvents.subscribe(getStoredSembakoEvents(), (items) => {
      setSembakoEvents(items);
      setStoredSembakoEvents(items);
    });

    const unsubSembakoClaims = repositories.sembakoClaims.subscribe(getStoredSembakoClaims(), (items) => {
      setSembakoClaims(items);
      setStoredSembakoClaims(items);
    });

    const unsubVehicles = repositories.vehicles.subscribe(getStoredVehicles(), (items) => {
      setVehicleLogs(items);
      setStoredVehicles(items);
    });

    const unsubFinance = repositories.finance.subscribe(getStoredFinance(), (items) => {
      setFinanceRecords(items);
      setStoredFinance(items);
    });

    const unsubUsers = repositories.users.subscribe(getStoredUsers(), (items) => {
      const formatted = items.map(u => ({
        ...u,
        avatarUrl: u.avatarUrl || cheAvatar
      }));
      setUsers(formatted);
      setStoredUsers(formatted);
    });

    const unsubSeverance = repositories.severanceCalculations.subscribe(getStoredSeverance(), (items) => {
      setSeveranceCalculations(items);
      setStoredSeverance(items);
    });

    const unsubAudit = auditLogRepository.subscribe(getStoredAuditLogs(), (items) => {
      setAuditLogs(sortAuditLogsNewestFirst(items));
    });

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
    severanceCalculations, setSeveranceCalculations
  };
};
