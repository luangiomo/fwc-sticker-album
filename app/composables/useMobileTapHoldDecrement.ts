/**
 * Narrow / mobile layout: touch or pen — quick tap runs onTap; hold past threshold
 * runs onLongPress once. Mouse is ignored here so click / contextmenu handle desktop.
 * When isMobileGestureEnabled is false (e.g. lg breakpoint), all handlers no-op.
 */
export function useMobileTapHoldDecrement(
  isMobileGestureEnabled: () => boolean,
  holdMs = 450,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let longPressFired = false;
  let skipFollowingClick = false;

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  /** Call from @click when !lg: drops the synthetic click after touch tap or long-press. */
  function consumeSkipFollowingClick(): boolean {
    if (!skipFollowingClick) return false;
    skipFollowingClick = false;
    return true;
  }

  function onPointerDown(e: PointerEvent, onLongPress: () => void) {
    if (!isMobileGestureEnabled()) return;
    if (e.button !== 0) return;
    if (e.pointerType === "mouse") return;
    longPressFired = false;
    clearTimer();
    (e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId);
    timer = window.setTimeout(() => {
      timer = null;
      longPressFired = true;
      onLongPress();
    }, holdMs);
  }

  function onPointerUp(e: PointerEvent, onTap: () => void) {
    if (!isMobileGestureEnabled()) return;
    if (e.pointerType === "mouse") return;
    try {
      (e.currentTarget as HTMLElement | null)?.releasePointerCapture?.(
        e.pointerId,
      );
    } catch {
      /* not always captured */
    }
    clearTimer();
    if (longPressFired) {
      longPressFired = false;
      skipFollowingClick = true;
      return;
    }
    onTap();
    skipFollowingClick = true;
  }

  function onPointerCancel() {
    if (!isMobileGestureEnabled()) return;
    clearTimer();
    longPressFired = false;
  }

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    consumeSkipFollowingClick,
  };
}
