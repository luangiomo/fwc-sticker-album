/** Cópias além da primeira (quantidade − 1). */
export function duplicateExtra(count: number): number {
  return count > 1 ? count - 1 : 0;
}

/**
 * Número exibido no selo "+N": o slot verde já representa uma unidade; o selo
 * mostra cópias além dessa, menos uma “referência” (troca comum no álbum).
 * Ex.: 2 → +1, 3 → +1, 4 → +2, 5 → +3.
 */
export function duplicateBadgeCount(count: number): number {
  const extra = duplicateExtra(count);
  if (extra <= 0) return 0;
  if (extra === 1) return 1;
  return extra - 1;
}
