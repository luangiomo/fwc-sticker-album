/**
 * Duplo toque na mesma figurinha dentro da janela de tempo (mobile).
 */
export function useStickerDoubleTap(ms = 450) {
  const last = ref<{ code: string; at: number } | null>(null);

  /** Devolve true se este toque completar um duplo toque (modal deve abrir). */
  function recordTap(sticker: Sticker): boolean {
    const now = Date.now();
    const code = sticker.code;
    if (last.value?.code === code && now - last.value.at < ms) {
      last.value = null;
      return true;
    }
    last.value = { code, at: now };
    return false;
  }

  function reset() {
    last.value = null;
  }

  return { recordTap, reset };
}
