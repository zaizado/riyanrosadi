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
import { repositories } from '../repositories';
import { AuditService } from './auditService';
import { UserRole } from '../types';

export class AppService {
  static async addMember(item: Member) { await repositories.members.save(item); }
  static async updateMember(item: Member) { await repositories.members.save(item); }
  static async deleteMember(id: string) { await repositories.members.delete(id); }
  static async saveAllMembers(items: Member[]) { await repositories.members.saveAll(items); }

  static async addAdvocacy(item: AdvocacyCase) { await repositories.advocacy.save(item); }
  static async updateAdvocacy(item: AdvocacyCase) { await repositories.advocacy.save(item); }
  static async deleteAdvocacy(id: string) { await repositories.advocacy.delete(id); }

  static async addSickVisit(item: SickVisit) { await repositories.sickVisits.save(item); }
  static async updateSickVisit(item: SickVisit) { await repositories.sickVisits.save(item); }
  static async deleteSickVisit(id: string) { await repositories.sickVisits.delete(id); }

  static async addAgenda(item: OrganizationAgenda) { await repositories.agendas.save(item); }
  static async updateAgenda(item: OrganizationAgenda) { await repositories.agendas.save(item); }
  static async deleteAgenda(id: string) { await repositories.agendas.delete(id); }

  static async addFundraising(item: FundraisingCampaign) { await repositories.fundraising.save(item); }
  static async updateFundraising(item: FundraisingCampaign) { await repositories.fundraising.save(item); }
  static async deleteFundraising(id: string) { await repositories.fundraising.delete(id); }

  static async addSembakoEvent(item: SembakoEvent) { await repositories.sembakoEvents.save(item); }
  static async updateSembakoEvent(item: SembakoEvent) { await repositories.sembakoEvents.save(item); }
  static async deleteSembakoEvent(id: string) { await repositories.sembakoEvents.delete(id); }

  static async updateSembakoClaim(item: SembakoClaim) { await repositories.sembakoClaims.save(item); }
  static async saveAllSembakoClaims(items: SembakoClaim[]) { await repositories.sembakoClaims.saveAll(items); }

  static async addVehicleLog(item: VehicleLog) { await repositories.vehicles.save(item); }
  static async updateVehicleLog(item: VehicleLog) { await repositories.vehicles.save(item); }
  static async deleteVehicleLog(id: string) { await repositories.vehicles.delete(id); }

  static async addFinanceRecord(item: FinanceDailyRecord) { await repositories.finance.save(item); }
  static async deleteFinanceRecord(id: string) { await repositories.finance.delete(id); }

  static async addUser(item: UserAccount) { await repositories.users.save(item); }
  static async updateUser(item: UserAccount) { await repositories.users.save(item); }
  static async deleteUser(id: string) { await repositories.users.delete(id); }

  static async updateUserClearedNotifs(id: string, clearedIds: string[]) {
    await repositories.userClearedNotifs.save({
      id,
      clearedIds,
      updatedAt: new Date().toISOString()
    });
  }
}
