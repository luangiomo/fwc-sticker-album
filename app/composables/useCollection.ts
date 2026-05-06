import type {
  Collection,
  FilterMode,
  GroupSortMode,
  LocalAppConfig,
} from "#shared/types/album";

const COOKIE_NAME = "fwc-collection";
const UI_COOKIE_NAME = "fwc-ui";

const defaultUiConfig = (): LocalAppConfig => ({
  filter: "all",
  groupSort: "default",
  stickerEditLocked: false,
  simpleHomeVisualization: false,
});

/** Legacy cookie key (same semantics as simpleHomeVisualization). */
type UiConfigRaw = LocalAppConfig & { hideHomeStickerGrid?: boolean };

function normalizeUiConfig(raw: UiConfigRaw | null | undefined): LocalAppConfig {
  const base = defaultUiConfig();
  const f = raw?.filter;
  const s = raw?.groupSort;
  base.filter =
    f === "all" || f === "missing"
      ? f
      : f === "duplicates"
        ? "all"
        : base.filter;
  base.groupSort =
    s === "default" || s === "alphabetic" || s === "owned" ? s : base.groupSort;
  base.stickerEditLocked = raw?.stickerEditLocked === true;
  base.simpleHomeVisualization =
    raw?.simpleHomeVisualization === true ||
    raw?.hideHomeStickerGrid === true;
  return base;
}

export const useCollection = () => {
  const collection = useCookie<Collection>(COOKIE_NAME, {
    default: () => ({}),
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });

  const localConfig = useCookie<LocalAppConfig>(UI_COOKIE_NAME, {
    default: () => defaultUiConfig(),
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });

  const filter = computed({
    get: () => normalizeUiConfig(localConfig.value).filter,
    set: (v: FilterMode) => {
      const next = normalizeUiConfig(localConfig.value);
      next.filter = v;
      localConfig.value = next;
    },
  });

  const groupSort = computed({
    get: () => normalizeUiConfig(localConfig.value).groupSort,
    set: (v: GroupSortMode) => {
      const next = normalizeUiConfig(localConfig.value);
      next.groupSort = v;
      localConfig.value = next;
    },
  });

  const stickerEditLocked = computed({
    get: () => normalizeUiConfig(localConfig.value).stickerEditLocked === true,
    set: (v: boolean) => {
      const next = normalizeUiConfig(localConfig.value);
      next.stickerEditLocked = v;
      localConfig.value = next;
    },
  });

  const simpleHomeVisualization = computed({
    get: () =>
      normalizeUiConfig(localConfig.value as UiConfigRaw)
        .simpleHomeVisualization === true,
    set: (v: boolean) => {
      const next = normalizeUiConfig(localConfig.value as UiConfigRaw);
      next.simpleHomeVisualization = v;
      localConfig.value = next;
    },
  });

  function getCount(stickerId: string): number {
    return collection.value?.[stickerId] ?? 0;
  }

  function increment(stickerId: string) {
    if (stickerEditLocked.value) return;
    const cur = collection.value ?? {};
    collection.value = {
      ...cur,
      [stickerId]: getCount(stickerId) + 1,
    };
  }

  function decrement(stickerId: string) {
    if (stickerEditLocked.value) return;
    const current = getCount(stickerId);
    if (current <= 0) return;
    const next = current - 1;
    const cur = collection.value ?? {};
    if (next === 0) {
      const { [stickerId]: _, ...rest } = cur;
      collection.value = rest;
    } else {
      collection.value = {
        ...cur,
        [stickerId]: next,
      };
    }
  }

  function resetCount(stickerId: string) {
    if (stickerEditLocked.value) return;
    const cur = collection.value ?? {};
    if (!(stickerId in cur)) return;
    const { [stickerId]: _, ...rest } = cur;
    collection.value = rest;
  }

  function clearCollection() {
    if (stickerEditLocked.value) return;
    collection.value = {};
  }

  function clearGroup(group: Group) {
    if (stickerEditLocked.value) return;
    const cur = { ...(collection.value ?? {}) };
    for (const s of group.stickers) {
      delete cur[s.code];
    }
    collection.value = cur;
  }

  /** Replaces the whole cookie-backed collection (e.g. import on another device). */
  function replaceCollection(next: Collection) {
    if (stickerEditLocked.value) return;
    const cleaned: Collection = {};
    for (const [code, count] of Object.entries(next)) {
      if (typeof count === "number" && Number.isInteger(count) && count > 0) {
        cleaned[code] = count;
      }
    }
    collection.value = cleaned;
  }

  const { allStickers } = useAlbum();

  const stats = computed(() => {
    let owned = 0;
    let missing = 0;
    let duplicates = 0;

    for (const s of allStickers.value) {
      const count = getCount(s.code);
      if (count === 0) missing++;
      else {
        owned++;
        duplicates += count - 1;
      }
    }

    return { owned, missing, duplicates };
  });

  const progress = computed(() =>
    Math.round((stats.value.owned / allStickers.value.length) * 100)
  );

  function filterStickers(stickers: Sticker[]): Sticker[] {
    switch (filter.value) {
      case "missing":
        return stickers.filter((s) => getCount(s.code) === 0);
      default:
        return stickers;
    }
  }

  return {
    collection,
    filter,
    groupSort,
    stickerEditLocked,
    simpleHomeVisualization,
    getCount,
    increment,
    decrement,
    resetCount,
    clearCollection,
    clearGroup,
    replaceCollection,
    stats,
    progress,
    filterStickers,
  };
};
