import { describe, it, expect } from 'vitest';
import { selectActivePkbRule } from './pkbRuleSelector';
import { PkbRuleConfig, DEFAULT_PKB_RULE } from '../types/severance';

describe('pkbRuleSelector Unit Tests', () => {
  const pkb2024: PkbRuleConfig = {
    ...DEFAULT_PKB_RULE,
    id: 'pkb-2024',
    versionName: 'PKB 2024',
    effectiveFrom: '2024-01-01',
    effectiveUntil: '2024-12-31',
    isActive: true
  };

  const pkb2025: PkbRuleConfig = {
    ...DEFAULT_PKB_RULE,
    id: 'pkb-2025',
    versionName: 'PKB 2025',
    effectiveFrom: '2025-01-01',
    effectiveUntil: '2025-12-31',
    isActive: true
  };

  const pkb2026: PkbRuleConfig = {
    ...DEFAULT_PKB_RULE,
    id: 'pkb-2026',
    versionName: 'PKB 2026',
    effectiveFrom: '2026-01-01',
    effectiveUntil: '2026-12-31',
    isActive: true
  };

  const rules = [pkb2024, pkb2025, pkb2026];

  it('should select correct rule for case during effective period', () => {
    const selected = selectActivePkbRule(rules, '2025-06-15');
    expect(selected.versionName).toBe('PKB 2025');
  });

  it('should select earliest rule for case before effectiveFrom', () => {
    const selected = selectActivePkbRule(rules, '2023-05-10');
    expect(selected.versionName).toBe('PKB 2024');
  });

  it('should select latest rule for case after effectiveUntil', () => {
    const selected = selectActivePkbRule(rules, '2027-02-01');
    expect(selected.versionName).toBe('PKB 2026');
  });

  it('should fallback to DEFAULT_PKB_RULE if rules array is empty', () => {
    const selected = selectActivePkbRule([], '2026-08-13');
    expect(selected.versionName).toBe(DEFAULT_PKB_RULE.versionName);
  });
});
