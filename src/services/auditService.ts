import { AuditLog, UserRole, DeletedMemberAudit } from '../types';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { auth } from '../lib/firebase';
import { 
  generateNotificationId, 
  extractEntityId, 
  NotificationTracker,
  sanitizeNotificationKeyPart 
} from '../lib/notificationIdempotency';

export class AuditService {
  public static async createLog(
    userNama: string,
    userRole: UserRole,
    modul: AuditLog['modul'],
    aksi: string,
    detail: string,
    deletedMemberAudit?: DeletedMemberAudit,
    entityId?: string,
    idempotencyKey?: string
  ): Promise<AuditLog> {
    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    
    const currentUid = auth.currentUser?.uid || '';
    
    // Determine deterministic notification/audit ID
    const determinedId = idempotencyKey 
      ? sanitizeNotificationKeyPart(idempotencyKey)
      : generateNotificationId({
          modul,
          entityId: entityId || extractEntityId(detail, modul),
          action: aksi,
          userId: currentUid
        });

    // Short-circuit if identical event was already processed in the current cycle
    if (NotificationTracker.hasRecentlyProcessed(determinedId)) {
      const existing = NotificationTracker.getExisting(determinedId);
      if (existing) return existing;
    }

    const newLog: AuditLog = {
      id: determinedId,
      timestamp: timestampStr,
      userNama,
      userRole,
      userId: currentUid,
      actorUid: currentUid,
      modul,
      aksi,
      detail,
      ...(deletedMemberAudit ? { deletedMemberAudit } : {})
    };

    NotificationTracker.markProcessed(determinedId, newLog);

    try {
      await auditLogRepository.save(newLog);
      return newLog;
    } catch (err: any) {
      // If error is permission-denied / already exists due to Firestore immutability rule,
      // the deterministic document is already safely recorded in Firestore!
      const errMsg = err?.message || String(err);
      if (errMsg.includes('permission-denied') || errMsg.includes('already exists')) {
        console.warn(`Audit log ${determinedId} already recorded in Firestore (idempotent write merged)`);
        return newLog;
      }
      console.error('AuditService: Gagal menyimpan audit log ke Firestore:', err);
      throw err;
    }
  }
}


