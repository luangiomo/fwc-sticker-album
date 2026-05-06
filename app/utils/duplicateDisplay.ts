/** Cópias além da primeira (quantidade − 1): o que sobra para trocas. */
export function duplicateExtra(count: number): number {
  return count > 1 ? count - 1 : 0;
}

/** Selo "+N" nas células — igual a `duplicateExtra` (1 no álbum, o resto são repetidas). */
export function duplicateBadgeCount(count: number): number {
  return duplicateExtra(count);
}
