import { describe, it, expect, vi } from 'vitest';
import { searchMemberOnDemand } from '../components/SeveranceCalculator/EmployeeSearch';
import { Member } from '../types';

describe('Member Operations - PATCH 2B On-Demand Data Hard Gate', () => {
  const mockMembers: Member[] = [
    {
      id: 'mbr-001',
      nomorAnggota: 'SBN-0001',
      nik: '12345',
      namaLengkap: 'Budi Santoso',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Tangerang',
      tanggalLahir: '1990-01-01',
      alamat: 'Jl. Merdeka No. 1',
      nomorHp: '08123456789',
      email: 'budi@example.com',
      departemen: 'Cutting',
      bagian: 'Line 01',
      jabatanKerja: 'Operator',
      statusKeanggotaan: 'Aktif',
      tanggalBergabung: '2015-06-01',
      upahPokok: 5000000,
      tunjanganTetap: 500000
    },
    {
      id: 'mbr-002',
      nomorAnggota: 'SBN-0002',
      nik: '67890',
      namaLengkap: 'Siti Aminah',
      jenisKelamin: 'Perempuan',
      tempatLahir: 'Jakarta',
      tanggalLahir: '1992-05-15',
      alamat: 'Jl. Sudirman No. 5',
      nomorHp: '08987654321',
      email: 'siti@example.com',
      departemen: 'Sewing',
      bagian: 'Line 02',
      jabatanKerja: 'Leader',
      statusKeanggotaan: 'Aktif',
      tanggalBergabung: '2018-03-10',
      upahPokok: 6000000,
      tunjanganTetap: 600000
    }
  ];

  it('searches member by exact NIK', async () => {
    const result = await searchMemberOnDemand('12345', mockMembers);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('mbr-001');
    expect(result?.namaLengkap).toBe('Budi Santoso');
  });

  it('searches member by nomorAnggota', async () => {
    const result = await searchMemberOnDemand('sbn-0002', mockMembers);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('mbr-002');
    expect(result?.nik).toBe('67890');
  });

  it('searches member by partial name matching', async () => {
    const result = await searchMemberOnDemand('budi', mockMembers);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('mbr-001');
  });

  it('returns null when member is not found in database', async () => {
    const result = await searchMemberOnDemand('nonexistent', mockMembers);
    expect(result).toBeNull();
  });

  it('handles empty query gracefully', async () => {
    const result = await searchMemberOnDemand('   ', mockMembers);
    expect(result).toBeNull();
  });

  it('works with undefined fallback members without throwing error', async () => {
    const result = await searchMemberOnDemand('12345', undefined);
    // In test environment without active Firestore emulator, returns null gracefully
    expect(result === null || typeof result === 'object').toBe(true);
  });
});
