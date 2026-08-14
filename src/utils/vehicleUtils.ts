import { 
  VehicleLog, 
  VehicleType, 
  VehicleLogStatus, 
  VehicleConditionStatus, 
  VehicleChecklistItems, 
  VehicleReturnChecklist,
  ParkingLocation
} from '../types';

export interface VehicleFleetInfo {
  name: string;
  label: string;
  kapasitas: string;
  defaultLokasi: ParkingLocation;
  platNomor: string;
  image: string;
}

export const DEFAULT_FLEET: VehicleFleetInfo[] = [
  {
    name: 'Mitsubishi Xpander',
    label: 'Mobil 1 (Mitsubishi Xpander)',
    kapasitas: '7 Penumpang',
    defaultLokasi: 'Mabes',
    platNomor: 'B 1928 SBN',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&q=80',
  },
  {
    name: 'Daihatsu Xenia',
    label: 'Mobil 2 (Daihatsu Xenia)',
    kapasitas: '7 Penumpang',
    defaultLokasi: 'JV A',
    platNomor: 'B 2314 SBN',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&q=80',
  },
];

/**
 * Returns clean, intuitive status for a vehicle in the fleet
 */
export function getVehicleFleetStatus(
  vehicleName: string, 
  logs: VehicleLog[]
): {
  conditionStatus: VehicleConditionStatus;
  statusLabel: string;
  statusColor: 'emerald' | 'blue' | 'amber' | 'red';
  activeLog: VehicleLog | null;
  latestLog: VehicleLog | null;
  currentLocation: ParkingLocation | string;
  kmTerakhir: number;
  hasDamageIssue: boolean;
  kerusakanCatatan?: string;
} {
  // Sort logs by date desc
  const sortedLogs = [...logs]
    .filter(l => l.kendaraan === vehicleName && !l.isArchived)
    .sort((a, b) => new Date(b.updatedAt || b.tanggalMulai).getTime() - new Date(a.updatedAt || a.tanggalMulai).getTime());

  const latestLog = sortedLogs[0] || null;

  // 1. Check if currently in use (Sedang Digunakan / Siap Digunakan)
  const inUseLog = sortedLogs.find(
    l => l.status === 'Sedang Digunakan' || l.status === 'Siap Digunakan'
  );
  if (inUseLog) {
    return {
      conditionStatus: 'Sedang Digunakan',
      statusLabel: '🔵 Sedang Digunakan',
      statusColor: 'blue',
      activeLog: inUseLog,
      latestLog,
      currentLocation: inUseLog.lokasiParkir || (vehicleName.includes('Xpander') ? 'Mabes' : 'JV A'),
      kmTerakhir: inUseLog.kmAkhir || inUseLog.kmAwal || 25000,
      hasDamageIssue: false,
    };
  }

  // 2. Check if recent log reported damage/issue that flagged vehicle as Perlu Diperiksa
  const damagedLog = sortedLogs.find(
    l => (l.status === 'Perlu Diperiksa' || (l.adaKerusakan && l.status !== 'Selesai' && l.status !== 'Sudah Kembali'))
  );
  if (damagedLog) {
    return {
      conditionStatus: 'Perlu Diperiksa',
      statusLabel: '🟠 Perlu Diperiksa',
      statusColor: 'amber',
      activeLog: damagedLog,
      latestLog,
      currentLocation: damagedLog.lokasiParkir || (vehicleName.includes('Xpander') ? 'Mabes' : 'JV A'),
      kmTerakhir: damagedLog.kmAkhir || damagedLog.kmAwal || 25000,
      hasDamageIssue: true,
      kerusakanCatatan: damagedLog.penjelasanKerusakan || 'Ada catatan perbaikan yang perlu diperiksa pengurus.',
    };
  }

  // 3. Fallback: Tersedia
  const defaultLoc = vehicleName.includes('Xpander') ? 'Mabes' : 'JV A';
  return {
    conditionStatus: 'Tersedia',
    statusLabel: '🟢 Tersedia',
    statusColor: 'emerald',
    activeLog: null,
    latestLog,
    currentLocation: latestLog?.lokasiParkir || defaultLoc,
    kmTerakhir: latestLog?.kmAkhir || latestLog?.kmAwal || (vehicleName.includes('Xpander') ? 28450 : 34120),
    hasDamageIssue: false,
  };
}

/**
 * Check whether a vehicle has schedule conflict or issue
 */
