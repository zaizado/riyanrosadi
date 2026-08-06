import { AuditLog, UserRole } from '../types';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { addAuditLog } from '../lib/storage';

export class AuditService {
  public static async createLog(
    userNama: string,
    userRole: UserRole,
    modul: AuditLog['modul'],
    aksi: string,
    detail: string
  ): Promise<void> {
    const logs = addAuditLog(userNama, userRole, modul, aksi, detail);
    try {
      await auditLogRepository.save(logs[0]);
    } catch (e) {
      console.warn('Failed to save audit log to firestore', e);
    }
  }
}
