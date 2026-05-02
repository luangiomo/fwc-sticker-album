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
});

function normalizeUiConfig(raw: LocalAppConfig | null | undefined): LocalAppConfig {
  const base = defaultUiConfig();
  const f = raw?.filter;
  const s = raw?.groupSort;
  base.filter =
    f === "all" || f === "missing" || f === "duplicates" ? f : base.filter;
  base.groupSort =
    s === "default" || s === "alphabetic" || s === "owned" ? s : base.groupSort;
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

  function getCount(stickerId: string): number {
    return collection.value?.[stickerId] ?? 0;
  }

  function increment(stickerId: string) {
    const cur = collection.value ?? {};
    collection.value = {
      ...cur,
      [stickerId]: getCount(stickerId) + 1,
    };
  }

  function decrement(stickerId: string) {
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
    const cur = collection.value ?? {};
    if (!(stickerId in cur)) return;
    const { [stickerId]: _, ...rest } = cur;
    collection.value = rest;
  }

  function clearCollection() {
    collection.value = {};
  }

  /** Replaces the whole cookie-backed collection (e.g. import on another device). */
  function replaceCollection(next: Collection) {
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
    Math.round((stats.value.owned / allStickers.value.length) * 100),
  );

  function filterStickers(stickers: Sticker[]): Sticker[] {
    switch (filter.value) {
      case "missing":
        return stickers.filter((s) => getCount(s.code) === 0);
      case "duplicates":
        return stickers.filter((s) => getCount(s.code) > 1);
      default:
        return stickers;
    }
  }

  return {
    collection,
    filter,
    groupSort,
    getCount,
    increment,
    decrement,
    resetCount,
    clearCollection,
    replaceCollection,
    stats,
    progress,
    filterStickers,
  };
};
