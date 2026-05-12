import { scrollIntoViewBelowSticky } from "~/utils/scrollBelowSticky";

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

export const useAlbumGridNav = (
  gridGroups: Ref<GridGroup[]> | ComputedRef<GridGroup[]>,
) => {
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

  function applyStickerFindMatch() {
    if (!stickerFindOpen.value) return;
    const q = debouncedFindQuery.value.trim().toLowerCase();
    if (!q) return;
    let bestScore = -1;
    let best: { gi: number; si: number; cellKey: string } | null = null;
    const groups = gridGroups.value;
    for (let gi = 0; gi < groups.length; gi++) {
      const cells = groups[gi]?.gridCells ?? [];
      for (let si = 0; si < cells.length; si++) {
        const score = stickerMatchScore(cells[si]!.sticker, q);
        if (score > bestScore) {
          bestScore = score;
          const cell = cells[si];
          if (cell) best = { gi, si, cellKey: cell.key };
        }
      }
    }
    if (!best || bestScore < 0) return;
    const g = gridGroups.value[best.gi];
    if (!g) return;
    const groupEl = document.getElementById(g.id);
    if (groupEl) scrollIntoViewBelowSticky(groupEl, { block: "start" });
    const cellKey = best.cellKey;
    nextTick(() => {
      const matchEl = document.querySelector(
        `[data-sticker-cell-key="${CSS.escape(cellKey)}"]`,
      ) as HTMLElement | null;
      if (matchEl) {
        scrollIntoViewBelowSticky(matchEl, {
          behavior: "smooth",
          block: "center",
        });
      }
    });
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
    () => searchOpen.value || stickerFindOpen.value,
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
    if (inFindInput) return;

    if (isInsideEditable(e.target)) return;

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
  }

  onMounted(() => {
    window.addEventListener("keydown", onKeydown);
  });
  onUnmounted(() => window.removeEventListener("keydown", onKeydown));

  return {
    searchOpen,
    stickerFindOpen,
    stickerFindQuery,
    findMatchSummary,
    closeStickerFind,
    STICKER_FIND_INPUT_ID,
    STICKER_FIND_SELECTOR,
    searchModeActive,
    exitSearchMode,
    enterStickerSearchMode,
  };
};
