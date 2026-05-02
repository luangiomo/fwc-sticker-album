/** Cópias além da primeira (quantidade − 1). */
export function duplicateExtra(count: number): number {
  return count > 1 ? count - 1 : 0;
}

/**
 * Número exibido no selo "+N": o verde já indica 1 na coleção; a partir de 3
 * cópias extras (≥ 4 no total) o selo não conta uma delas (ex.: 4 no total → +2 em vez de +3).
 */
export function duplicateBadgeCount(count: number): number {
  const extra = duplicateExtra(count);
  if (extra <= 0) return 0;
  return extra >= 3 ? extra - 1 : extra;
}
