import { describe, it, expect } from 'vitest';
import { 
  getVehicleFleetStatus, 
  checkVehicleAvailability, 
  calculateDistanceKm, 
  getVehicleLogStatusBadge,
  getDefaultPreChecklist,
  getDefaultReturnChecklist
} from './vehicleUtils';
import { VehicleLog } from '../types';

describe('vehicleUtils unit tests', () => {
  const dummyLogs: VehicleLog[] = [
    {
      id: 'log-1',
      nomorLog: 'MOB-2026-001',
      kendaraan: 'Mitsubishi Xpander',
      memberId: 'm-1',
      namaPemakai: 'Budi Santoso',
      departemenPemakai: 'Cutting',
      tujuan: 'DPC KASBI Tangerang',
      tanggalMulai: '2026-08-15',
      jamMulai: '08:00',
      tanggalSelesai: '2026-08-15',
      jamSelesai: '12:00',
      status: 'Disetujui',
      updatedAt: '2026-08-14T10:00:00Z',
    },
    {
      id: 'log-2',
      nomorLog: 'MOB-2026-002',
      kendaraan: 'Daihatsu Xenia',
      memberId: 'm-2',
      namaPemakai: 'Ahmad Fauzi',
      departemenPemakai: 'Assembly',
      tujuan: 'RS Metro Hospital',
      tanggalMulai: '2026-08-14',
      jamMulai: '09:00',
      tanggalSelesai: '2026-08-14',
      jamSelesai: '15:00',
      status: 'Sedang Digunakan',
      kmAwal: 34100,
      updatedAt: '2026-08-14T09:00:00Z',
    },
  ];

  it('correctly detects active Sedang Digunakan vehicle status', () => {
    const status = getVehicleFleetStatus('Daihatsu Xenia', dummyLogs);
    expect(status.conditionStatus).toBe('Sedang Digunakan');
    expect(status.statusLabel).toContain('Sedang Digunakan');
    expect(status.statusColor).toBe('blue');
    expect(status.activeLog?.id).toBe('log-2');
  });

  it('correctly detects available vehicle status when not in active use', () => {
    const status = getVehicleFleetStatus('Mitsubishi Xpander', dummyLogs);
    // Disetujui is future schedule, not actively in use right now
    expect(status.conditionStatus).toBe('Tersedia');
    expect(status.statusLabel).toContain('Tersedia');
    expect(status.statusColor).toBe('emerald');
  });

  it('detects schedule conflict for overlapping time slots', () => {
    // Requesting Xpander on 2026-08-15 from 09:00 to 14:00 (overlaps with 08:00 - 12:00)
    const checkOverlap = checkVehicleAvailability(
      'Mitsubishi Xpander',
      '2026-08-15',
      '09:00',
      '2026-08-15',
      '14:00',
      dummyLogs
    );

    expect(checkOverlap.isAvailable).toBe(false);
    expect(checkOverlap.reason).toContain('Budi Santoso');
  });

  it('allows scheduling when times do not overlap', () => {
    // Requesting Xpander on 2026-08-15 from 13:00 to 17:00 (after 12:00)
    const checkNoOverlap = checkVehicleAvailability(
      'Mitsubishi Xpander',
      '2026-08-15',
      '13:00',
      '2026-08-15',
      '17:00',
      dummyLogs
    );

    expect(checkNoOverlap.isAvailable).toBe(true);
  });

  it('correctly calculates distance KM and handles boundary conditions', () => {
    expect(calculateDistanceKm(25300, 25365)).toBe(65);
    expect(calculateDistanceKm(25300, 25300)).toBe(0);
    expect(calculateDistanceKm(25300, 25200)).toBe(0); // non-negative safeguard
    expect(calculateDistanceKm(undefined, 25000)).toBe(0);
  });

  it('provides complete pre-trip and return checklists', () => {
    const pre = getDefaultPreChecklist();
    expect(pre.ban).toBe('Baik');
    expect(pre.rem).toBe('Baik');
    expect(pre.dokumen).toContain('STNK');

    const ret = getDefaultReturnChecklist(25000);
    expect(ret.adaKerusakan).toBe(false);
    expect(ret.kmAkhir).toBe(25030);
  });

  it('provides clean badges for all SOP statuses', () => {
    expect(getVehicleLogStatusBadge('Menunggu Persetujuan').label).toBe('Menunggu Persetujuan');
    expect(getVehicleLogStatusBadge('Disetujui').label).toBe('Disetujui');
    expect(getVehicleLogStatusBadge('Sedang Digunakan').label).toBe('Sedang Digunakan');
    expect(getVehicleLogStatusBadge('Sudah Kembali').label).toBe('Selesai');
  });
});
