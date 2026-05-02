type GridGroup = { id: string; stickers: Sticker[] };

export const useAlbumGridNav = (
  gridGroups: Ref<GridGroup[]> | ComputedRef<GridGroup[]>,
) => {
  const focusGroupIndex = ref(-1);
  const focusStickerIndex = ref(-1);
  const searchOpen = ref(false);

  const { increment, resetCount } = useCollection();

  const focusedStickerId = computed(() => {
    const group = gridGroups.value[focusGroupIndex.value];
    return group?.stickers[focusStickerIndex.value]?.code ?? null;
  });

  function clampCol(groupIdx: number, col: number): number {
    const len = gridGroups.value[groupIdx]?.stickers.length ?? 0;
    if (len === 0) return -1;
    return Math.min(col, len - 1);
  }

  function setFocus(gIdx: number, sIdx: number) {
    focusGroupIndex.value = gIdx;
    focusStickerIndex.value = sIdx;
    nextTick(() => {
      const el = document.querySelector(
        `[data-grid-pos="${gIdx}-${sIdx}"]`,
      ) as HTMLElement | null;
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
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
      if (gridGroups.value[idx].stickers.length > 0) return idx;
      idx += direction;
    }
    return -1;
  }

  function moveRight() {
    const groups = gridGroups.value;
    const gLen = groups.length;
    if (gLen === 0) return;

    if (focusGroupIndex.value < 0) {
      goToGroup(findNextNonEmptyGroup(-1, 1), 0);
      return;
    }

    const row = groups[focusGroupIndex.value];
    if (focusStickerIndex.value < row.stickers.length - 1) {
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
    if (focusStickerIndex.value < row.stickers.length - 1) {
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
        const len = gridGroups.value[prev].stickers.length;
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

  function onKeydown(e: KeyboardEvent) {
    if (e.defaultPrevented) return;

    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      searchOpen.value = true;
      return;
    }

    if (searchOpen.value) return;
    if (isInsideEditable(e.target)) return;

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
      case " ":
      case "Enter":
        e.preventDefault();
        if (focusedStickerId.value) {
          increment(focusedStickerId.value);
        }
        break;
      case "Escape":
      case "Backspace":
        e.preventDefault();
        if (focusedStickerId.value) {
          resetCount(focusedStickerId.value);
        }
        break;
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", onKeydown);
    goToGroup(findNextNonEmptyGroup(-1, 1), 0);
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
    if (row.stickers.length === 0) {
      const next = findNextNonEmptyGroup(focusGroupIndex.value, 1);
      if (next >= 0) {
        setFocus(next, 0);
      } else {
        clearFocus();
      }
    } else {
      focusStickerIndex.value = clampCol(
        focusGroupIndex.value,
        focusStickerIndex.value,
      );
    }
  });

  function cellTabindex(gIdx: number, sIdx: number): 0 | -1 {
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
    setFocus,
    goToGroup,
    clearFocus,
    cellTabindex,
    cellGridPos,
  };
};
