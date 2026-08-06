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
import { 
  INITIAL_USERS, 
  INITIAL_MEMBERS, 
  INITIAL_ADVOCACY, 
  INITIAL_SICK_VISITS, 
  INITIAL_AGENDAS, 
  INITIAL_SEMBAKO_EVENTS, 
  INITIAL_SEMBAKO_CLAIMS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_VEHICLE_LOGS,
  INITIAL_FINANCE_RECORDS
} from '../data/initialData';
import fsbnLogo from '../assets/images/fsbn_logo_emblem_1785338169849.jpg';
import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';

const STORAGE_KEYS = {
  USERS: 'sbn_vci_users_v3',
  CURRENT_USER: 'sbn_vci_current_user_v3',
  MEMBERS: 'sbn_vci_members_v2',
  ADVOCACY: 'sbn_vci_advocacy_v2',
  SICK_VISITS: 'sbn_vci_sick_visits_v2',
  AGENDAS: 'sbn_vci_agendas_v2',
  SEMBAKO_EVENTS: 'sbn_vci_sembako_events_v2',
  SEMBAKO_CLAIMS: 'sbn_vci_sembako_claims_v2',
  AUDIT_LOGS: 'sbn_vci_audit_logs_v2',
  VEHICLES: 'sbn_vci_vehicles_v1',
  FINANCE: 'sbn_vci_finance_records_v1',
  FUNDRAISING: 'sbn_vci_fundraising_v1',
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

// Helper to sanitize oversized base64 images (>350KB) to prevent QuotaExceededError and Firestore 1MB document limit
const sanitizeAvatarUrl = (url?: string): string => {
  if (!url || url === '/che_avatar.jpg') return cheAvatar;
  // If base64 string is absurdly long (>450,000 chars ~ 350KB), replace with cheAvatar to avoid quota/doc size limit explosion
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

export const getStoredUsers = (): UserAccount[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  let userList: UserAccount[] = [];
  if (!data) {
    userList = INITIAL_USERS;
  } else {
    try { userList = JSON.parse(data); } catch { userList = INITIAL_USERS; }
  }

  // Ensure all users have sanitized avatars
  userList = userList.map(u => ({
    ...u,
    avatarUrl: sanitizeAvatarUrl(u.avatarUrl)
  }));

  // Ensure Super Admin exists
  const hasSuperAdmin = userList.some(u => u.isSuperAdmin || u.username === 'sbnkasbivci1' || u.role === 'Super Admin');
  if (!hasSuperAdmin) {
    userList = [{ ...INITIAL_USERS[0], avatarUrl: cheAvatar }, ...userList];
  }

  safeSetItem(STORAGE_KEYS.USERS, JSON.stringify(userList));
  return userList;
};

export const setStoredUsers = (users: UserAccount[]) => {
  const sanitized = users.map(u => ({
    ...u,
    avatarUrl: sanitizeAvatarUrl(u.avatarUrl)
  }));
  safeSetItem(STORAGE_KEYS.USERS, JSON.stringify(sanitized));
};

export const getCurrentUser = (): UserAccount => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!data) {
    const storedUsers = getStoredUsers();
    const userToUse = storedUsers.length > 0 ? storedUsers[0] : DEFAULT_ACTIVE_USER;
    const finalUser = { ...userToUse, avatarUrl: sanitizeAvatarUrl(userToUse.avatarUrl) };
    safeSetItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(finalUser));
    return finalUser;
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

export const getStoredMembers = (): Member[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
  if (!data) {
    safeSetItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
    return INITIAL_MEMBERS;
  }
  try { 
    const parsed: Member[] = JSON.parse(data);
    return parsed.map(m => ({
      ...m,
      fotoUrl: (m.fotoUrl && m.fotoUrl.length > 450000) ? cheAvatar : (m.fotoUrl || cheAvatar)
    }));
  } catch { 
    return INITIAL_MEMBERS; 
  }
};

export const setStoredMembers = (members: Member[]) => {
  const sanitized = members.map(m => ({
    ...m,
    fotoUrl: (m.fotoUrl && m.fotoUrl.length > 450000) ? cheAvatar : m.fotoUrl
  }));
  safeSetItem(STORAGE_KEYS.MEMBERS, JSON.stringify(sanitized));
};

export const getStoredAdvocacy = (): AdvocacyCase[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ADVOCACY);
  if (!data) {
    safeSetItem(STORAGE_KEYS.ADVOCACY, JSON.stringify(INITIAL_ADVOCACY));
    return INITIAL_ADVOCACY;
  }
  try { return JSON.parse(data); } catch { return INITIAL_ADVOCACY; }
};

export const setStoredAdvocacy = (advocacy: AdvocacyCase[]) => {
  safeSetItem(STORAGE_KEYS.ADVOCACY, JSON.stringify(advocacy));
};

export const getStoredSickVisits = (): SickVisit[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SICK_VISITS);
  if (!data) {
    safeSetItem(STORAGE_KEYS.SICK_VISITS, JSON.stringify(INITIAL_SICK_VISITS));
    return INITIAL_SICK_VISITS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_SICK_VISITS; }
};

