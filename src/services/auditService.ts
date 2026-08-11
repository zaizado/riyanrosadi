import { AuditLog, UserRole } from '../types';
import { auditLogRepository } from '../repositories/auditLogRepository';

export class AuditService {
  public static async createLog(
    userNama: string,
    userRole: UserRole,
    modul: AuditLog['modul'],
    aksi: string,
    detail: string
  ): Promise<void> {
    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      timestamp: timestampStr,
      userNama,
      userRole,
      modul,
      aksi,
      detail
    };

    try {
      await auditLogRepository.save(newLog);
    } catch (e) {
      console.warn('Failed to save audit log to firestore', e);
    }
  }
}
