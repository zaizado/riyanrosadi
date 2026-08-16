import { AuditLog } from '../types';

export interface GenerateNotificationIdParams {
  modul: string;
  entityId?: string | null;
  action: string;
  userId?: string | null;
  actorUid?: string | null;
  customKey?: string | null;
}

/**
 * Sanitizes an ID component to contain only safe alphanumeric characters, hyphens, and underscores.
 */
export function sanitizeNotificationKeyPart(input: string): string {
  if (!input) return 'na';
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'na';
}

/**
 * Generates a deterministic, idempotent notification document ID.
 * Standard format: [eventType]_[entityId]_[action] or [eventType]_[entityId]_[action]_[userId]
 * Example:
 *  - task_TASK-123_confirmed
 *  - agenda_AGD-123_created
 *  - member_MBR-123_deleted
 */
export function generateNotificationId(params: GenerateNotificationIdParams): string {
  if (params.customKey && params.customKey.trim()) {
    return sanitizeNotificationKeyPart(params.customKey);
  }

  const cleanModul = sanitizeNotificationKeyPart(params.modul || 'sistem');
  const cleanEntity = sanitizeNotificationKeyPart(params.entityId || 'general');
  const cleanAction = sanitizeNotificationKeyPart(params.action || 'event');
  const userSuffix = params.userId ? `_${sanitizeNotificationKeyPart(params.userId)}` : '';

  // Return formatted deterministic idempotency key
  const finalKey = `${cleanModul}_${cleanEntity}_${cleanAction}${userSuffix}`;
  return finalKey.slice(0, 120);
}

/**
 * Extracts entity IDs from audit log detail strings when not explicitly provided.
 */
export function extractEntityId(detail: string, modul: string): string | null {
  if (!detail) return null;

  // Regex matchers for specific entity ID patterns
  // 1. Parenthesized IDs: (SBN-VCI-0012), (SAK-2026-001), (DANA-2026-001), (AGD-...), (VLOG-...), (TASK-...)
  const parenMatch = detail.match(/\(([A-Za-z0-9_\-\.]+)\)/);
  if (parenMatch && parenMatch[1] && !parenMatch[1].toLowerCase().includes('status')) {
    return parenMatch[1];
  }

  // 2. Explicit ID patterns in text: TASK-123, AGD-123, SAK-2026-001, etc.
  const prefixMatch = detail.match(/\b(TASK-[A-Za-z0-9_-]+|AGD-[A-Za-z0-9_-]+|SAK-[A-Za-z0-9_-]+|DANA-[A-Za-z0-9_-]+|VLOG-[A-Za-z0-9_-]+|SBN-[A-Za-z0-9_-]+|MBR-[A-Za-z0-9_-]+|SA-[A-Za-z0-9_-]+|usr-[A-Za-z0-9_-]+)\b/i);
  if (prefixMatch && prefixMatch[1]) {
    return prefixMatch[1];
  }

  // 3. Quoted names/titles: "Rapat Pleno" -> slug
  const quoteMatch = detail.match(/"([^"]+)"/);
  if (quoteMatch && quoteMatch[1]) {
    return sanitizeNotificationKeyPart(quoteMatch[1]);
  }

  // 4. Date patterns: YYYY-MM-DD
  const dateMatch = detail.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (dateMatch && dateMatch[1]) {
    return dateMatch[1];
  }

  return null;
}

/**
 * In-memory Tracker for fast client-side de-duplication of in-flight and recently processed actions.
 */
export class NotificationTracker {
  private static processedMap = new Map<string, { log: AuditLog; timestamp: number }>();
  private static TTL_MS = 5 * 60 * 1000; // 5 minutes retention

  public static hasRecentlyProcessed(id: string): boolean {
    const entry = this.processedMap.get(id);
    if (!entry) return false;
    if (Date.now() - entry.timestamp > this.TTL_MS) {
      this.processedMap.delete(id);
      return false;
    }
    return true;
  }

  public static markProcessed(id: string, log: AuditLog): void {
    this.cleanup();
    this.processedMap.set(id, { log, timestamp: Date.now() });
  }

  public static getExisting(id: string): AuditLog | null {
    const entry = this.processedMap.get(id);
    if (!entry) return null;
    return entry.log;
  }

  public static clear(): void {
    this.processedMap.clear();
  }

  private static cleanup(): void {
    if (this.processedMap.size < 1000) return;
    const now = Date.now();
    for (const [key, value] of this.processedMap.entries()) {
      if (now - value.timestamp > this.TTL_MS) {
        this.processedMap.delete(key);
      }
    }
  }
}

/**
 * Deduplicates notification lists safely preserving canonical items.
 * Keeps only 1 record per distinct event identity.
 */
export function deduplicateNotifications(logs: AuditLog[]): AuditLog[] {
  if (!logs || logs.length <= 1) return logs || [];

  const seenIds = new Set<string>();
  const seenCanonicalEvents = new Set<string>();
  const result: AuditLog[] = [];

  for (const log of logs) {
    // 1. Primary deduplication by document ID
    if (log.id) {
      if (seenIds.has(log.id)) {
        continue;
      }
      seenIds.add(log.id);
    }

    // 2. Secondary deduplication for legacy unmigrated logs that had random IDs for same event
    const extractedEntity = extractEntityId(log.detail, log.modul) || log.detail.slice(0, 40);
    const timeMinute = log.timestamp ? log.timestamp.slice(0, 16) : ''; // Group by same minute
    const canonicalKey = `${sanitizeNotificationKeyPart(log.modul)}_${sanitizeNotificationKeyPart(extractedEntity)}_${sanitizeNotificationKeyPart(log.aksi)}_${sanitizeNotificationKeyPart(log.userNama)}_${timeMinute}`;

    if (seenCanonicalEvents.has(canonicalKey)) {
      continue;
    }
    seenCanonicalEvents.add(canonicalKey);

    result.push(log);
  }

  return result;
}
