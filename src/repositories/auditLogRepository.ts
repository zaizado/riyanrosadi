import { BaseRepository } from './baseRepository';
import { AuditLog } from '../types';
import { orderBy, limit } from 'firebase/firestore';

class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor() {
    super('auditLogs');
  }

  public subscribeRecent(
    initialItems: AuditLog[],
    onUpdate: (items: AuditLog[]) => void,
    onError?: (err: Error) => void,
    limitCount: number = 100
  ): () => void {
    return this.subscribe(
      initialItems,
      onUpdate,
      onError,
      [orderBy('timestamp', 'desc'), limit(limitCount)]
    );
  }
}

export const auditLogRepository = new AuditLogRepository();
