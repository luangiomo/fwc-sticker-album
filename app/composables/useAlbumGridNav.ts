import {
  ensureVisibleBelowSticky,
  scrollIntoViewBelowSticky,
} from "~/utils/scrollBelowSticky";

type AlbumGridCell = { key: string; sticker: Sticker };

type GridGroup = {
  id: string;
  name: string;
  slug: string;
  gridCells: AlbumGridCell[];
};

function stickerMatchScore(sticker: Sticker, q: string): number {
  if (!q) return -1;
  const code = sticker.code.toLowerCase();
  const name = sticker.name.toLowerCase();
  if (code === q || name === q) return 100;
  if (code.startsWith(q) || name.startsWith(q)) return 80;
  if (code.includes(q) || name.includes(q)) return 50;
  return -1;
}

const STICKER_FIND_INPUT_ID = "sticker-find-input";
const STICKER_FIND_SELECTOR = "[data-sticker-find]";
const STICKER_FIND_DEBOUNCE_MS = 800;

export type AlbumGridNavOptions = {
  /** Enter/Espaço na grade: abre modal de quantidade (aba normal). */
  onStickerQuantityOpen?: (sticker: Sticker) => void;
};

export const useAlbumGridNav = (
  gridGroups: Ref<GridGroup[]> | ComputedRef<GridGroup[]>,
  opts?: AlbumGridNavOptions,
) => {
  const isDesktopNav = useLgUp();

  const focusGroupIndex = ref(-1);
  const focusStickerIndex = ref(-1);
  const searchOpen = ref(false);
  const stickerFindOpen = ref(false);
  const stickerFindQuery = ref("");
  const debouncedFindQuery = ref("");

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function clearFindDebounce() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  const { increment, resetCount, decrement, filter } = useCollection();

  const focusedStickerId = computed(() => {
    const group = gridGroups.value[focusGroupIndex.value];
    return (
      group?.gridCells[focusStickerIndex.value]?.sticker.code ?? null
    );
  });

  const findMatchSummary = computed(() => {
    if (!stickerFindOpen.value) return "";
    const live = stickerFindQuery.value.trim();
    if (!live) return "";
    const deb = debouncedFindQuery.value.trim();
    if (live !== deb) return "Aguardando…";
    const q = deb.toLowerCase();
    let bestScore = -1;
    let best: { gi: number; si: number } | null = null;
    const groups = gridGroups.value;
    for (let gi = 0; gi < groups.length; gi++) {
      const cells = groups[gi]?.gridCells ?? [];
      for (let si = 0; si < cells.length; si++) {
        const score = stickerMatchScore(cells[si]!.sticker, q);
        if (score > bestScore) {
          bestScore = score;
          best = { gi, si };
        }
      }
    }
    if (!best || bestScore < 0) return "Nenhuma figurinha encontrada";
    const g = groups[best.gi];
    const s = g?.gridCells[best.si]?.sticker;
    if (!g || !s) return "";
    return `${g.name} · ${s.code}`;
  });

  function clampCol(groupIdx: number, col: number): number {
    const len = gridGroups.value[groupIdx]?.gridCells.length ?? 0;
    if (len === 0) return -1;
    return Math.min(col, len - 1);
  }

  function setFocus(gIdx: number, sIdx: number) {
    focusGroupIndex.value = gIdx;
    focusStickerIndex.value = sIdx;
    if (!isDesktopNav.value) return;
    nextTick(() => {
      const el = document.querySelector(
        `[data-grid-pos="${gIdx}-${sIdx}"]`
      ) as HTMLElement | null;
      el?.focus({ preventScroll: true });
      if (el) ensureVisibleBelowSticky(el, "smooth");
    });
  }

  function goToGroup(groupIdx: number, stickerIdx = 0) {
    const g = gridGroups.value[groupIdx];
    if (!g) return;
    const col = clampCol(groupIdx, stickerIdx);
    if (col < 0) return;
    setFocus(groupIdx, col);
  }

  function findNextNonEmptyGroup(from: number, direction: 1 | -1): number {
    let idx = from + direction;
    while (idx >= 0 && idx < gridGroups.value.length) {
      if (gridGroups.value[idx]!.gridCells.length > 0) return idx;
      idx += direction;
    }
    return -1;
  }

  function applyStickerFindMatch() {
    if (!stickerFindOpen.value) return;
    const q = debouncedFindQuery.value.trim().toLowerCase();
    if (!q) return;
    let bestScore = -1;
    let best: { gi: number; si: number } | null = null;
    const groups = gridGroups.value;
    for (let gi = 0; gi < groups.length; gi++) {
      const cells = groups[gi]?.gridCells ?? [];
      for (let si = 0; si < cells.length; si++) {
        const score = stickerMatchScore(cells[si]!.sticker, q);
        if (score > bestScore) {
          bestScore = score;
          best = { gi, si };
        }
      }
    }
    if (!best || bestScore < 0) return;
    const g = groups[best.gi];
    if (!g) return;
    const groupEl = document.getElementById(g.id);
    if (groupEl) scrollIntoViewBelowSticky(groupEl, { block: "start" });
    goToGroup(best.gi, best.si);
    closeStickerFind();
  }

  function focusStickerFindInput() {
    nextTick(() => {
      const root = document.querySelector(STICKER_FIND_SELECTOR);
      const input =
        (root instanceof HTMLInputElement
          ? root
          : root?.querySelector("input")) ?? null;
      input?.focus();
    });
  }

  function afterIncrementSticker() {
    if (stickerFindOpen.value) closeStickerFind();
  }

  function openStickerFind(seed?: string) {
    stickerFindOpen.value = true;
    if (seed !== undefined) stickerFindQuery.value = seed;
    focusStickerFindInput();
  }

  function closeStickerFind() {
    clearFindDebounce();
    stickerFindOpen.value = false;
    stickerFindQuery.value = "";
    debouncedFindQuery.value = "";
    document
      .querySelector(STICKER_FIND_SELECTOR)
      ?.querySelector("input")
      ?.blur();
    const gIdx = focusGroupIndex.value;
    const sIdx = focusStickerIndex.value;
    if (gIdx >= 0 && sIdx >= 0) {
      nextTick(() => setFocus(gIdx, sIdx));
    }
  }

  watch(stickerFindQuery, () => {
    if (!stickerFindOpen.value) return;
    clearFindDebounce();
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      debouncedFindQuery.value = stickerFindQuery.value;
    }, STICKER_FIND_DEBOUNCE_MS);
  });

  watch([debouncedFindQuery, gridGroups, stickerFindOpen], () => {
    if (!stickerFindOpen.value) return;
    applyStickerFindMatch();
  });

  onScopeDispose(() => clearFindDebounce());

  function moveRight() {
    const groups = gridGroups.value;
    const gLen = groups.length;
    if (gLen === 0) return;

    if (focusGroupIndex.value < 0) {
      goToGroup(findNextNonEmptyGroup(-1, 1), 0);
      return;
    }

    const row = groups[focusGroupIndex.value];
    if (row && focusStickerIndex.value < row.gridCells.length - 1) {
      setFocus(focusGroupIndex.value, focusStickerIndex.value + 1);
    }
  }

  function moveLeft() {
    if (focusGroupIndex.value < 0) return;
    if (focusStickerIndex.value > 0) {
      setFocus(focusGroupIndex.value, focusStickerIndex.value - 1);
    }
  }

  function moveDown() {
    const groups = gridGroups.value;
    if (groups.length === 0) return;

    if (focusGroupIndex.value < 0) {
      goToGroup(findNextNonEmptyGroup(-1, 1), 0);
      return;
    }

    const next = findNextNonEmptyGroup(focusGroupIndex.value, 1);
    if (next >= 0) {
      setFocus(next, clampCol(next, focusStickerIndex.value));
    }
  }

  function moveUp() {
    if (focusGroupIndex.value < 0) return;

    const prev = findNextNonEmptyGroup(focusGroupIndex.value, -1);
    if (prev >= 0) {
      setFocus(prev, clampCol(prev, focusStickerIndex.value));
    }
  }

  function focusNext() {
    const groups = gridGroups.value;
    if (groups.length === 0) return;

    if (focusGroupIndex.value < 0) {
      goToGroup(findNextNonEmptyGroup(-1, 1), 0);
      return;
    }

    const row = groups[focusGroupIndex.value];
    if (row && focusStickerIndex.value < row.gridCells.length - 1) {
      setFocus(focusGroupIndex.value, focusStickerIndex.value + 1);
    } else {
      const next = findNextNonEmptyGroup(focusGroupIndex.value, 1);
      if (next >= 0) setFocus(next, 0);
    }
  }

  function focusPrev() {
    if (focusGroupIndex.value < 0) return;

    if (focusStickerIndex.value > 0) {
      setFocus(focusGroupIndex.value, focusStickerIndex.value - 1);
    } else {
      const prev = findNextNonEmptyGroup(focusGroupIndex.value, -1);
      if (prev >= 0) {
        const len = gridGroups.value[prev]!.gridCells.length;
        setFocus(prev, len - 1);
      }
    }
  }

  function clearFocus() {
    focusGroupIndex.value = -1;
    focusStickerIndex.value = -1;
  }

  function isInsideEditable(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    return target.isContentEditable;
  }

  function activeInStickerFindInput(): boolean {
    const el = document.activeElement;
    return !!(
      el &&
      el instanceof HTMLElement &&
      el.closest(STICKER_FIND_SELECTOR)
    );
  }

  function isPrintableFindSeed(key: string): boolean {
    if (key.length !== 1 || key === " ") return false;
    const c = key.codePointAt(0)!;
    return c >= 0x20 && c !== 0x7f;
  }

  function toggleStickerFind() {
    if (stickerFindOpen.value) closeStickerFind();
    else {
      searchOpen.value = false;
      openStickerFind();
    }
  }

  function enterStickerSearchMode() {
    searchOpen.value = false;
    openStickerFind();
  }

  const searchModeActive = computed(
    () => searchOpen.value || stickerFindOpen.value
  );

  function exitSearchMode() {
    if (searchOpen.value) {
      searchOpen.value = false;
      return;
    }
    if (stickerFindOpen.value) closeStickerFind();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.defaultPrevented) return;
    if (!isDesktopNav.value) return;

    const keyLower = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const mod = e.metaKey || e.ctrlKey;

    if (e.key === "Escape" && (stickerFindOpen.value || searchOpen.value)) {
      e.preventDefault();
      exitSearchMode();
      return;
    }

    if (mod && e.shiftKey && keyLower === "k") {
      e.preventDefault();
      if (stickerFindOpen.value) closeStickerFind();
      searchOpen.value = true;
      return;
    }

    if (mod && !e.shiftKey && keyLower === "k") {
      e.preventDefault();
      toggleStickerFind();
      return;
    }

    if (mod && keyLower === "f") {
      e.preventDefault();
      toggleStickerFind();
      return;
    }

    if (searchOpen.value) return;

    const inFindInput = activeInStickerFindInput();
    const passFindInputToGrid =
      stickerFindOpen.value &&
      inFindInput &&
      (e.key === "Enter" ||
        e.key === " " ||
        e.key === "Tab" ||
        ((e.key === "ArrowRight" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowUp") &&
          !e.shiftKey));

    if (inFindInput && !passFindInputToGrid) return;

    if (!passFindInputToGrid && isInsideEditable(e.target)) return;

    if (
      !stickerFindOpen.value &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      isPrintableFindSeed(e.key)
    ) {
      e.preventDefault();
      openStickerFind(e.key);
      return;
    }

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        moveRight();
        break;
      case "ArrowLeft":
        e.preventDefault();
        moveLeft();
        break;
      case "ArrowDown":
        e.preventDefault();
        moveDown();
        break;
      case "ArrowUp":
        e.preventDefault();
        moveUp();
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) focusPrev();
        else focusNext();
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedStickerId.value) {
          if (filter.value === "duplicates") {
            decrement(focusedStickerId.value, {
              bypassStickerLock: true,
            });
          } else {
            const g = gridGroups.value[focusGroupIndex.value];
            const cell = g?.gridCells[focusStickerIndex.value];
            const sticker = cell?.sticker;
            if (sticker && opts?.onStickerQuantityOpen) {
              opts.onStickerQuantityOpen(sticker);
            } else {
              increment(focusedStickerId.value);
              afterIncrementSticker();
            }
          }
        }
        break;
      case "Backspace":
        e.preventDefault();
        if (focusedStickerId.value) {
          resetCount(focusedStickerId.value);
        }
        break;
      case "Escape":
        e.preventDefault();
        if (focusedStickerId.value) {
          resetCount(focusedStickerId.value);
        }
        break;
    }
  }

  watch(isDesktopNav, (desktop) => {
    if (!desktop) {
      clearFindDebounce();
      stickerFindOpen.value = false;
      searchOpen.value = false;
      stickerFindQuery.value = "";
      debouncedFindQuery.value = "";
      clearFocus();
    }
  });

  onMounted(() => {
    window.addEventListener("keydown", onKeydown);
    nextTick(() => {
      if (isDesktopNav.value) goToGroup(findNextNonEmptyGroup(-1, 1), 0);
    });
  });
  onUnmounted(() => window.removeEventListener("keydown", onKeydown));

  watch(gridGroups, () => {
    if (focusGroupIndex.value < 0) return;
    const groups = gridGroups.value;
    if (focusGroupIndex.value >= groups.length) {
      clearFocus();
      return;
    }
    const row = groups[focusGroupIndex.value];
    if (!row || row.gridCells.length === 0) {
      const next = findNextNonEmptyGroup(focusGroupIndex.value, 1);
      if (next >= 0) {
        setFocus(next, 0);
      } else {
        clearFocus();
      }
    } else {
      focusStickerIndex.value = clampCol(
        focusGroupIndex.value,
        focusStickerIndex.value
      );
    }
  });

  function cellTabindex(gIdx: number, sIdx: number): 0 | -1 {
    if (!isDesktopNav.value) return -1;
    return gIdx === focusGroupIndex.value && sIdx === focusStickerIndex.value
      ? 0
      : -1;
  }

  function cellGridPos(gIdx: number, sIdx: number): string {
    return `${gIdx}-${sIdx}`;
  }

  return {
    focusGroupIndex: readonly(focusGroupIndex),
    focusStickerIndex: readonly(focusStickerIndex),
    focusedStickerId,
    searchOpen,
    stickerFindOpen,
    stickerFindQuery,
    findMatchSummary,
    closeStickerFind,
    setFocus,
    goToGroup,
    clearFocus,
    cellTabindex,
    cellGridPos,
    STICKER_FIND_INPUT_ID,
    STICKER_FIND_SELECTOR,
    searchModeActive,
    exitSearchMode,
    enterStickerSearchMode,
    afterIncrementSticker,
  };
};
