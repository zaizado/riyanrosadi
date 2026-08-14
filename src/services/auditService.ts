import { AuditLog, UserRole, DeletedMemberAudit } from '../types';
import { auditLogRepository } from '../repositories/auditLogRepository';

export class AuditService {
  public static async createLog(
    userNama: string,
    userRole: UserRole,
    modul: AuditLog['modul'],
    aksi: string,
    detail: string,
    deletedMemberAudit?: DeletedMemberAudit
  ): Promise<AuditLog> {
    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    
    const uniqueSuffix = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.random().toString(36).substring(2, 11);

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${uniqueSuffix}`,
      timestamp: timestampStr,
      userNama,
      userRole,
      modul,
      aksi,
      detail,
      ...(deletedMemberAudit ? { deletedMemberAudit } : {})
    };

    try {
      await auditLogRepository.save(newLog);
      return newLog;
    } catch (err) {
      console.error('AuditService: Gagal menyimpan audit log ke Firestore:', err);
      throw err;
    }
  }
}

