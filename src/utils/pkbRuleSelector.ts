import { PkbRuleConfig, DEFAULT_PKB_RULE } from '../types/severance';

/**
 * Selects the active PKB rule based on the case/calculation date and rule effective period.
 */
export function selectActivePkbRule(
  rules: PkbRuleConfig[] = [],
  caseDateStr: string
): PkbRuleConfig {
  if (!rules || rules.length === 0) {
    return DEFAULT_PKB_RULE;
  }

  const activeRules = rules.filter(r => r.isActive !== false);
  if (activeRules.length === 0) {
    return DEFAULT_PKB_RULE;
  }

  const dateStr = (caseDateStr || '').slice(0, 10);

  // 1. Exact match within effectiveFrom and effectiveUntil
  const exactMatches = activeRules.filter(rule => {
    const from = (rule.effectiveFrom || '').slice(0, 10);
    const until = (rule.effectiveUntil || '').slice(0, 10);
    const validFrom = !from || dateStr >= from;
    const validUntil = !until || dateStr <= until;
    return validFrom && validUntil;
  });

  if (exactMatches.length > 0) {
    // Return the latest effective rule
    return exactMatches.sort((a, b) =>
      (b.effectiveFrom || '').localeCompare(a.effectiveFrom || '')
    )[0];
  }

  // 2. If case date is before all rules, pick the earliest effective rule
  const sortedAsc = [...activeRules].sort((a, b) =>
    (a.effectiveFrom || '').localeCompare(b.effectiveFrom || '')
  );

  if (dateStr < (sortedAsc[0].effectiveFrom || '').slice(0, 10)) {
    return sortedAsc[0];
  }

  // 3. Otherwise pick the latest rule
  return sortedAsc[sortedAsc.length - 1];
}
