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
    password: 'superadmin1',
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
    password: 'pengurus123',
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
    password: 'ketua123',
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
    password: 'sekretaris123',
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

// Catatan Keuangan & Kas Organisasi SBN VCI
export const INITIAL_FINANCE_RECORDS: FinanceDailyRecord[] = [
  {
    id: 'fin-2026-07-29',
    tanggal: '2026-07-29',
    saldoAwal: 15500000,
    uangCosMasuk: 3250000,
    keteranganCos: 'Penerimaan COS Bulanan Anggota Shift 1 & 2',
    pengeluaranItems: [
      {
        id: 'exp-1',
        waktu: '10:15',
        nominal: 450000,
        keterangan: 'Bensin & E-Toll Operasional Xpander Konsolidasi Cikupa',
        kategori: 'Operasional',
        penerimaNota: 'Seksi Transportasi',
        updatedBy: 'Pengurus SBN'
      },
      {
        id: 'exp-2',
        waktu: '14:30',
        nominal: 300000,
        keterangan: 'Konsumsi Rapat Pleno Pengurus Serikat',
        kategori: 'Konsumsi & Rapat',
        penerimaNota: 'Warung Bu Siti',
        updatedBy: 'Pengurus SBN'
      }
    ],
    catatanHarian: 'Sisa saldo diarsip ke kas utama',
    updatedBy: 'Pengurus SBN',
    updatedAt: '2026-07-29T17:00:00.000Z'
  },
  {
    id: 'fin-2026-07-30',
    tanggal: '2026-07-30',
    saldoAwal: 18000000,
    uangCosMasuk: 1500000,
    keteranganCos: 'COS Anggota Departemen Assembly Line 04-10',
    pengeluaranItems: [
      {
        id: 'exp-3',
        waktu: '11:00',
        nominal: 600000,
        keterangan: 'Atribut Banner Spanduk & Bendera Aksi KASBI',
        kategori: 'Atribut / Baju / Spanduk',
        penerimaNota: 'Percetakan Media Digital',
        updatedBy: 'Pengurus SBN'
      },
      {
        id: 'exp-4',
        waktu: '16:20',
        nominal: 500000,
        keterangan: 'Santunan Bantuan Rawat Inap Anggota Sakit (RS Qadr)',
        kategori: 'Bantuan Anggota',
        penerimaNota: 'Seksi Kesejahteraan',
        updatedBy: 'Pengurus SBN'
      }
    ],
    catatanHarian: 'Kunjungan anggota sakit selesai',
    updatedBy: 'Pengurus SBN',
    updatedAt: '2026-07-30T18:00:00.000Z'
  },
  {
    id: 'fin-2026-07-31',
    tanggal: '2026-07-31',
    saldoAwal: 18400000,
    uangCosMasuk: 2000000,
    keteranganCos: 'Penerimaan COS Anggota Departemen Bottom & Stockfit',
    pengeluaranItems: [
      {
        id: 'exp-5',
        waktu: '09:00',
        nominal: 250000,
        keterangan: 'Pembelian Kertas HVS & ATK Kesekretariatan',
        kategori: 'Operasional',
        penerimaNota: 'Toko Buku Fortuna',
        updatedBy: 'Pengurus SBN'
      }
    ],
    catatanHarian: 'Laporan kas harian terverifikasi',
    updatedBy: 'Pengurus SBN',
    updatedAt: '2026-07-31T09:00:00.000Z'
  }
];

