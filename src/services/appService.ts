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
import { repositories } from '../repositories';
import { db, deleteFileFromStorage } from '../lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';
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

  static async addNotulensiFile(item: NotulensiFileItem) { await repositories.notulensi.save(item); }
  static async deleteNotulensiFile(fileItem: NotulensiFileItem) {
    if (fileItem.storagePath) {
      await deleteFileFromStorage(fileItem.storagePath);
    }
    await repositories.notulensi.delete(fileItem.id);
  }

  static async addFundraising(item: FundraisingCampaign) { await repositories.fundraising.save(item); }
  static async updateFundraising(item: FundraisingCampaign) { await repositories.fundraising.save(item); }
  static async deleteFundraising(id: string) { await repositories.fundraising.delete(id); }

  static async addSembakoEvent(item: SembakoEvent) { await repositories.sembakoEvents.save(item); }
  static async updateSembakoEvent(item: SembakoEvent) { await repositories.sembakoEvents.save(item); }
  static async deleteSembakoEvent(id: string) { await repositories.sembakoEvents.delete(id); }

  static async updateSembakoClaim(item: SembakoClaim) { await repositories.sembakoClaims.save(item); }
  static async saveAllSembakoClaims(items: SembakoClaim[]) { await repositories.sembakoClaims.saveAll(items); }

  static async claimSembakoTransactional(claimId: string, petugasNama: string): Promise<SembakoClaim> {
    const claimDocRef = doc(db, 'sembakoClaims', claimId);
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(claimDocRef);
      if (!snap.exists()) {
        throw new Error('Data klaim sembako tidak ditemukan di database.');
      }
      const existingData = snap.data() as SembakoClaim;
      if (existingData.status === 'Sudah Ambil') {
        throw new Error(`PERINGATAN: Sembako sudah pernah diambil sebelumnya pada ${existingData.waktuPengambilan || '-'} oleh Petugas: ${existingData.petugasScan || '-'}`);
      }
      const now = new Date();
      const formattedTimestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      const updated: SembakoClaim = {
        ...existingData,
        status: 'Sudah Ambil',
        waktuPengambilan: formattedTimestamp,
        petugasScan: petugasNama,
        updatedAt: new Date().toISOString()
      };
      transaction.set(claimDocRef, updated, { merge: true });
      return updated;
    });
  }

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
