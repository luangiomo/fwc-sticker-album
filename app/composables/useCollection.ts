import { useLocalStorage } from "@vueuse/core";
import type {
  Collection,
  FilterMode,
  GroupSortMode,
  LocalAppConfig,
} from "#shared/types/album";

/** Legacy cookie name — collection lived here until mobile browsers hit ~4KB cookie limits. */
const LEGACY_COLLECTION_COOKIE = "fwc-collection";
/** Versioned key so future migrations stay predictable. */
const COLLECTION_STORAGE_KEY = "fwc-collection-v2";
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
    s === "default" ||
    s === "alphabetic" ||
    s === "owned" ||
    s === "ownedAsc"
      ? s
      : base.groupSort;
  base.stickerEditLocked = raw?.stickerEditLocked === true;
  base.simpleHomeVisualization =
    raw?.simpleHomeVisualization === true ||
    raw?.hideHomeStickerGrid === true;
  return base;
}

/** One bundle per app. Multiple `useCollection()` callers must share refs or UI can drift from persisted state. */
const cookieBundleByApp = new WeakMap<
  object,
  { collection: Ref<Collection>; localConfig: Ref<LocalAppConfig> }
>();

function resolvedCookieBundle() {
  const app = useNuxtApp();
  let bundle = cookieBundleByApp.get(app);
  if (bundle) return bundle;

  const collection = useLocalStorage<Collection>(COLLECTION_STORAGE_KEY, {}, {
    mergeDefaults: true,
  });

  const legacyCollectionCookie = useCookie<Collection | null>(
    LEGACY_COLLECTION_COOKIE,
    {
      default: () => null,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365 * 5,
    },
  );

  if (import.meta.client) {
    const legacy = legacyCollectionCookie.value;
    const legacyKeys =
      legacy && typeof legacy === "object" ? Object.keys(legacy) : [];
    if (Object.keys(collection.value).length === 0 && legacyKeys.length > 0) {
      collection.value = { ...legacy! };
    }
    if (legacyKeys.length > 0) {
      legacyCollectionCookie.value = null;
    }
  }

  const localConfig = useCookie<LocalAppConfig>(UI_COOKIE_NAME, {
    default: () => defaultUiConfig(),
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });

  bundle = { collection, localConfig };
  cookieBundleByApp.set(app, bundle);
  return bundle;
}

export const useCollection = () => {
  const { collection, localConfig } = resolvedCookieBundle();

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

  /** Replaces the whole persisted collection (e.g. import on another device). */
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
