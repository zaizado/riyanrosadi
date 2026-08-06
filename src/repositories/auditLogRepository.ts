import { BaseRepository } from './baseRepository';
import { AuditLog } from '../types';

class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor() {
    super('auditLogs');
  }
}

export const auditLogRepository = new AuditLogRepository();
