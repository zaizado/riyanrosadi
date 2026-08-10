import { repositories } from '../repositories';
import { SeveranceCalculationResult, PkbRuleConfig, DEFAULT_PKB_RULE } from '../types/severance';
import { AuditService } from './auditService';
import { UserAccount } from '../types';

export class SeveranceService {
  static async saveCalculation(item: SeveranceCalculationResult, user: UserAccount) {
    await repositories.severanceCalculations.save(item);
    await AuditService.createLog(
      user.name,
      user.role,
      'Simulasi Pesangon',
      'SIMPAN_SIMULASI_PESANGON',
      `Membuat simulasi pesangon untuk NIK ${item.nik} (${item.employeeName}) - Total: ${item.totalAmount}`
    );
  }

  static async deleteCalculation(id: string, nik: string, employeeName: string, user: UserAccount) {
    await repositories.severanceCalculations.delete(id);
    await AuditService.createLog(
      user.name,
      user.role,
      'Simulasi Pesangon',
      'HAPUS_SIMULASI_PESANGON',
      `Menghapus simulasi pesangon ID ${id} untuk NIK ${nik} (${employeeName})`
    );
  }

  static async savePkbRule(rule: PkbRuleConfig, user: UserAccount) {
    await repositories.severanceRules.save(rule);
    await AuditService.createLog(
      user.name,
      user.role,
      'Simulasi Pesangon',
      'UPDATE_ATURAN_PKB',
      `Memperbarui aturan PKB versi ${rule.versionName}`
    );
  }
}
