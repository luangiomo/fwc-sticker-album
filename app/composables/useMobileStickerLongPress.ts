/**
 * Toque longo (touch/stylus): decremento em mobile.
 * Ignora mouse (desktop usa clique / menu de contexto).
 */
export function useMobileStickerLongPress(
  isMobileLayout: () => boolean,
  holdMs = 450,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function pointerDown(e: PointerEvent, onLongPress: () => void) {
    if (!isMobileLayout()) return;
    if (e.button !== 0) return;
    if (e.pointerType === "mouse") return;
    clearTimer();
    (e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId);
    timer = window.setTimeout(() => {
      timer = null;
      onLongPress();
    }, holdMs);
  }

  function pointerUp(e: PointerEvent) {
    if (!isMobileLayout()) return;
    if (e.pointerType === "mouse") return;
    try {
      (e.currentTarget as HTMLElement | null)?.releasePointerCapture?.(
        e.pointerId,
      );
    } catch {
      /* not captured */
    }
    clearTimer();
  }

  function pointerCancel() {
    clearTimer();
  }

  return { pointerDown, pointerUp, pointerCancel };
}