export const setStoredSickVisits = (visits: SickVisit[]) => {
  safeSetItem(STORAGE_KEYS.SICK_VISITS, JSON.stringify(visits));
};

export const getStoredAgendas = (): OrganizationAgenda[] => {
  const data = localStorage.getItem(STORAGE_KEYS.AGENDAS);
  if (!data) {
    safeSetItem(STORAGE_KEYS.AGENDAS, JSON.stringify(INITIAL_AGENDAS));
    return INITIAL_AGENDAS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_AGENDAS; }
};

export const setStoredAgendas = (agendas: OrganizationAgenda[]) => {
  safeSetItem(STORAGE_KEYS.AGENDAS, JSON.stringify(agendas));
};

export const getStoredSembakoEvents = (): SembakoEvent[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SEMBAKO_EVENTS);
  if (!data) {
    safeSetItem(STORAGE_KEYS.SEMBAKO_EVENTS, JSON.stringify(INITIAL_SEMBAKO_EVENTS));
    return INITIAL_SEMBAKO_EVENTS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_SEMBAKO_EVENTS; }
};

export const setStoredSembakoEvents = (events: SembakoEvent[]) => {
  safeSetItem(STORAGE_KEYS.SEMBAKO_EVENTS, JSON.stringify(events));
};

export const getStoredSembakoClaims = (): SembakoClaim[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SEMBAKO_CLAIMS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.SEMBAKO_CLAIMS, JSON.stringify(INITIAL_SEMBAKO_CLAIMS));
    return INITIAL_SEMBAKO_CLAIMS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_SEMBAKO_CLAIMS; }
};

export const setStoredSembakoClaims = (claims: SembakoClaim[]) => {
  localStorage.setItem(STORAGE_KEYS.SEMBAKO_CLAIMS, JSON.stringify(claims));
};

export const getStoredAuditLogs = (): AuditLog[] => {
  const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    return INITIAL_AUDIT_LOGS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_AUDIT_LOGS; }
};

export const setStoredAuditLogs = (logs: AuditLog[]) => {
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
};

export const getStoredVehicles = (): VehicleLog[] => {
  const data = localStorage.getItem(STORAGE_KEYS.VEHICLES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLE_LOGS));
    return INITIAL_VEHICLE_LOGS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_VEHICLE_LOGS; }
};

export const setStoredVehicles = (vehicles: VehicleLog[]) => {
  localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
};

export const getStoredFinance = (): FinanceDailyRecord[] => {
  const data = localStorage.getItem(STORAGE_KEYS.FINANCE);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(INITIAL_FINANCE_RECORDS));
    return INITIAL_FINANCE_RECORDS;
  }
  try { return JSON.parse(data); } catch { return INITIAL_FINANCE_RECORDS; }
};

export const setStoredFinance = (records: FinanceDailyRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(records));
};

export const addAuditLog = (
  userNama: string, 
  userRole: any, 
  modul: AuditLog['modul'], 
  aksi: string, 
  detail: string
) => {
  const currentLogs = getStoredAuditLogs();
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

  const updated = [newLog, ...currentLogs];
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
  return updated;
};

export const getStoredFundraising = (): FundraisingCampaign[] => {
  const data = localStorage.getItem(STORAGE_KEYS.FUNDRAISING);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const setStoredFundraising = (campaigns: FundraisingCampaign[]) => {
  safeSetItem(STORAGE_KEYS.FUNDRAISING, JSON.stringify(campaigns));
};

export const formatRupiah = (amount: number): string => {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
};

export const resetAllData = () => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
  localStorage.setItem(STORAGE_KEYS.ADVOCACY, JSON.stringify(INITIAL_ADVOCACY));
  localStorage.setItem(STORAGE_KEYS.SICK_VISITS, JSON.stringify(INITIAL_SICK_VISITS));
  localStorage.setItem(STORAGE_KEYS.AGENDAS, JSON.stringify(INITIAL_AGENDAS));
  localStorage.setItem(STORAGE_KEYS.SEMBAKO_EVENTS, JSON.stringify(INITIAL_SEMBAKO_EVENTS));
  localStorage.setItem(STORAGE_KEYS.SEMBAKO_CLAIMS, JSON.stringify(INITIAL_SEMBAKO_CLAIMS));
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLE_LOGS));
  localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(INITIAL_FINANCE_RECORDS));
  localStorage.setItem(STORAGE_KEYS.FUNDRAISING, JSON.stringify([]));
};

export const exportFullBackup = () => {
  const data = {
    users: getStoredUsers(),
    members: getStoredMembers(),
    advocacy: getStoredAdvocacy(),
    sickVisits: getStoredSickVisits(),
    agendas: getStoredAgendas(),
    sembakoEvents: getStoredSembakoEvents(),
    sembakoClaims: getStoredSembakoClaims(),
    vehicles: getStoredVehicles(),
    financeRecords: getStoredFinance(),
    fundraising: getStoredFundraising(),
    auditLogs: getStoredAuditLogs(),
    exportedAt: new Date().toISOString()
  };
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `SBN_VCI_Backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
