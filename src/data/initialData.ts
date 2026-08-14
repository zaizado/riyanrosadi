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
  FinanceDailyRecord
} from '../types';
import { REAL_MEMBERS_DATA } from './realMembersData';

import cheAvatar from '../assets/images/pengurus_che_avatar_1785341733072.jpg';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-superadmin',
    username: 'sbnkasbivci1',
    name: 'Super Admin SBN KASBI',
    email: 'superadmin@sbn-kasbi-vci.or.id',
    nik: 'SA-00001',
    role: 'Super Admin',
    department: 'Dewan Pimpinan Utama',
    phoneNumber: '081234567890',
    avatarUrl: cheAvatar,
    isSuperAdmin: true
  },
  {
    id: 'usr-1',
    username: 'pengurus1',
    name: 'Awaludin',
    email: 'awaludin@sbn-kasbi-vci.or.id',
    nik: '010670',
    role: 'Ketua',
    department: 'PT Victory Chingluh Indonesia',
    phoneNumber: '081234567890',
    avatarUrl: cheAvatar
  },
  {
    id: 'usr-2',
    username: 'ketua1',
    name: 'Darja',
    email: 'darja@sbn-kasbi-vci.or.id',
    nik: '016373',
    role: 'Ketua',
    department: 'PT Victory Chingluh Indonesia',
    phoneNumber: '081298765432',
    avatarUrl: cheAvatar
  },
  {
    id: 'usr-3',
    username: 'sekretaris1',
    name: 'Heri Fadli',
    email: 'herifadli@sbn-kasbi-vci.or.id',
    nik: '021224',
    role: 'Sekretaris',
    department: 'PT Victory Chingluh Indonesia',
    phoneNumber: '081311223344',
    avatarUrl: cheAvatar
  }
];

// List anggota resmi dari Google Sheet (1.689 anggota)
export const INITIAL_MEMBERS: Member[] = REAL_MEMBERS_DATA.map(m => ({
  ...m,
  fotoUrl: m.fotoUrl || cheAvatar
}));

// Kasus Advokasi Demo Dihapus
export const INITIAL_ADVOCACY: AdvocacyCase[] = [];

// Anggota Sakit / Pendampingan Demo Dihapus
export const INITIAL_SICK_VISITS: SickVisit[] = [];

// Agenda Demo Dihapus
export const INITIAL_AGENDAS: OrganizationAgenda[] = [];

// Event & Klaim Paket Sembako Demo Dihapus
export const INITIAL_SEMBAKO_EVENTS: SembakoEvent[] = [];

export const INITIAL_SEMBAKO_CLAIMS: SembakoClaim[] = [];

// Log Audit Demo Dihapus
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

// Jurnal Kendaraan Operasional Demo/Default
export const INITIAL_VEHICLE_LOGS: VehicleLog[] = [];

// Catatan Keuangan & Kas Organisasi SBN VCI (Kosong untuk produksi - data dari Firestore)
export const INITIAL_FINANCE_RECORDS: FinanceDailyRecord[] = [];

