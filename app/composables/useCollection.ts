export const useCollection = () => {
  const collection = useState<Collection>("fwc-collection", () => ({}));
  const filter = useState<FilterMode>("fwc-filter", () => "all");

  function getCount(stickerId: string): number {
    return collection.value[stickerId] ?? 0;
  }

  function increment(stickerId: string) {
    collection.value = {
      ...collection.value,
      [stickerId]: getCount(stickerId) + 1,
    };
  }

  function decrement(stickerId: string) {
    const current = getCount(stickerId);
    if (current <= 0) return;
    collection.value = {
      ...collection.value,
      [stickerId]: current - 1,
    };
  }

  function resetCount(stickerId: string) {
    collection.value = {
      ...collection.value,
      [stickerId]: 0,
    };
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
    getCount,
    increment,
    decrement,
    resetCount,
    stats,
    progress,
    filterStickers,
  };
};
