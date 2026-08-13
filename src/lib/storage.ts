import { 
  UserAccount, 
  Member, 
  AdvocacyCase, 
  SickVisit, 
  OrganizationAgenda, 
  SembakoEvent, 
  SembakoClaim, 
  AuditLog,
  VehicleLog,
  FinanceDailyRecord,
  FundraisingCampaign
} from '../types';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';
import { downloadBlob } from '../utils/exportAndPrintUtils';
import { getLocalDateISO } from '../utils/dateUtils';

const STORAGE_KEYS = {
  CURRENT_USER: 'sbn_vci_current_user_v3',
};

const DEFAULT_ACTIVE_USER: UserAccount = {
  id: 'usr-default',
  username: 'pengurus1',
  name: 'Pengurus SBN',
  email: 'pengurus@sbn-kasbi-vci.or.id',
  nik: 'VCI-00001',
  role: 'Pengurus',
  department: 'Sekretariat Utama',
  phoneNumber: '-',
  avatarUrl: cheAvatar
};

// Helper to sanitize oversized base64 images (>350KB)
const sanitizeAvatarUrl = (url?: string): string => {
  if (!url || url === '/che_avatar.jpg') return cheAvatar;
  if (url.length > 450000) {
    return cheAvatar;
  }
  return url;
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`LocalStorage setItem quota warning for key ${key}:`, err);
  }
};

export const getCurrentUser = (): UserAccount => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!data) {
    return DEFAULT_ACTIVE_USER;
  }
  try { 
    const parsed = JSON.parse(data);
    const userToUse = parsed || DEFAULT_ACTIVE_USER;
    return { ...userToUse, avatarUrl: sanitizeAvatarUrl(userToUse.avatarUrl) };
  } catch { 
    return { ...DEFAULT_ACTIVE_USER, avatarUrl: cheAvatar }; 
  }
};

export const setCurrentUser = (user: UserAccount) => {
  const updatedUser = { ...user, avatarUrl: sanitizeAvatarUrl(user.avatarUrl) };
  safeSetItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
};

export const sortAuditLogsNewestFirst = (logs: AuditLog[]): AuditLog[] => {
  if (!Array.isArray(logs)) return [];
  return [...logs].sort((a, b) => {
    // 1. Extract millis timestamp from ID if format is log-<millis>-<rand>
    const millisA = a.id?.startsWith('log-') ? parseInt(a.id.split('-')[1], 10) : NaN;
    const millisB = b.id?.startsWith('log-') ? parseInt(b.id.split('-')[1], 10) : NaN;

    if (!isNaN(millisA) && !isNaN(millisB) && millisA !== millisB) {
      return millisB - millisA; // Newest first
    }

    // 2. Parse timestamp date string
    const dateA = a.timestamp ? new Date(a.timestamp.replace(/-/g, '/')).getTime() : 0;
    const dateB = b.timestamp ? new Date(b.timestamp.replace(/-/g, '/')).getTime() : 0;

    if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB && dateA > 0 && dateB > 0) {
      return dateB - dateA; // Newest first
    }

    // 3. String lexicographical comparison fallback (YYYY-MM-DD HH:mm:ss)
    const strA = a.timestamp || '';
    const strB = b.timestamp || '';
    return strB.localeCompare(strA);
  });
};

export const formatRupiah = (amount: number): string => {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
};

export const resetAllData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } catch (err) {
    console.warn('Could not clear local session keys:', err);
  }
};

export interface ExportBackupData {
  users?: UserAccount[];
  members?: Member[];
  advocacy?: AdvocacyCase[];
  sickVisits?: SickVisit[];
  agendas?: OrganizationAgenda[];
  sembakoEvents?: SembakoEvent[];
  sembakoClaims?: SembakoClaim[];
  vehicles?: VehicleLog[];
  financeRecords?: FinanceDailyRecord[];
  fundraising?: FundraisingCampaign[];
  auditLogs?: AuditLog[];
}

export const exportFullBackup = (data?: ExportBackupData) => {
  const backupData = {
    users: data?.users || [],
    members: data?.members || [],
    advocacy: data?.advocacy || [],
    sickVisits: data?.sickVisits || [],
    agendas: data?.agendas || [],
    sembakoEvents: data?.sembakoEvents || [],
    sembakoClaims: data?.sembakoClaims || [],
    vehicles: data?.vehicles || [],
    financeRecords: data?.financeRecords || [],
    fundraising: data?.fundraising || [],
    auditLogs: data?.auditLogs ? sortAuditLogsNewestFirst(data.auditLogs) : [],
    exportedAt: new Date().toISOString()
  };
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  downloadBlob(blob, `SBN_VCI_Backup_${getLocalDateISO()}.json`);
};
