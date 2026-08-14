import { BaseRepository } from './baseRepository';
import { orderBy, limit } from 'firebase/firestore';
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
  FundraisingCampaign,
  NotulensiFileItem
} from '../types';
import { SeveranceCalculationResult, PkbRuleConfig } from '../types/severance';

export class MemberRepository extends BaseRepository<Member> { constructor() { super('members'); } }
export class AdvocacyRepository extends BaseRepository<AdvocacyCase> { constructor() { super('advocacyCases'); } }
export class SickVisitRepository extends BaseRepository<SickVisit> { constructor() { super('sickVisits'); } }
export class AgendaRepository extends BaseRepository<OrganizationAgenda> { constructor() { super('agendas'); } }
export class NotulensiRepository extends BaseRepository<NotulensiFileItem> { constructor() { super('notulensi'); } }
export class SembakoEventRepository extends BaseRepository<SembakoEvent> { constructor() { super('sembakoEvents'); } }
export class SembakoClaimRepository extends BaseRepository<SembakoClaim> { constructor() { super('sembakoClaims'); } }
export class VehicleLogRepository extends BaseRepository<VehicleLog> { 
  constructor() { super('vehicleLogs'); }
  public subscribeRecent(
    initialItems: VehicleLog[],
    onUpdate: (items: VehicleLog[]) => void,
    onError?: (err: Error) => void,
    limitCount: number = 100
  ): () => void {
    return this.subscribe(initialItems, onUpdate, onError, [orderBy('tanggal', 'desc'), limit(limitCount)]);
  }
}
export class FinanceRepository extends BaseRepository<FinanceDailyRecord> { constructor() { super('financeRecords'); } }
export class UserRepository extends BaseRepository<UserAccount> { constructor() { super('users'); } }
export class FundraisingRepository extends BaseRepository<FundraisingCampaign> { constructor() { super('fundraising'); } }
export class SeveranceCalculationRepository extends BaseRepository<SeveranceCalculationResult> { 
  constructor() { super('severanceCalculations'); }
  public subscribeRecent(
    initialItems: SeveranceCalculationResult[],
    onUpdate: (items: SeveranceCalculationResult[]) => void,
    onError?: (err: Error) => void,
    limitCount: number = 50
  ): () => void {
    return this.subscribe(initialItems, onUpdate, onError, [orderBy('calculatedAt', 'desc'), limit(limitCount)]);
  }
}
export class SeveranceRuleRepository extends BaseRepository<PkbRuleConfig> { constructor() { super('severanceRules'); } }

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
  notulensi: new NotulensiRepository(),
  sembakoEvents: new SembakoEventRepository(),
  sembakoClaims: new SembakoClaimRepository(),
  vehicles: new VehicleLogRepository(),
  finance: new FinanceRepository(),
  users: new UserRepository(),
  fundraising: new FundraisingRepository(),
  severanceCalculations: new SeveranceCalculationRepository(),
  severanceRules: new SeveranceRuleRepository(),
  userClearedNotifs: new UserClearedNotifsRepository(),
};
