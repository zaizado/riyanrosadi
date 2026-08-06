import { BaseRepository } from './baseRepository';
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
  FundraisingCampaign 
} from '../types';

export class MemberRepository extends BaseRepository<Member> { constructor() { super('members'); } }
export class AdvocacyRepository extends BaseRepository<AdvocacyCase> { constructor() { super('advocacyCases'); } }
export class SickVisitRepository extends BaseRepository<SickVisit> { constructor() { super('sickVisits'); } }
export class AgendaRepository extends BaseRepository<OrganizationAgenda> { constructor() { super('agendas'); } }
export class SembakoEventRepository extends BaseRepository<SembakoEvent> { constructor() { super('sembakoEvents'); } }
export class SembakoClaimRepository extends BaseRepository<SembakoClaim> { constructor() { super('sembakoClaims'); } }
export class VehicleLogRepository extends BaseRepository<VehicleLog> { constructor() { super('vehicleLogs'); } }
export class FinanceRepository extends BaseRepository<FinanceDailyRecord> { constructor() { super('financeRecords'); } }
export class UserRepository extends BaseRepository<UserAccount> { constructor() { super('users'); } }
export class FundraisingRepository extends BaseRepository<FundraisingCampaign> { constructor() { super('fundraising'); } }

export interface UserClearedNotifs {
  id: string;
  clearedIds?: string[];
  updatedAt?: string;
}
export class UserClearedNotifsRepository extends BaseRepository<UserClearedNotifs> { constructor() { super('userClearedNotifs'); } }

export const repositories = {
  members: new MemberRepository(),
  advocacy: new AdvocacyRepository(),
  sickVisits: new SickVisitRepository(),
  agendas: new AgendaRepository(),
  sembakoEvents: new SembakoEventRepository(),
  sembakoClaims: new SembakoClaimRepository(),
  vehicles: new VehicleLogRepository(),
  finance: new FinanceRepository(),
  users: new UserRepository(),
  fundraising: new FundraisingRepository(),
  userClearedNotifs: new UserClearedNotifsRepository(),
};
