/** Cópias além da primeira (quantidade − 1): o que sobra para trocas. */
export function duplicateExtra(count: number): number {
  return count > 1 ? count - 1 : 0;
}