export function checkVehicleAvailability(
  vehicleName: string,
  tanggalMulai: string,
  jamMulai: string,
  tanggalSelesai: string,
  jamSelesai: string,
  logs: VehicleLog[],
  excludeLogId?: string
): { isAvailable: boolean; reason?: string; conflictingLog?: VehicleLog } {
  if (!tanggalMulai || !jamMulai) {
    return { isAvailable: true };
  }

  const reqStart = new Date(`${tanggalMulai}T${jamMulai.padStart(5, '0')}:00`).getTime();
  const tSelesai = tanggalSelesai || tanggalMulai;
  const jSelesai = jamSelesai || '23:59';
  const reqEnd = new Date(`${tSelesai}T${jSelesai.padStart(5, '0')}:00`).getTime();

  if (isNaN(reqStart) || isNaN(reqEnd)) {
    return { isAvailable: true };
  }

  // Active or approved statuses that block time
  const activeStatuses: VehicleLogStatus[] = [
    'Menunggu Persetujuan',
    'Disetujui',
    'Siap Digunakan',
    'Sedang Digunakan'
  ];

  for (const log of logs) {
    if (log.id === excludeLogId || log.isArchived) continue;
    if (log.kendaraan !== vehicleName) continue;
    if (!activeStatuses.includes(log.status)) continue;

    const logStart = new Date(`${log.tanggalMulai}T${(log.jamMulai || '00:00').padStart(5, '0')}:00`).getTime();
    const logEnd = new Date(`${log.tanggalSelesai || log.tanggalMulai}T${(log.jamSelesai || '23:59').padStart(5, '0')}:00`).getTime();

    if (isNaN(logStart) || isNaN(logEnd)) continue;

    // Overlap condition: startA < endB && endA > startB
    if (reqStart < logEnd && reqEnd > logStart) {
      return {
        isAvailable: false,
        reason: `Sudah digunakan/dijadwalkan oleh ${log.namaPemakai} (${log.kegiatan || log.tujuan}) pada ${log.tanggalMulai} ${log.jamMulai}–${log.jamSelesai}`,
        conflictingLog: log,
      };
    }
  }

  // Also check if currently damaged
  const fleetStatus = getVehicleFleetStatus(vehicleName, logs);
  if (fleetStatus.conditionStatus === 'Perlu Diperiksa') {
    return {
      isAvailable: false,
      reason: `Kendaraan sedang ditandai "Perlu Diperiksa" (${fleetStatus.kerusakanCatatan || 'Perlu perbaikan'})`,
    };
  }

  return { isAvailable: true };
}

/**
 * Calculate distance in KM automatically
 */
export function calculateDistanceKm(kmAwal?: number, kmAkhir?: number): number {
  if (typeof kmAwal !== 'number' || typeof kmAkhir !== 'number') return 0;
  if (isNaN(kmAwal) || isNaN(kmAkhir)) return 0;
  return Math.max(0, kmAkhir - kmAwal);
}

/**
 * Default clean checklist for pre-trip inspection
 */
export function getDefaultPreChecklist(): VehicleChecklistItems {
  return {
    ban: 'Baik',
    rem: 'Baik',
    lampu: 'Baik',
    oli: 'Baik',
    airRadiator: 'Baik',
    bbm: '3/4 Tank',
    kebersihan: 'Bersih',
    perlengkapan: 'Lengkap',
    dokumen: 'Lengkap (STNK Ada)',
    kondisiFisik: 'Baik',
    catatan: 'Kendaraan siap beroperasi dengan baik.',
  };
}

/**
 * Default clean checklist for return inspection
 */
export function getDefaultReturnChecklist(kmAwal?: number): VehicleReturnChecklist {
  return {
    kondisiKendaraan: 'Baik',
    kebersihan: 'Bersih',
    bbm: '3/4 Tank',
    adaKerusakan: false,
    penjelasanKerusakan: '',
    kmAkhir: kmAwal ? kmAwal + 30 : 25100,
    catatan: 'Kendaraan dikembalikan dalam kondisi bersih dan aman.',
  };
}

/**
 * Helper to get clean badge styling for a vehicle log status
 */
export function getVehicleLogStatusBadge(status: VehicleLogStatus | string): {
  label: string;
  badgeClass: string;
  dotColor: string;
} {
  switch (status) {
    case 'Menunggu Persetujuan':
      return {
        label: 'Menunggu Persetujuan',
        badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
        dotColor: 'bg-amber-400',
      };
    case 'Disetujui':
      return {
        label: 'Disetujui',
        badgeClass: 'bg-blue-950/70 text-blue-300 border-blue-800/60',
        dotColor: 'bg-blue-400',
      };
    case 'Siap Digunakan':
      return {
        label: 'Siap Digunakan',
        badgeClass: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60',
        dotColor: 'bg-cyan-400',
      };
    case 'Sedang Digunakan':
      return {
        label: 'Sedang Digunakan',
        badgeClass: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60',
        dotColor: 'bg-indigo-400 animate-pulse',
      };
    case 'Sudah Kembali':
    case 'Selesai':
      return {
        label: 'Selesai',
        badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
        dotColor: 'bg-emerald-400',
      };
    case 'Perlu Diperiksa':
      return {
        label: 'Perlu Diperiksa',
        badgeClass: 'bg-orange-950/70 text-orange-300 border-orange-800/60',
        dotColor: 'bg-orange-400',
      };
    case 'Ditolak':
      return {
        label: 'Ditolak',
        badgeClass: 'bg-red-950/70 text-red-300 border-red-800/60',
        dotColor: 'bg-red-400',
      };
    case 'Dibatalkan':
      return {
        label: 'Dibatalkan',
        badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
        dotColor: 'bg-slate-500',
      };
    default:
      return {
        label: status || 'Tercatat',
        badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
        dotColor: 'bg-slate-400',
      };
  }
}
